#!/usr/bin/env node
/** Backfill auth custom claims for all users in Firestore. Run once after deploy. */
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'lughaapp' });
}

async function main() {
  const snap = await getFirestore().collection('users').get();
  let updated = 0;

  for (const doc of snap.docs) {
    const { orgId, role, email } = doc.data();
    if (!orgId || !role) continue;
    await getAuth().setCustomUserClaims(doc.id, { orgId, role });
    updated += 1;
    console.log(`claims set for ${email || doc.id}`);
  }

  console.log(`Done. Updated ${updated} user(s).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
