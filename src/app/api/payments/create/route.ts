import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  DEFAULT_CHAIN_ID,
  SUPPORTED_CHAINS,
  getChainConfig,
  priceFor,
  receivingAddress,
} from '@/lib/payments';

// ---------------------------------------------------------------------------
// POST /api/payments/create — open a checkout
// ---------------------------------------------------------------------------
// Returns everything the client needs to make the transfer: which chain, which
// USDC contract, the amount and the destination. The amount and destination are
// snapshotted onto the row, so a later price change cannot re-price a payment
// that is already in flight.
// ---------------------------------------------------------------------------

/** A quote is valid for this long; afterwards the rate may have moved. */
const QUOTE_TTL_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tier, months, chainId, payerAddress } = body as {
      tier?: string;
      months?: number;
      chainId?: number;
      payerAddress?: string;
    };

    const amount = priceFor(tier ?? '', months ?? 0);
    if (amount === null) {
      return NextResponse.json(
        {
          error: 'Unknown plan',
          message: 'tier must be "plus" or "pro" and months must be 1, 3 or 12.',
          plans: Object.keys(SUPPORTED_CHAINS).length,
        },
        { status: 400 },
      );
    }

    const to = receivingAddress();
    if (!to) {
      return NextResponse.json(
        {
          error: 'Payments not configured',
          message: 'PAYMENT_RECEIVE_ADDRESS is not set on the server.',
        },
        { status: 503 },
      );
    }

    const chain = getChainConfig(chainId ?? DEFAULT_CHAIN_ID);
    if (!chain) {
      return NextResponse.json(
        {
          error: 'Unsupported chain',
          message: 'Supported chain ids: ' + Object.keys(SUPPORTED_CHAINS).join(', '),
        },
        { status: 400 },
      );
    }

    const expiresAt = new Date(Date.now() + QUOTE_TTL_MS);

    const payment = await db.payment.create({
      data: {
        tier: tier as string,
        months: months as number,
        amountUsdc: amount,
        chainId: chain.id,
        payTo: to,
        payerAddress: payerAddress ? payerAddress.toLowerCase() : null,
        expiresAt,
      },
    });

    return NextResponse.json({
      ok: true,
      id: payment.id,
      tier: payment.tier,
      months: payment.months,
      amountUsdc: amount,
      chain: {
        id: chain.id,
        label: chain.label,
        // The client picks the first; Polygon has both native and bridged USDC.
        usdcContracts: chain.usdc,
      },
      payTo: to,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[payments/create] failed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Could not open a checkout. The payment store may be unavailable.',
        detail: process.env.NODE_ENV === 'production' ? undefined : (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}
