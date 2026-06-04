# Task 3-c: Add i18n Support to NewsFeed, FearGreedWidget, AIDigestSection & Footer

**Agent**: news-feargreed-digest-footer-i18n-agent
**Date**: 2026-03-05

## Summary
Updated 4 component files to add bilingual (EN/ZH) internationalization using `useI18n` hook.

## Files Modified
1. `src/components/NewsFeed.tsx` — Replaced all hardcoded strings with `t()`/`tArgs()`, refactored `timeAgo` and `getSentimentConfig` helpers to accept translation params
2. `src/components/FearGreedWidget.tsx` — Replaced strings, updated `getGaugeLabel` to accept `t` param
3. `src/components/AIDigestSection.tsx` — Replaced strings with `t()` calls
4. `src/components/Footer.tsx` — Added `'use client'`, imported `useI18n`, replaced strings

## Key Approach
- Helper functions (`timeAgo`, `getSentimentConfig`, `getGaugeLabel`) received `t`/`tArgs` as parameters since they're not React components and can't use hooks
- `NewsCard` sub-component calls `useI18n()` directly
- Footer converted from server to client component (required for `useI18n` hook)

## Lint
✅ Passed with no errors
