import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// POST /api/auth/wallet — Wallet address authentication (MVP)
// ---------------------------------------------------------------------------
// For MVP: validates wallet address format, creates/finds user, returns user info.
// Full implementation would include nonce signing & verification.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body as { address?: string };

    // Validate address
    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 },
      );
    }

    const trimmedAddress = address.trim().toLowerCase();

    // Basic Ethereum address validation (0x + 40 hex chars, case-insensitive)
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 },
      );
    }

    // Check if user with this wallet address already exists
    let user = await db.user.findUnique({
      where: { walletAddress: trimmedAddress },
    });

    if (!user) {
      // Create a new user with wallet address
      user = await db.user.create({
        data: {
          name: `Wallet ${trimmedAddress.slice(0, 6)}...${trimmedAddress.slice(-4)}`,
          walletAddress: trimmedAddress,
          role: 'user',
          membership: 'free',
        },
      });

      // Create an account entry for the wallet provider
      await db.account.create({
        data: {
          userId: user.id,
          type: 'wallet',
          provider: 'wallet',
          providerAccountId: trimmedAddress,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        walletAddress: user.walletAddress,
        membership: user.membership,
      },
    });
  } catch (error) {
    console.error('[/api/auth/wallet] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
