import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUsdcTransfer } from '@/lib/payments';
import type { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// POST /api/payments/verify — settle a checkout
// ---------------------------------------------------------------------------
// The client sends the transaction hash it just broadcast. We read the chain
// ourselves and only then grant the membership — the client's word is never
// taken for the payment.
// ---------------------------------------------------------------------------

type Db = PrismaClient;

/**
 * Apply the purchased tier to whoever paid.
 *
 * A wallet checkout is identified by the address that signed in; an
 * email/social checkout carries a user id. If neither is known the payment is
 * still recorded (the operator can reconcile it), it simply upgrades nobody.
 */
async function grantMembership(
  dbc: Db,
  payment: { tier: string; payerAddress: string | null; userId: string | null },
): Promise<'updated' | 'no-subject'> {
  if (payment.payerAddress) {
    const result = await dbc.user.updateMany({
      where: { walletAddress: payment.payerAddress },
      data: { membership: payment.tier },
    });
    return result.count > 0 ? 'updated' : 'no-subject';
  }

  if (payment.userId) {
    const result = await dbc.user.updateMany({
      where: { id: payment.userId },
      data: { membership: payment.tier },
    });
    return result.count > 0 ? 'updated' : 'no-subject';
  }

  return 'no-subject';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, txHash } = body as { id?: string; txHash?: string };

    if (!id || !txHash) {
      return NextResponse.json(
        { error: 'id and txHash are required' },
        { status: 400 },
      );
    }

    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: 'Unknown checkout' }, { status: 404 });
    }

    // Idempotent: re-submitting a settled hash is a no-op, not an error.
    if (payment.status === 'confirmed') {
      return NextResponse.json({
        ok: true,
        alreadyConfirmed: true,
        tier: payment.tier,
        confirmedAt: payment.confirmedAt,
      });
    }

    if (payment.expiresAt.getTime() < Date.now()) {
      await db.payment.update({ where: { id }, data: { status: 'expired' } });
      return NextResponse.json(
        { ok: false, error: 'Quote expired', message: 'Please start a new checkout.' },
        { status: 410 },
      );
    }

    // A hash can only settle one checkout.
    const clash = await db.payment.findUnique({ where: { txHash } });
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { ok: false, error: 'Transaction already used for another checkout' },
        { status: 409 },
      );
    }

    const verification = await verifyUsdcTransfer({
      chainId: payment.chainId,
      txHash,
      to: payment.payTo,
      minAmount: payment.amountUsdc,
    });

    if (!verification.ok) {
      // 422: the request was understood, the transaction just does not qualify
      // (yet) — the client can retry once it has more confirmations.
      return NextResponse.json(
        {
          ok: false,
          error: 'Payment not verified',
          reason: verification.reason,
          confirmations: verification.confirmations,
          requiredConfirmations: undefined,
        },
        { status: 422 },
      );
    }

    await db.payment.update({
      where: { id },
      data: { status: 'confirmed', txHash, confirmedAt: new Date() },
    });

    const granted = await grantMembership(db, {
      tier: payment.tier,
      payerAddress: payment.payerAddress,
      userId: payment.userId,
    });

    return NextResponse.json({
      ok: true,
      tier: payment.tier,
      months: payment.months,
      amountUsdc: verification.amount,
      paidFrom: verification.from,
      confirmations: verification.confirmations,
      membershipGranted: granted === 'updated',
    });
  } catch (error) {
    console.error('[payments/verify] failed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Could not verify the payment. The payment store may be unavailable.',
      },
      { status: 500 },
    );
  }
}
