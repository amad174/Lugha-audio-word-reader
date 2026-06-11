"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshUserClaims = exports.uploadStorageFile = void 0;
const crypto_1 = require("crypto");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const BUCKET = 'lughaapp.firebasestorage.app';
function ensureAdmin() {
    if ((0, app_1.getApps)().length === 0) {
        (0, app_1.initializeApp)({ storageBucket: BUCKET });
    }
}
async function requireTeacher(uid, orgId) {
    ensureAdmin();
    const userSnap = await (0, firestore_1.getFirestore)().doc(`users/${uid}`).get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'User profile not found.');
    }
    const user = userSnap.data();
    if (user.role !== 'teacher' || user.orgId !== orgId) {
        throw new https_1.HttpsError('permission-denied', 'Only teachers can upload files.');
    }
}
function orgIdFromPath(path) {
    const match = /^orgs\/([^/]+)\/books\//.exec(path);
    return match ? match[1] : null;
}
async function setClaimsFromUserDoc(uid) {
    ensureAdmin();
    const userSnap = await (0, firestore_1.getFirestore)().doc(`users/${uid}`).get();
    if (!userSnap.exists)
        return null;
    const { orgId, role } = userSnap.data();
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { orgId, role });
    return { orgId, role };
}
/** Upload a file to Storage using Admin SDK (bypasses client Storage rules). */
exports.uploadStorageFile = (0, https_1.onCall)({ invoker: 'public' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required.');
    }
    const { path, contentType, dataBase64 } = request.data;
    if (!path || !dataBase64 || typeof path !== 'string' || typeof dataBase64 !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'path and dataBase64 are required.');
    }
    const orgId = orgIdFromPath(path);
    if (!orgId) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid storage path.');
    }
    await requireTeacher(request.auth.uid, orgId);
    const token = (0, crypto_1.randomUUID)();
    const buffer = Buffer.from(dataBase64, 'base64');
    ensureAdmin();
    const file = (0, storage_1.getStorage)().bucket(BUCKET).file(path);
    await file.save(buffer, {
        metadata: {
            contentType: contentType || 'application/octet-stream',
            metadata: { firebaseStorageDownloadTokens: token },
        },
    });
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return { downloadUrl };
});
exports.refreshUserClaims = (0, https_1.onCall)({ invoker: 'public' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    try {
        const result = await setClaimsFromUserDoc(request.auth.uid);
        if (!result) {
            throw new https_1.HttpsError('not-found', 'User profile not found.');
        }
        return result;
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        console.error('refreshUserClaims failed', err);
        throw new https_1.HttpsError('internal', 'Could not refresh user permissions.');
    }
});
//# sourceMappingURL=index.js.map