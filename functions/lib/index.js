"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshUserClaims = exports.downloadStorageFile = exports.uploadStorageFile = void 0;
const crypto_1 = require("crypto");
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const BUCKET = 'lughaapp.firebasestorage.app';
if (!admin.apps.length) {
    admin.initializeApp({ storageBucket: BUCKET });
}
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket(BUCKET);
async function requireTeacher(uid, orgId) {
    const userSnap = await db.doc(`users/${uid}`).get();
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
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists)
        return null;
    const { orgId, role } = userSnap.data();
    await auth.setCustomUserClaims(uid, { orgId, role });
    return { orgId, role };
}
/** Upload a file to Storage using Admin SDK (bypasses client Storage rules). */
exports.uploadStorageFile = (0, https_1.onCall)({ invoker: 'public', memory: '512MiB', timeoutSeconds: 120 }, async (request) => {
    try {
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
        const file = bucket.file(path);
        await file.save(buffer, {
            metadata: {
                contentType: contentType || 'application/octet-stream',
                metadata: { firebaseStorageDownloadTokens: token },
            },
        });
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
        return { downloadUrl };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        console.error('uploadStorageFile failed', err);
        throw new https_1.HttpsError('internal', 'Upload failed on server.');
    }
});
/**
 * Read a file from Storage using the Admin SDK and return it base64-encoded.
 *
 * The browser cannot fetch() Storage download URLs unless CORS is configured on
 * the bucket (<img> tags work, but XHR/fetch is blocked). Book export needs to
 * read page images and audio back out, so it routes through here — mirroring
 * uploadStorageFile — which works regardless of bucket CORS.
 */
exports.downloadStorageFile = (0, https_1.onCall)({ invoker: 'public', memory: '512MiB', timeoutSeconds: 120 }, async (request) => {
    var _a;
    try {
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Sign in required.');
        }
        const { path } = request.data;
        if (!path || typeof path !== 'string') {
            throw new https_1.HttpsError('invalid-argument', 'path is required.');
        }
        const orgId = orgIdFromPath(path);
        if (!orgId) {
            throw new https_1.HttpsError('invalid-argument', 'Invalid storage path.');
        }
        await requireTeacher(request.auth.uid, orgId);
        const file = bucket.file(path);
        const [exists] = await file.exists();
        if (!exists) {
            throw new https_1.HttpsError('not-found', 'File not found.');
        }
        // Callable responses are capped at ~10MB; base64 inflates by ~33%.
        const [metadata] = await file.getMetadata();
        const size = Number((_a = metadata.size) !== null && _a !== void 0 ? _a : 0);
        if (size > 6 * 1024 * 1024) {
            throw new https_1.HttpsError('resource-exhausted', 'File too large to export.');
        }
        const [buffer] = await file.download();
        return {
            contentType: metadata.contentType || 'application/octet-stream',
            dataBase64: buffer.toString('base64'),
        };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        console.error('downloadStorageFile failed', err);
        throw new https_1.HttpsError('internal', 'Download failed on server.');
    }
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