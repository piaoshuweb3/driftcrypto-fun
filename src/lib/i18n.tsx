'use client';

import { createContext, useContext, useState, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { translations, type Locale } from './translations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  tArgs: (key: string, args: Record<string, string | number>) => string;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const I18nContext = createContext<I18nContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helper: resolve nested key like "header.dashboard"
// ---------------------------------------------------------------------------

function resolve(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback: return key path itself
    }
  }
  return typeof current === 'string' ? current : path;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'driftcrypto-locale';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored as Locale;
  } catch {
    // localStorage not available
  }
  // Detect browser language
  try {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
  } catch {
    // navigator not available
  }
  return 'en';
}

function writeStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// useSyncExternalStore for locale — avoids setState-in-effect lint error
// ---------------------------------------------------------------------------

function subscribeLocale(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshotLocale(): Locale {
  return readStoredLocale();
}

function getServerSnapshotLocale(): Locale {
  return 'en';
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function I18nProvider({ children }: { children: ReactNode }) {
  // Use useSyncExternalStore to read locale from localStorage without
  // triggering the "setState in effect" lint rule.
  const storedLocale = useSyncExternalStore(
    subscribeLocale,
    getSnapshotLocale,
    getServerSnapshotLocale,
  );

  const [localeState, setLocaleState] = useState<Locale>(storedLocale);

  // Sync local state whenever the external snapshot changes
  // (e.g. another tab wrote to localStorage)
  if (storedLocale !== localeState) {
    setLocaleState(storedLocale);
  }

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    writeStoredLocale(newLocale);
    // Dispatch a storage event so other hooks pick up the change
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = translations[localeState] as unknown as Record<string, unknown>;
      return resolve(dict, key);
    },
    [localeState],
  );

  const tArgs = useCallback(
    (key: string, args: Record<string, string | number>): string => {
      let str = t(key);
      for (const [k, v] of Object.entries(args)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
      return str;
    },
    [t],
  );

  return (
    <I18nContext.Provider value={{ locale: localeState, setLocale, t, tArgs }}>
      {children}
    </I18nContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
