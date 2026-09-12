import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildPiaoShuReport } from '@/lib/piaoshu/report';

// ---------------------------------------------------------------------------
// POST /api/piao-shu/generate — build and store a PiaoShu daily report
// ---------------------------------------------------------------------------
// Requires the operator key (Authorization: Bearer …) or a Plus/Pro/admin
// membership header. Report assembly itself lives in src/lib/piaoshu/report.ts
// so the same code can serve an on-demand report when the store is down.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // ── Authorization ──────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    const body = await req.json().catch(() => ({}));
    const overrideKey = process.env.PIAOSHU_GENERATE_KEY;

    const hasKey = Boolean(overrideKey) && authHeader === `Bearer ${overrideKey}`;

    const userMembership = req.headers.get('x-membership') || 'free';
    const hasMembershipAccess =
      userMembership === 'plus' || userMembership === 'pro' || userMembership === 'admin';

    if (!hasKey && !hasMembershipAccess) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Active Plus or Pro membership required to generate reports.',
        },
        { status: 401 },
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const existing = await db.piaoShuReport.findUnique({
      where: { reportDate: today },
    });

    if (existing && !body.force) {
      return NextResponse.json({
        message: 'Report already exists for today',
        reportDate: today,
        id: existing.id,
      });
    }

    console.log('[PiaoShu Generate] Assembling report…');
    const report = await buildPiaoShuReport(today);

    const data = {
      title: report.title,
      radarData: JSON.stringify({
        funding: report.fundingRadar,
        upcoming: report.upcomingICO,
        airdrops: report.airdropRadar,
      }),
      opportunityAnalysis: report.opportunityAnalysis,
      dailyDigest: report.dailyDigest,
      piaoshuCommentary: report.piaoshuCommentary,
      marketOverview: JSON.stringify(report.marketOverview),
      gainers: JSON.stringify(report.gainers),
      losers: JSON.stringify(report.losers),
      fundingRadar: JSON.stringify(report.fundingRadar),
      upcomingICO: JSON.stringify(report.upcomingICO),
      airdropRadar: JSON.stringify(report.airdropRadar),
      fullContent: report.fullContent,
      generatedAt: new Date(),
    };

    const saved = existing
      ? await db.piaoShuReport.update({ where: { reportDate: today }, data })
      : await db.piaoShuReport.create({
          data: { reportDate: today, minMembership: report.minMembership, ...data },
        });

    console.log('[PiaoShu Generate] Stored report', saved.id);

    return NextResponse.json({
      message: 'Report generated successfully',
      reportDate: today,
      id: saved.id,
    });
  } catch (error) {
    console.error('PiaoShu generate endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Could not generate the report. The report store may be unavailable.',
      },
      { status: 500 },
    );
  }
}
