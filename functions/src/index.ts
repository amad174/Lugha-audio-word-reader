import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const BUCKET = 'lughaapp.firebasestorage.app';

if (!admin.apps.length) {
  admin.initializeApp({ storageBucket: BUCKET });
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket(BUCKET);

async function requireTeacher(uid: string, orgId: string): Promise<void> {
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }
  const user = userSnap.data() as { orgId: string; role: string };
  if (user.role !== 'teacher' || user.orgId !== orgId) {
    throw new HttpsError('permission-denied', 'Only teachers can upload files.');
  }
}

function orgIdFromPath(path: string): string | null {
  const match = /^orgs\/([^/]+)\/books\//.exec(path);
  return match ? match[1] : null;
}

async function setClaimsFromUserDoc(uid: string): Promise<{ orgId: string; role: string } | null> {
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) return null;

  const { orgId, role } = userSnap.data() as { orgId: string; role: string };
  await auth.setCustomUserClaims(uid, { orgId, role });
  return { orgId, role };
}

/** Upload a file to Storage using Admin SDK (bypasses client Storage rules). */
export const uploadStorageFile = onCall(
  { invoker: 'public', memory: '512MiB', timeoutSeconds: 120 },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Sign in required.');
      }

      const { path, contentType, dataBase64 } = request.data as {
        path: string;
        contentType: string;
        dataBase64: string;
      };

      if (!path || !dataBase64 || typeof path !== 'string' || typeof dataBase64 !== 'string') {
        throw new HttpsError('invalid-argument', 'path and dataBase64 are required.');
      }

      const orgId = orgIdFromPath(path);
      if (!orgId) {
        throw new HttpsError('invalid-argument', 'Invalid storage path.');
      }

      await requireTeacher(request.auth.uid, orgId);

      const token = randomUUID();
      const buffer = Buffer.from(dataBase64, 'base64');
      const file = bucket.file(path);
      await file.save(buffer, {
        metadata: {
          contentType: contentType || 'application/octet-stream',
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
      return { downloadUrl };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error('uploadStorageFile failed', err);
      throw new HttpsError('internal', 'Upload failed on server.');
    }
  }
);

/**
 * Read a file from Storage using the Admin SDK and return it base64-encoded.
 *
 * The browser cannot fetch() Storage download URLs unless CORS is configured on
 * the bucket (<img> tags work, but XHR/fetch is blocked). Book export needs to
 * read page images and audio back out, so it routes through here — mirroring
 * uploadStorageFile — which works regardless of bucket CORS.
 */
export const downloadStorageFile = onCall(
  { invoker: 'public', memory: '512MiB', timeoutSeconds: 120 },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Sign in required.');
      }

      const { path } = request.data as { path: string };
      if (!path || typeof path !== 'string') {
        throw new HttpsError('invalid-argument', 'path is required.');
      }

      const orgId = orgIdFromPath(path);
      if (!orgId) {
        throw new HttpsError('invalid-argument', 'Invalid storage path.');
      }

      await requireTeacher(request.auth.uid, orgId);

      const file = bucket.file(path);
      const [exists] = await file.exists();
      if (!exists) {
        throw new HttpsError('not-found', 'File not found.');
      }

      // Callable responses are capped at ~10MB; base64 inflates by ~33%.
      const [metadata] = await file.getMetadata();
      const size = Number(metadata.size ?? 0);
      if (size > 6 * 1024 * 1024) {
        throw new HttpsError('resource-exhausted', 'File too large to export.');
      }

      const [buffer] = await file.download();
      return {
        contentType: metadata.contentType || 'application/octet-stream',
        dataBase64: buffer.toString('base64'),
      };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error('downloadStorageFile failed', err);
      throw new HttpsError('internal', 'Download failed on server.');
    }
  }
);

export const refreshUserClaims = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  try {
    const result = await setClaimsFromUserDoc(request.auth.uid);
    if (!result) {
      throw new HttpsError('not-found', 'User profile not found.');
    }
    return result;
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error('refreshUserClaims failed', err);
    throw new HttpsError('internal', 'Could not refresh user permissions.');
  }
});
