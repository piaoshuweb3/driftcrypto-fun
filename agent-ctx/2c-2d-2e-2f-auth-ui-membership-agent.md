# Task ID: 2-c, 2-d, 2-e, 2-f — Auth UI, Membership, Header Auth State & i18n

## Agent: auth-ui-membership-agent
## Status: COMPLETED

## Summary
Created authentication UI components (SignInDialog, MembershipDialog), updated Header with auth state, added SessionProvider, created wallet auth API, and added auth/membership i18n translations.

## Files Created
1. `src/components/auth/SignInDialog.tsx` — Dark glass sign-in dialog with 3 auth methods (Google, X, Wallet)
2. `src/components/auth/MembershipDialog.tsx` — 3-tier membership selection (Free/Plus/Pro)
3. `src/app/api/auth/wallet/route.ts` — Wallet authentication API endpoint (MVP: address validation + user creation)

## Files Modified
1. `src/lib/translations.ts` — Added `auth` (13 keys) and `membership` (11 keys) sections to both EN and ZH
2. `src/components/Header.tsx` — Added session-aware auth (user dropdown when signed in, sign-in/up buttons when signed out), dialog state management, SignInDialog + MembershipDialog integration
3. `src/components/Providers.tsx` — Added SessionProvider from next-auth/react wrapping I18nProvider

## Lint Result
✅ Passed with no errors
