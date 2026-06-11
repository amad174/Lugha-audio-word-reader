import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

function getAdmin(): admin.app.App {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'lughaapp',
    });
  }
  return admin.app();
}

async function setClaimsFromUserDoc(uid: string): Promise<{ orgId: string; role: string } | null> {
  const userSnap = await getAdmin().firestore().doc(`users/${uid}`).get();
  if (!userSnap.exists) return null;

  const { orgId, role } = userSnap.data() as { orgId: string; role: string };
  await getAdmin().auth().setCustomUserClaims(uid, { orgId, role });
  return { orgId, role };
}

/** Keeps auth custom claims in sync whenever a user profile is written. */
export const syncClaimsOnUserWrite = onDocumentWritten('users/{uid}', async (event) => {
  const data = event.data?.after.data() as { orgId?: string; role?: string } | undefined;
  if (!data?.orgId || !data?.role) return;
  await getAdmin().auth().setCustomUserClaims(event.params.uid, {
    orgId: data.orgId,
    role: data.role,
  });
});

export const refreshUserClaims = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const result = await setClaimsFromUserDoc(request.auth.uid);
  if (!result) {
    throw new HttpsError('not-found', 'User profile not found.');
  }

  return result;
});
