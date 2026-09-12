'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
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
// Locale persistence
// ---------------------------------------------------------------------------
// The locale used to live in localStorage only, which the server cannot read.
// That forced the page to withhold rendering until the client had mounted —
// so the server-rendered HTML was an empty loading spinner and search engines
// saw nothing. A cookie is readable on both sides, so the server can render
// the correct language on the first pass and the markup matches on hydration.
// ---------------------------------------------------------------------------

const COOKIE_KEY = 'driftcrypto-locale';
const STORAGE_KEY = 'driftcrypto-locale';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function readLocaleCookie(cookieHeader: string | undefined): Locale {
  if (!cookieHeader) return 'en';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]+)`));
  const value = match?.[1];
  return value === 'zh' || value === 'en' ? value : 'en';
}

function persistLocale(locale: Locale) {
  try {
    document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  } catch {
    // cookies unavailable — the in-memory locale still applies for this session
  }
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function I18nProvider({
  children,
  initialLocale = 'en',
}: {
  children: ReactNode;
  /** Read from the request cookie by the server layout, so both sides agree. */
  initialLocale?: Locale;
}) {
  const [localeState, setLocaleState] = useState<Locale>(initialLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Deferred: setting state synchronously in an effect triggers a cascading
    // render, which the react-hooks rule flags.
    queueMicrotask(() => setMounted(true));
  }, []);

  // First visit (no cookie yet): adopt the stored/browser language *after*
  // hydration. Doing it in an effect keeps the first client render identical to
  // the server render, so React does not report a mismatch.
  useEffect(() => {
    let hasCookie = false;
    try {
      hasCookie = document.cookie.includes(`${COOKIE_KEY}=`);
    } catch {
      // ignore
    }
    if (hasCookie) return;

    let detected: Locale = initialLocale;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'zh' || stored === 'en') {
        detected = stored;
      } else if (navigator.language.toLowerCase().startsWith('zh')) {
        detected = 'zh';
      }
    } catch {
      // ignore
    }

    if (detected !== initialLocale) {
      // Same reasoning as above — the value is already computed, only the
      // state update is postponed to the next microtask.
      queueMicrotask(() => {
        setLocaleState(detected);
        persistLocale(detected);
      });
    }
  }, [initialLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    persistLocale(newLocale);
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
