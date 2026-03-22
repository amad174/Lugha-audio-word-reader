import { StoredPage, AudioMapping } from '../types';

const DB_NAME = 'iqra_db';
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => { req.result.createObjectStore('kv'); };
    req.onsuccess = () => { _db = req.result; resolve(_db!); };
    req.onerror = () => reject(req.error);
  });
}

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = db.transaction('kv', 'readonly').objectStore('kv').get(key);
    r.onsuccess = () => res(r.result ?? fallback);
    r.onerror = () => rej(r.error);
  });
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export const dbGetPages = () => kvGet<StoredPage[]>('pages', []);
export const dbSavePages = (pages: StoredPage[]) => kvSet('pages', pages);
export const dbGetMappings = () => kvGet<AudioMapping>('mappings', {});
export const dbSaveMappings = (m: AudioMapping) => kvSet('mappings', m);

/** One-time migration from localStorage → IndexedDB */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const existing = await dbGetPages();
    if (existing.length > 0) return;
    const lsPages = JSON.parse(localStorage.getItem('iqra_pages') || '[]');
    const lsMappings = JSON.parse(localStorage.getItem('iqra_mappings') || '{}');
    if (lsPages.length > 0) await dbSavePages(lsPages);
    if (Object.keys(lsMappings).length > 0) await dbSaveMappings(lsMappings);
    // Clean up old localStorage entries
    localStorage.removeItem('iqra_pages');
    localStorage.removeItem('iqra_mappings');
  } catch { /* ignore */ }
}
