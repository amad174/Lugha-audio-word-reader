"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshUserClaims = exports.syncClaimsOnUserWrite = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_2 = require("firebase-admin/firestore");
function ensureAdmin() {
    if ((0, app_1.getApps)().length === 0) {
        (0, app_1.initializeApp)();
    }
}
async function setClaimsFromUserDoc(uid) {
    ensureAdmin();
    const userSnap = await (0, firestore_2.getFirestore)().doc(`users/${uid}`).get();
    if (!userSnap.exists)
        return null;
    const { orgId, role } = userSnap.data();
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { orgId, role });
    return { orgId, role };
}
/** Keeps auth custom claims in sync whenever a user profile is written. */
exports.syncClaimsOnUserWrite = (0, firestore_1.onDocumentWritten)('users/{uid}', async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    if (!(data === null || data === void 0 ? void 0 : data.orgId) || !(data === null || data === void 0 ? void 0 : data.role))
        return;
    ensureAdmin();
    await (0, auth_1.getAuth)().setCustomUserClaims(event.params.uid, {
        orgId: data.orgId,
        role: data.role,
    });
});
exports.refreshUserClaims = (0, https_1.onCall)(async (request) => {
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