# Task 2 - Fix i18n hydration mismatch error

## Summary
Rewrote `/home/z/my-project/src/lib/i18n.tsx` to fix React hydration mismatch caused by the `useSyncExternalStore` approach where the server always renders 'en' but the client may read 'zh' from localStorage.

## Changes Made

### `/home/z/my-project/src/lib/i18n.tsx` — Full rewrite
- **Removed**: `useSyncExternalStore`-based locale reading (`subscribeLocale`, `getSnapshotLocale`, `getServerSnapshotLocale`, `writeStoredLocale`)
- **Added**: Mount-aware two-pass rendering approach:
  1. `mounted` state (initially `false`)
  2. `useEffect` sets `mounted = true` after first render and reads localStorage locale
  3. `locale` state always initializes to `'en'` — matches SSR output
  4. After mount, switches to stored locale from localStorage if different
- **Result**: Server HTML and first client render both use 'en', eliminating hydration mismatch

### `/home/z/my-project/src/app/layout.tsx` — Verified, no change needed
- `suppressHydrationWarning` already present on `<html>` tag (line 38)
