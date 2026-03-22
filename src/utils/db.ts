import { StoredPage, AudioMapping, UserProfile, GameConfig } from '../types';
import { DEFAULT_GAME_CONFIG } from './game';

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

// ── Content ───────────────────────────────────────────────────────────────────
export const dbGetPages = () => kvGet<StoredPage[]>('pages', []);
export const dbSavePages = (pages: StoredPage[]) => kvSet('pages', pages);
export const dbGetMappings = () => kvGet<AudioMapping>('mappings', {});
export const dbSaveMappings = (m: AudioMapping) => kvSet('mappings', m);

// ── Profiles ──────────────────────────────────────────────────────────────────
export const dbGetProfiles = () => kvGet<UserProfile[]>('profiles', []);
export const dbSaveProfiles = (profiles: UserProfile[]) => kvSet('profiles', profiles);

// ── Game config ───────────────────────────────────────────────────────────────
export const dbGetGameConfig = () => kvGet<GameConfig>('gameConfig', DEFAULT_GAME_CONFIG);
export const dbSaveGameConfig = (cfg: GameConfig) => kvSet('gameConfig', cfg);

// ── Migration from localStorage ───────────────────────────────────────────────
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const existing = await dbGetPages();
    if (existing.length > 0) return;
    const lsPages = JSON.parse(localStorage.getItem('iqra_pages') || '[]');
    const lsMappings = JSON.parse(localStorage.getItem('iqra_mappings') || '{}');
    if (lsPages.length > 0) await dbSavePages(lsPages);
    if (Object.keys(lsMappings).length > 0) await dbSaveMappings(lsMappings);
    localStorage.removeItem('iqra_pages');
    localStorage.removeItem('iqra_mappings');
  } catch { /* ignore */ }
}
