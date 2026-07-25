let currentAudio: HTMLAudioElement | null = null;

/**
 * Audio elements kept alive so the browser fetches and buffers each clip ahead
 * of the first tap. Media elements are not subject to CORS the way fetch() is,
 * so this warms the HTTP cache even though the Storage bucket blocks XHR.
 */
const preloaded = new Map<string, HTMLAudioElement>();

function isPreloadedElement(el: HTMLAudioElement): boolean {
  for (const cached of Array.from(preloaded.values())) {
    if (cached === el) return true;
  }
  return false;
}

export function preloadAudio(srcs: string[]): void {
  for (const src of srcs) {
    if (!src || preloaded.has(src)) continue;
    const el = new Audio();
    el.preload = 'auto';
    el.src = src;
    // Kick off buffering; errors are ignored since playback retries on tap.
    el.load();
    preloaded.set(src, el);
  }

  // Keep the cache bounded — a long book would otherwise accumulate elements.
  if (preloaded.size > 120) {
    const excess = preloaded.size - 120;
    Array.from(preloaded.keys()).slice(0, excess).forEach(k => preloaded.delete(k));
  }
}

/**
 * Play audio from a data URL or object URL.
 * Stops any in-flight playback first.
 * Returns a promise that resolves when playback ends.
 */
export function playAudio(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (currentAudio) {
      const prev = currentAudio;
      prev.pause();
      prev.onended = null;
      prev.onerror = null;
      // Only tear down ad-hoc elements. Preloaded ones must keep their buffered
      // src so the next tap on that word is still instant.
      if (!isPreloadedElement(prev)) {
        prev.removeAttribute('src');
        prev.load();
      }
      currentAudio = null;
    }

    // Reuse the buffered element when we have one so playback starts instantly.
    const preloadedEl = preloaded.get(src);
    const audio = preloadedEl ?? new Audio(src);
    if (preloadedEl) {
      try {
        preloadedEl.currentTime = 0;
      } catch {
        // Not seekable yet — it will still play from the start.
      }
    }
    currentAudio = audio;

    audio.onended = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      resolve();
    };
    audio.onerror = (e) => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      reject(e);
    };
    audio.play().catch((err) => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      reject(err);
    });
  });
}

/**
 * Read an audio file as a base64 data URL for storage.
 */
export function readAudioFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Record audio from microphone. Returns data URL when stopped.
 */
export async function recordAudio(): Promise<{ stop: () => Promise<string> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const mimeType =
            recorder.mimeType || chunks[0]?.type || 'audio/webm';
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        };
        recorder.stop();
      }),
  };
}
