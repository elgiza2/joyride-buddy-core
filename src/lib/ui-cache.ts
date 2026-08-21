/**
 * Tiny read-only cache for presentation data (task lists, prices…).
 * Never store balances, wallets or anything a player could edit to cheat —
 * those live in the game state and are re-checked on the server.
 */
const PREFIX = "music-ui-cache:";
const MAX_AGE = 10 * 60 * 1000;

type Entry<T> = { at: number; value: T };

export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry || Date.now() - entry.at > MAX_AGE) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* storage full or blocked — the app still works without the cache */
  }
}
