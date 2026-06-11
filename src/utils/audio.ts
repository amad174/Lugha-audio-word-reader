let currentAudio: HTMLAudioElement | null = null;

/**
 * Play audio from a data URL or object URL.
 * Stops any in-flight playback first.
 * Returns a promise that resolves when playback ends.
 */
export function playAudio(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio.load();
      currentAudio = null;
    }

    const audio = new Audio(src);
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
