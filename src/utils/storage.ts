import { AudioMapping } from '../types';

const STORAGE_KEY = 'iqra_audio_mappings';

export function loadMappings(): AudioMapping {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMappings(mappings: AudioMapping): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch (e) {
    console.error('Failed to save mappings', e);
  }
}

export function addMapping(
  mappings: AudioMapping,
  hash: string,
  audioDataUrl: string
): AudioMapping {
  const updated = { ...mappings, [hash]: audioDataUrl };
  saveMappings(updated);
  return updated;
}

export function removeMapping(mappings: AudioMapping, hash: string): AudioMapping {
  const updated = { ...mappings };
  delete updated[hash];
  saveMappings(updated);
  return updated;
}

export function exportMappings(mappings: AudioMapping): void {
  const blob = new Blob([JSON.stringify(mappings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'iqra_mappings.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importMappings(file: File): Promise<AudioMapping> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const mappings = JSON.parse(e.target?.result as string);
        saveMappings(mappings);
        resolve(mappings);
      } catch {
        reject(new Error('Invalid mappings file'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
