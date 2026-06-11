import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const useEmulators =
  process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true' ||
  process.env.NODE_ENV === 'test';

const isIntegrationTest = process.env.FIREBASE_INTEGRATION_TEST === 'true';

function getOrInitApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0];
  if (!firebaseConfig.projectId && !useEmulators) {
    console.warn('Firebase config missing — set REACT_APP_FIREBASE_* env vars or enable emulators.');
  }
  return initializeApp(
    firebaseConfig.projectId
      ? firebaseConfig
      : {
          ...firebaseConfig,
          projectId: 'demo-lugha',
          apiKey: 'demo-key',
          authDomain: 'demo-lugha.firebaseapp.com',
          storageBucket: 'demo-lugha.appspot.com',
        }
  );
}

const app = getOrInitApp();

export const auth: Auth = getAuth(app);
export const db: Firestore = useEmulators
  ? getFirestore(app)
  : initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

let emulatorsConnected = false;

export function connectFirebaseEmulators(): void {
  if (emulatorsConnected || !useEmulators) return;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  emulatorsConnected = true;
}

if (useEmulators && (process.env.NODE_ENV !== 'test' || isIntegrationTest)) {
  connectFirebaseEmulators();
}

export default app;
