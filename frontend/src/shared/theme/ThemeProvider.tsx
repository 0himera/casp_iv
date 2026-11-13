'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'caspian-theme';
const EVENT = 'caspian-theme-change';
const ThemeContext = createContext<Theme>('light');
function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch { return null; }
}
function snapshot(): Theme { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }
function serverSnapshot(): Theme { return 'light'; }
function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(notify: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = () => apply(savedTheme() ?? (media.matches ? 'dark' : 'light'));
  const storage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) sync(); };
  window.addEventListener(EVENT, notify);
  window.addEventListener('storage', storage);
  media.addEventListener('change', sync);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener('storage', storage);
    media.removeEventListener('change', sync);
  };
}
export function setTheme(theme: Theme) {
  try { localStorage.setItem(KEY, theme); } catch {}
  apply(theme);
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
export function useTheme() { return useContext(ThemeContext); }
