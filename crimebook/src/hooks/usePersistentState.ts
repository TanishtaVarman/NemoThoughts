'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * useState backed by localStorage. Starts from `initial` on the server and on
 * first client render (no hydration mismatch), then loads the stored value.
 */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Storage blocked or corrupt — keep the initial value.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage blocked — state still works for this session.
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
