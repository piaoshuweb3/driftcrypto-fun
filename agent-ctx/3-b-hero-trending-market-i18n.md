# Task ID: 3-b — Add i18n Support to HeroSection, TrendingStrip & MarketTable

**Agent**: hero-trending-market-i18n-agent
**Date**: 2026-03-05

## Summary
Updated 3 component files to add bilingual (EN/ZH) internationalization support using the `useI18n` hook from `@/lib/i18n`. All hardcoded English strings were replaced with `t()` translation calls while preserving all existing functionality.

## Files Modified
1. `src/components/HeroSection.tsx` — 8 hardcoded strings replaced with `t()` calls
2. `src/components/TrendingStrip.tsx` — 2 hardcoded strings replaced with `t()` calls
3. `src/components/MarketTable.tsx` — 14 hardcoded strings replaced with `t()` calls

## Key Details
- Import added: `import { useI18n } from '@/lib/i18n';`
- Hook usage: `const { t } = useI18n();`
- "24h" label in HeroSection kept as-is (universal)
- All component APIs, data fetching, animations, and styling preserved
- Pre-existing lint error in `src/lib/i18n.tsx` not addressed (out of scope)
