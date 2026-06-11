import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { auth, functions, storage } from '../firebase/config';

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function shouldUseCallableUpload(): boolean {
  return (
    typeof window !== 'undefined' &&
    process.env.REACT_APP_USE_FIREBASE_EMULATOR !== 'true'
  );
}

async function uploadViaCallable(path: string, blob: Blob, contentType: string): Promise<string> {
  const dataBase64 = await blobToBase64(blob);
  const fn = httpsCallable<
    { path: string; contentType: string; dataBase64: string },
    { downloadUrl: string }
  >(functions, 'uploadStorageFile');
  const result = await fn({ path, contentType, dataBase64 });
  return result.data.downloadUrl;
}

function formatUploadError(err: unknown): never {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code);
    if (code.includes('storage/unauthorized') || code.includes('permission-denied')) {
      throw new Error('Upload denied. Only teachers can upload files for their organization.');
    }
    if (code === 'functions/unauthenticated') {
      throw new Error('Sign in required to upload files.');
    }
    if (code === 'functions/internal') {
      throw new Error('Upload failed on server. Please try again in a moment.');
    }
  }
  if (err instanceof Error && err.message && err.message !== 'internal') {
    throw err;
  }
  throw new Error('Upload failed. Please try again.');
}

async function uploadViaStorageEmulatorRest(
  path: string,
  blob: Blob,
  contentType: string
): Promise<string> {
  const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  if (!emulatorHost || !auth.currentUser) {
    throw new Error('Storage emulator upload requires auth and FIREBASE_STORAGE_EMULATOR_HOST.');
  }

  const token = await auth.currentUser.getIdToken(true);
  const bucket = storage.app.options.storageBucket!;
  const res = await fetch(
    `http://${emulatorHost}/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: blob,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storage emulator upload failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { name: string };
  return `http://${emulatorHost}/v0/b/${bucket}/o/${encodeURIComponent(json.name)}?alt=media`;
}

async function uploadBytesWithAuth(path: string, blob: Blob): Promise<string> {
  const contentType = blob.type || 'application/octet-stream';

  try {
    if (typeof window === 'undefined' && process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      return await uploadViaStorageEmulatorRest(path, blob, contentType);
    }

    if (shouldUseCallableUpload()) {
      return await uploadViaCallable(path, blob, contentType);
    }

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  } catch (err) {
    formatUploadError(err);
  }
}

export function pageImagePath(orgId: string, bookId: string, pageId: string): string {
  return `orgs/${orgId}/books/${bookId}/pages/${pageId}.jpg`;
}

export function audioPath(orgId: string, bookId: string, boxId: string): string {
  return `orgs/${orgId}/books/${bookId}/audio/${boxId}`;
}

export function coverPath(orgId: string, bookId: string): string {
  return `orgs/${orgId}/books/${bookId}/cover.jpg`;
}

export async function uploadDataUrl(path: string, dataUrl: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  return uploadBytesWithAuth(path, blob);
}

export async function uploadBlob(path: string, blob: Blob): Promise<string> {
  return uploadBytesWithAuth(path, blob);
}

export async function deleteStoragePath(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // file may not exist
  }
}

export async function deleteBookStorage(orgId: string, bookId: string): Promise<void> {
  const base = `orgs/${orgId}/books/${bookId}`;
  for (const sub of ['pages', 'audio']) {
    try {
      const folderRef = ref(storage, `${base}/${sub}`);
      const listing = await listAll(folderRef);
      await Promise.all(listing.items.map(item => deleteObject(item)));
    } catch {
      // folder may not exist
    }
  }
  await deleteStoragePath(`${base}/cover.jpg`);
}

export async function dataUrlFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
