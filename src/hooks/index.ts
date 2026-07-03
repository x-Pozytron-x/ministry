// Custom hooks for application logic

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CongregationData } from '../domain';
import { AutoSaveManager } from '../storage';

export function useAutoSave(
  data: CongregationData | null,
  onSave: (data: CongregationData) => Promise<void>,
  debounceMs: number = 3000,
  initialEnabled: boolean = true
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoSaveRef = useRef<AutoSaveManager | null>(null);
  const onSaveRef = useRef(onSave);

  // Keep onSave ref current to avoid recreating AutoSaveManager
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    const manager = new AutoSaveManager({
      enabled: initialEnabled,
      debounceMs,
      onSave: async (data) => {
        setIsSaving(true);
        setError(null);
        try {
          await onSaveRef.current(data);
          setLastSaved(new Date());
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка сохранения');
        } finally {
          setIsSaving(false);
        }
      },
      onError: (err) => {
        setError(err.message);
      }
    });

    autoSaveRef.current = manager;

    return () => {
      manager.disable();
    };
  }, [debounceMs, initialEnabled]);

  useEffect(() => {
    if (data && autoSaveRef.current) {
      autoSaveRef.current.schedule(data);
    }
  }, [data]);

  const flush = useCallback(async () => {
    if (autoSaveRef.current) {
      await autoSaveRef.current.flush();
    }
  }, []);

  const toggleAutoSave = useCallback((enabled: boolean) => {
    if (autoSaveRef.current) {
      if (enabled) {
        autoSaveRef.current.enable();
      } else {
        autoSaveRef.current.disable();
      }
    }
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    flush,
    toggleAutoSave,
    isPending: autoSaveRef.current?.isPending ?? false
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
