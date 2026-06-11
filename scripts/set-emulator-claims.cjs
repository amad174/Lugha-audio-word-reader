#!/usr/bin/env node
/**
 * Set Auth emulator custom claims (used by integration tests).
 * Usage: node scripts/set-emulator-claims.cjs <uid> <orgId> <role>
 */
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const [uid, orgId, role] = process.argv.slice(2);
if (!uid || !orgId || !role) {
  console.error('Usage: node scripts/set-emulator-claims.cjs <uid> <orgId> <role>');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'lughaapp',
  });
}

getAuth()
  .setCustomUserClaims(uid, { orgId, role })
  .then(() => {
    console.log('claims set');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
