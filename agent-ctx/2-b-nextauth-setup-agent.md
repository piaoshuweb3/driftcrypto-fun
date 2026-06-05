# Task 2-b — NextAuth.js v4 Authentication Setup

**Agent**: nextauth-setup-agent
**Date**: 2026-03-05

## Summary
Set up NextAuth.js v4 authentication with Google, Twitter, and Crypto Wallet (Credentials) providers. No `@auth/prisma-adapter` was available, so manual user management was implemented in callbacks.

## Files Created

1. **`src/lib/auth.ts`** — NextAuth configuration
   - Google, Twitter, and Credentials (wallet) providers
   - JWT session strategy
   - Manual user creation/lookup in signIn callback for OAuth providers
   - Extended TypeScript types for Session, User, JWT with custom fields (role, membership, walletAddress)
   - MVP wallet signature verification (format checks only)

2. **`src/app/api/auth/[...nextauth]/route.ts`** — NextAuth route handler
   - Standard GET/POST exports

3. **`src/app/api/auth/wallet/route.ts`** — Wallet authentication endpoint
   - Step 1: Generate nonce message (stored in VerificationToken table)
   - Step 2: Verify signature, create/find user, create session, return token
   - Replay protection: one-time-use nonces, 10-minute expiry

4. **`src/app/api/admin/users/route.ts`** — Admin user management
   - GET: List users with pagination, filtering, search
   - PATCH: Update user role/membership
   - Auth: Admin secret key via Authorization header or x-admin-key header

## Key Decisions
- No PrismaAdapter (not installed) — manual DB operations in callbacks
- JWT strategy (required for Credentials provider compatibility)
- VerificationToken table reused for wallet nonces (no new tables)
- Admin auth uses simple secret key, not NextAuth session
- No new packages installed

## Lint
✅ Passed
