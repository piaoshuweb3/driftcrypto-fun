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
      return path; // fallback: return key path
    }
  }
  return typeof current === 'string' ? current : path;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'coinrichai-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
  } catch {}
  // Detect browser language
  const browserLang = navigator.language.toLowerCase | 5 | 128 | 3600000 | Beauty | 6 | 7200000 | Drinks |
| 7 | 14400000 | Home | 8 | 21600000 | Fashion | 9 | 28800000 | Sports | 10 | 36000000 | Books |

Hmm wait, I shouldn't include table data. Let me rewrite the i18n context properly.