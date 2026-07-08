import { useCallback, useEffect, useState } from "react";

/**
 * Per-product favorite flag, persisted to localStorage so the heart survives
 * reloads. Cards are independent (each keyed by product id); a small custom
 * event keeps multiple views of the same product in sync within the tab.
 */
const STORAGE_KEY = "jara.favorites";
const SYNC_EVENT = "jara:favorites";

function readAll(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeAll(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage may be unavailable (private mode) — favorites stay in memory */
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function useFavorite(id: string): readonly [boolean, () => void] {
  const [favorite, setFavorite] = useState(() => readAll().has(id));

  // Stay in sync when the same product is toggled elsewhere on the page.
  useEffect(() => {
    const sync = () => setFavorite(readAll().has(id));
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  const toggle = useCallback(() => {
    const ids = readAll();
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    writeAll(ids);
    setFavorite(ids.has(id));
  }, [id]);

  return [favorite, toggle] as const;
}
