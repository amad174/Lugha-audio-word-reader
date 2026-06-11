import { randomUUID } from 'crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const BUCKET = 'lughaapp.firebasestorage.app';

function ensureAdmin() {
  if (getApps().length === 0) {
    initializeApp({ storageBucket: BUCKET });
  }
}

async function requireTeacher(uid: string, orgId: string): Promise<void> {
  ensureAdmin();
  const userSnap = await getFirestore().doc(`users/${uid}`).get();
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
  ensureAdmin();
  const userSnap = await getFirestore().doc(`users/${uid}`).get();
  if (!userSnap.exists) return null;

  const { orgId, role } = userSnap.data() as { orgId: string; role: string };
  await getAuth().setCustomUserClaims(uid, { orgId, role });
  return { orgId, role };
}

/** Upload a file to Storage using Admin SDK (bypasses client Storage rules). */
export const uploadStorageFile = onCall({ invoker: 'public' }, async (request) => {
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

  ensureAdmin();
  const file = getStorage().bucket(BUCKET).file(path);
  await file.save(buffer, {
    metadata: {
      contentType: contentType || 'application/octet-stream',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return { downloadUrl };
});

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
