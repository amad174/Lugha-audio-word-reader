import { AudioMapping, StoredPage, BoundingBox } from '../types';

const KEYS = {
  mappings: 'iqra_mappings',
  pages: 'iqra_pages',
  adminPw: 'iqra_admin_pw',
};

// ── Audio mappings ────────────────────────────────────────────────────────────

export function loadMappings(): AudioMapping {
  try { return JSON.parse(localStorage.getItem(KEYS.mappings) || '{}'); }
  catch { return {}; }
}

export function saveMappings(m: AudioMapping): void {
  try { localStorage.setItem(KEYS.mappings, JSON.stringify(m)); }
  catch (e) { console.error('saveMappings failed', e); }
}

export function addMapping(m: AudioMapping, hash: string, audio: string): AudioMapping {
  const next = { ...m, [hash]: audio };
  saveMappings(next);
  return next;
}

export function removeMapping(m: AudioMapping, hash: string): AudioMapping {
  const next = { ...m };
  delete next[hash];
  saveMappings(next);
  return next;
}

export function exportMappings(m: AudioMapping): void {
  const blob = new Blob([JSON.stringify(m, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: 'iqra_mappings.json',
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Pages (images + boxes) ────────────────────────────────────────────────────

export function loadPages(): StoredPage[] {
  try { return JSON.parse(localStorage.getItem(KEYS.pages) || '[]'); }
  catch { return []; }
}

export function savePages(pages: StoredPage[]): void {
  try { localStorage.setItem(KEYS.pages, JSON.stringify(pages)); }
  catch (e) { console.error('savePages failed – may exceed localStorage quota', e); }
}

export function updatePageBoxes(pages: StoredPage[], pageId: string, boxes: BoundingBox[]): StoredPage[] {
  const next = pages.map(p => p.id === pageId ? { ...p, boxes } : p);
  savePages(next);
  return next;
}

// ── Admin password (simple hash, not cryptographic – this is a kids' app) ────

function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

export function isAdminSetup(): boolean {
  return !!localStorage.getItem(KEYS.adminPw);
}

export function setupAdmin(password: string): void {
  localStorage.setItem(KEYS.adminPw, simpleHash(password));
}

export function checkAdmin(password: string): boolean {
  const stored = localStorage.getItem(KEYS.adminPw);
  return !!stored && stored === simpleHash(password);
}

export function clearAdminPassword(): void {
  localStorage.removeItem(KEYS.adminPw);
}
