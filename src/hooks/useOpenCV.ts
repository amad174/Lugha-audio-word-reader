import { useState, useEffect } from 'react';
import { waitForOpenCV } from '../utils/opencv';

export function useOpenCV() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    waitForOpenCV()
      .then(() => setReady(true))
      .catch(() => setError('Failed to load OpenCV.js'));

    // Timeout fallback – show error if not ready in 15s
    const timer = setTimeout(() => {
      if (!ready) setError('OpenCV.js timed out. Check your connection.');
    }, 15000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready, error };
}
