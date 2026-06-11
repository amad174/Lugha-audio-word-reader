import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function ensureAdmin() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

async function setClaimsFromUserDoc(uid: string): Promise<{ orgId: string; role: string } | null> {
  ensureAdmin();
  const userSnap = await getFirestore().doc(`users/${uid}`).get();
  if (!userSnap.exists) return null;

  const { orgId, role } = userSnap.data() as { orgId: string; role: string };
  await getAuth().setCustomUserClaims(uid, { orgId, role });
  return { orgId, role };
}

/** Keeps auth custom claims in sync whenever a user profile is written. */
export const syncClaimsOnUserWrite = onDocumentWritten('users/{uid}', async (event) => {
  const data = event.data?.after.data() as { orgId?: string; role?: string } | undefined;
  if (!data?.orgId || !data?.role) return;
  ensureAdmin();
  await getAuth().setCustomUserClaims(event.params.uid, {
    orgId: data.orgId,
    role: data.role,
  });
});

export const refreshUserClaims = onCall(async (request) => {
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
