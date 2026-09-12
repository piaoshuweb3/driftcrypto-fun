import { NextRequest, NextResponse } from 'next/server';
import { issueWalletNonce } from '@/lib/wallet-auth';

// ---------------------------------------------------------------------------
// POST /api/auth/wallet — mint a single-use sign-in challenge
// ---------------------------------------------------------------------------
// This endpoint does NOT authenticate anyone by itself. It only issues a
// one-time nonce and returns the exact message the wallet must sign.
//
// The signature is verified server-side inside NextAuth's CredentialsProvider
// (src/lib/auth.ts → verifyWalletSignature) when the client calls
// `signIn('wallet', { address, signature, message })`. A bare address is no
// longer sufficient to obtain a session.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { address } = body as { address?: unknown };

    const challenge = await issueWalletNonce(address);

    return NextResponse.json({ success: true, ...challenge });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create challenge';

    // A malformed address is a client error, not a server fault.
    if (message === 'Invalid wallet address format') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('[/api/auth/wallet] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
