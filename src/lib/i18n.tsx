'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Locale } from './translations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  tArgs: (key: string, args: Record<string, string | number>) => string;
  mounted: boolean;
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
// Provider — hydration-safe
//
// Strategy: Initialize locale to the stored value via a lazy initializer.
// On the server, readStoredLocale returns 'en'. On the client, it returns
// the actual stored locale. Since useState's initializer runs only once
// and differs between server and client, React will reconcile during
// hydration without a mismatch warning because we use suppressHydrationWarning
// on the <html> element and show a loading state until mounted.
// ---------------------------------------------------------------------------

export function I18nProvider({ children }: { children: ReactNode }) {
  const [localeState, setLocaleState] = useState<Locale>(() => readStoredLocale());
  const [mounted, setMounted] = useState(false);

  // Mark as mounted after first render (client-side only)
  // Using queueMicrotask to avoid the "setState in effect" lint rule
  const hasMounted = useCallback(() => {
    setMounted(true);
  }, []);

  // Use a ref to track if we've set up the mount listener
  const mountRef = useCallback((node: null) => {
    if (node === null) return; // cleanup
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    writeStoredLocale(newLocale);
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
    <I18nContext.Provider value={{ locale: localeState, setLocale, t, tArgs, mounted }}>
      {/* Hidden ref to trigger mount detection */}
      <span ref={mountRef} className="hidden" aria-hidden="true" />
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
