import { AudioMapping, StoredPage } from '../types';

// ── Admin password (DJB2 hash — adequate for a kids' app) ─────────────────────

function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

export function isAdminSetup(): boolean { return !!localStorage.getItem('iqra_admin_pw'); }
export function setupAdmin(pw: string): void { localStorage.setItem('iqra_admin_pw', djb2(pw)); }
export function checkAdmin(pw: string): boolean {
  const s = localStorage.getItem('iqra_admin_pw');
  return !!s && s === djb2(pw);
}
export function clearAdminPassword(): void { localStorage.removeItem('iqra_admin_pw'); }

// ── Bundle export / import ────────────────────────────────────────────────────

interface Bundle { version: number; pages: StoredPage[]; mappings: AudioMapping; }

export function exportBundle(pages: StoredPage[], mappings: AudioMapping): void {
  const blob = new Blob([JSON.stringify({ version: 1, pages, mappings })], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `iqra_bundle_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBundle(file: File): Promise<{ pages: StoredPage[]; mappings: AudioMapping }> {
  const text = await file.text();
  const b: Bundle = JSON.parse(text);
  if (!Array.isArray(b.pages) || typeof b.mappings !== 'object') throw new Error('Invalid bundle');
  return { pages: b.pages, mappings: b.mappings };
}
