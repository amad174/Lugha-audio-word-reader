import { useState, useCallback } from 'react';
import { AudioMapping } from '../types';
import { loadMappings, addMapping, removeMapping } from '../utils/storage';

export function useMappings() {
  const [mappings, setMappings] = useState<AudioMapping>(() => loadMappings());

  const assign = useCallback((hash: string, audioDataUrl: string) => {
    setMappings((prev) => addMapping(prev, hash, audioDataUrl));
  }, []);

  const remove = useCallback((hash: string) => {
    setMappings((prev) => removeMapping(prev, hash));
  }, []);

  const reload = useCallback(() => {
    setMappings(loadMappings());
  }, []);

  return { mappings, assign, remove, reload };
}
