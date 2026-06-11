import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

function getAdmin(): admin.app.App {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'lughaapp',
    });
  }
  return admin.app();
}

export const refreshUserClaims = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const uid = request.auth.uid;
  const userSnap = await getAdmin().firestore().doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User profile not found.');
  }

  const { orgId, role } = userSnap.data() as { orgId: string; role: string };
  await getAdmin().auth().setCustomUserClaims(uid, { orgId, role });

  return { orgId, role };
});
