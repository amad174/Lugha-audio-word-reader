import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { BookPage, AudioMapping, BoundingBox, StoredPage } from '../types';
import { updateBook, newPageId } from './libraryService';
import {
  uploadDataUrl,
  pageImagePath,
  audioPath,
  deleteStoragePath,
  deleteBookStorage,
} from './storageService';
import { pdfToDataUrls, countPdfPages } from '../utils/pdf';
import { dataUrlFromFile } from './storageService';

export function isPdfFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === 'application/pdf' || name.endsWith('.pdf');
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(file.name);
}

function pagesRef(orgId: string, bookId: string) {
  return collection(db, 'orgs', orgId, 'books', bookId, 'pages');
}

function audioRef(orgId: string, bookId: string) {
  return collection(db, 'orgs', orgId, 'books', bookId, 'audio');
}

export async function listPages(orgId: string, bookId: string): Promise<BookPage[]> {
  const q = query(pagesRef(orgId, bookId), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BookPage));
}

export async function getPage(orgId: string, bookId: string, pageId: string): Promise<BookPage | null> {
  const snap = await getDoc(doc(db, 'orgs', orgId, 'books', bookId, 'pages', pageId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BookPage;
}

export async function loadAudioMapping(orgId: string, bookId: string): Promise<AudioMapping> {
  const snap = await getDocs(audioRef(orgId, bookId));
  const mapping: AudioMapping = {};
  snap.docs.forEach(d => {
    mapping[d.id] = d.data().url as string;
  });
  return mapping;
}

export async function savePageBoxes(
  orgId: string,
  bookId: string,
  pageId: string,
  boxes: BoundingBox[]
): Promise<void> {
  await updateDoc(doc(db, 'orgs', orgId, 'books', bookId, 'pages', pageId), { boxes });
}

export async function assignAudio(
  orgId: string,
  bookId: string,
  boxId: string,
  dataUrl: string
): Promise<string> {
  const path = audioPath(orgId, bookId, boxId);
  const ext = dataUrl.includes('audio/mp4') ? '.mp4' : '.webm';
  const url = await uploadDataUrl(`${path}${ext}`, dataUrl);
  await setDoc(doc(db, 'orgs', orgId, 'books', bookId, 'audio', boxId), {
    url,
    updatedAt: Date.now(),
  });
  return url;
}

export async function deletePage(orgId: string, bookId: string, pageId: string, boxIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'orgs', orgId, 'books', bookId, 'pages', pageId));
  boxIds.forEach(boxId => {
    batch.delete(doc(db, 'orgs', orgId, 'books', bookId, 'audio', boxId));
  });
  await batch.commit();

  await deleteStoragePath(pageImagePath(orgId, bookId, pageId));
  await Promise.all(boxIds.map(id => deleteStoragePath(`${audioPath(orgId, bookId, id)}.webm`)));

  const pages = await listPages(orgId, bookId);
  await updateBook(orgId, bookId, { pageCount: pages.length });
}

export async function deleteBookWithStorage(orgId: string, bookId: string): Promise<void> {
  const pages = await listPages(orgId, bookId);
  const audio = await loadAudioMapping(orgId, bookId);
  const batch = writeBatch(db);
  pages.forEach(p => batch.delete(doc(db, 'orgs', orgId, 'books', bookId, 'pages', p.id)));
  Object.keys(audio).forEach(boxId =>
    batch.delete(doc(db, 'orgs', orgId, 'books', bookId, 'audio', boxId))
  );
  batch.delete(doc(db, 'orgs', orgId, 'books', bookId));
  await batch.commit();
  await deleteBookStorage(orgId, bookId);
}

async function addPageFromDataUrl(
  orgId: string,
  bookId: string,
  name: string,
  dataUrl: string,
  sortOrder: number,
  boxes: BoundingBox[] = []
): Promise<BookPage> {
  const pageId = newPageId();
  const imageUrl = await uploadDataUrl(pageImagePath(orgId, bookId, pageId), dataUrl);
  const page: Omit<BookPage, 'id'> = { name, sortOrder, imageUrl, boxes };
  await setDoc(doc(db, 'orgs', orgId, 'books', bookId, 'pages', pageId), page);
  return { id: pageId, ...page };
}

export async function importFilesToBook(
  orgId: string,
  bookId: string,
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (!files.length) return 0;

  const existing = await listPages(orgId, bookId);
  let sortOrder = existing.length;
  let added = 0;

  const supported = files.filter(f => isPdfFile(f) || isImageFile(f));
  if (supported.length === 0) {
    throw new Error('No supported files. Use PDF or image files (JPG, PNG, etc.).');
  }
  if (supported.length !== files.length) {
    const skipped = files.filter(f => !isPdfFile(f) && !isImageFile(f)).map(f => f.name);
    throw new Error(`Unsupported file type: ${skipped.join(', ')}`);
  }

  let total = 0;
  for (const file of supported) {
    if (isPdfFile(file)) {
      total += await countPdfPages(file);
    } else {
      total += 1;
    }
  }

  for (const file of supported) {
    if (isPdfFile(file)) {
      const uploadBase = added;
      const urls = await pdfToDataUrls(file, 1.5, (cur) => {
        onProgress?.(uploadBase + cur, total);
      });
      for (let i = 0; i < urls.length; i++) {
        await addPageFromDataUrl(orgId, bookId, `${file.name} p${i + 1}`, urls[i], sortOrder++);
        added++;
        onProgress?.(added, total);
      }
    } else {
      const url = await dataUrlFromFile(file);
      await addPageFromDataUrl(orgId, bookId, file.name, url, sortOrder++);
      added++;
      onProgress?.(added, total);
    }
  }

  const pages = await listPages(orgId, bookId);
  const coverUrl = pages[0]?.imageUrl ?? null;
  await updateBook(orgId, bookId, { pageCount: pages.length, coverUrl });
  return added;
}

export async function importBundleToBook(
  orgId: string,
  bookId: string,
  pages: StoredPage[],
  mappings: AudioMapping,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const audioEntries = Object.entries(mappings);
  const total = pages.length + audioEntries.length;
  let done = 0;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const imageUrl = await uploadDataUrl(pageImagePath(orgId, bookId, p.id), p.dataUrl);
    await setDoc(doc(db, 'orgs', orgId, 'books', bookId, 'pages', p.id), {
      name: p.name,
      sortOrder: i,
      imageUrl,
      boxes: p.boxes,
    });
    onProgress?.(++done, total);
  }

  for (const [boxId, src] of audioEntries) {
    // Older backups stored remote URLs; fetch them so upload always gets a data URL.
    const dataUrl = src.startsWith('data:') ? src : await urlToDataUrl(src);
    await assignAudio(orgId, bookId, boxId, dataUrl);
    onProgress?.(++done, total);
  }

  const bookPages = await listPages(orgId, bookId);
  await updateBook(orgId, bookId, {
    pageCount: bookPages.length,
    coverUrl: bookPages[0]?.imageUrl ?? null,
  });
}

async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function exportBookBundle(
  orgId: string,
  bookId: string,
  title: string,
  onProgress?: (current: number, total: number) => void
) {
  const pages = await listPages(orgId, bookId);
  const mappings = await loadAudioMapping(orgId, bookId);

  const audioEntries = Object.entries(mappings);
  const total = pages.length + audioEntries.length;
  let done = 0;

  const storedPages: StoredPage[] = [];
  for (const p of pages) {
    const dataUrl = await urlToDataUrl(p.imageUrl);
    storedPages.push({ id: p.id, dataUrl, name: p.name, boxes: p.boxes });
    onProgress?.(++done, total);
  }

  // Embed recordings as data URLs so the backup is fully self-contained.
  const storedMappings: AudioMapping = {};
  for (const [boxId, url] of audioEntries) {
    try {
      storedMappings[boxId] = await urlToDataUrl(url);
    } catch {
      // Skip recordings that can no longer be fetched rather than failing the whole export.
    }
    onProgress?.(++done, total);
  }

  const bundle = { version: 2, title, pages: storedPages, mappings: storedMappings };
  const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lugha_${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function removeBoxAudio(orgId: string, bookId: string, boxId: string): Promise<void> {
  await deleteDoc(doc(db, 'orgs', orgId, 'books', bookId, 'audio', boxId));
  await deleteStoragePath(`${audioPath(orgId, bookId, boxId)}.webm`);
  await deleteStoragePath(`${audioPath(orgId, bookId, boxId)}.mp4`);
}
