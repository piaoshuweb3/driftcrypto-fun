import { NextRequest, NextResponse } from 'next/server';
import { buildPiaoShuReport, storeReport } from '@/lib/piaoshu/report';

// ---------------------------------------------------------------------------
// GET /api/cron/daily-report
// ---------------------------------------------------------------------------
// Scheduled by Vercel Cron (see vercel.json). Without it the PiaoShu report
// only exists when somebody triggers the generator by hand, which makes
// "daily report" a misnomer.
//
// Guarded by CRON_SECRET: Vercel sends it as a bearer token on scheduled
// invocations. Without the guard anyone could make the server spend AI tokens
// by hitting a public URL.
// ---------------------------------------------------------------------------

/** Building a report calls an AI model; the default limit is too tight. */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    // Refusing to run is safer than exposing an endpoint that burns AI credits.
    console.error('[cron/daily-report] CRON_SECRET is not set — refusing to run');
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured' },
      { status: 503 },
    );
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const report = await buildPiaoShuReport(today);
    const id = await storeReport(report);

    console.log('[cron/daily-report] stored report', id);
    return NextResponse.json({ ok: true, reportDate: today, id });
  } catch (error) {
    console.error('[cron/daily-report] failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate the daily report' },
      { status: 500 },
    );
  }
}
