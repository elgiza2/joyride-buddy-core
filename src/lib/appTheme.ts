// Simple app-wide theme mode helper (light / dark).
// The actual theme application lives in App.tsx which listens for the
// `themechange-custom` window event and the `theme` localStorage key.

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "theme";

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new Event("themechange-custom"));
}

export function toggleThemeMode(): ThemeMode {
  const next: ThemeMode = getThemeMode() === "light" ? "dark" : "light";
  setThemeMode(next);
  return next;
}
