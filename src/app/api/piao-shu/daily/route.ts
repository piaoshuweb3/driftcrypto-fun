import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/piao-shu/daily — Fetch latest PiaoShu daily report
// Query params:
//   date? = "2026-06-04" (defaults to latest)
//   membership? = "free" | "plus" | "pro" (determines content access)
// ---------------------------------------------------------------------------

const MEMBERSHIP_LEVELS: Record<string, number> = {
  free: 0,
  plus: 1,
  pro: 2,
};

function canAccess(userMembership: string, requiredMembership: string): boolean {
  return (MEMBERSHIP_LEVELS[userMembership] ?? 0) >= (MEMBERSHIP_LEVELS[requiredMembership] ?? 99);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const membership = searchParams.get('membership') || 'free';

    // Fetch latest report or by specific date
    const report = date
      ? await db.piaoShuReport.findUnique({ where: { reportDate: date } })
      : await db.piaoShuReport.findFirst({ orderBy: { reportDate: 'desc' } });

    if (!report) {
      return NextResponse.json(
        {
          error: 'No report found',
          hasReport: false,
          message: 'No daily report available yet. Reports are generated automatically.',
        },
        { status: 404 }
      );
    }

    const hasAccess = canAccess(membership, report.minMembership);

    // Build response based on membership level
    const response: Record<string, unknown> = {
      hasReport: true,
      reportDate: report.reportDate,
      title: report.title,
      generatedAt: report.generatedAt,
      minMembership: report.minMembership,
      hasAccess,
    };

    if (hasAccess) {
      // Full access — return all structured data
      try {
        response.marketOverview = JSON.parse(report.marketOverview || '{}');
      } catch { response.marketOverview = {}; }
      try {
        response.gainers = JSON.parse(report.gainers || '[]');
      } catch { response.gainers = []; }
      try {
        response.losers = JSON.parse(report.losers || '[]');
      } catch { response.losers = []; }
      try {
        response.fundingRadar = JSON.parse(report.fundingRadar || '[]');
      } catch { response.fundingRadar = []; }
      try {
        response.upcomingICO = JSON.parse(report.upcomingICO || '[]');
      } catch { response.upcomingICO = []; }
      try {
        response.airdropRadar = JSON.parse(report.airdropRadar || '[]');
      } catch { response.airdropRadar = []; }
      response.opportunityAnalysis = report.opportunityAnalysis;
      response.dailyDigest = report.dailyDigest;
      response.piaoshuCommentary = report.piaoshuCommentary;
      response.fullContent = report.fullContent;
    } else {
      // Preview only — return limited data to tease content
      try {
        response.marketOverview = JSON.parse(report.marketOverview || '{}');
      } catch { response.marketOverview = {}; }
      // Only show top 3 gainers/losers as preview
      try {
        const allGainers = JSON.parse(report.gainers || '[]');
        response.gainers = allGainers.slice(0, 3);
        response.totalGainers = allGainers.length;
      } catch {
        response.gainers = [];
        response.totalGainers = 0;
      }
      try {
        const allLosers = JSON.parse(report.losers || '[]');
        response.losers = allLosers.slice(0, 3);
        response.totalLosers = allLosers.length;
      } catch {
        response.losers = [];
        response.totalLosers = 0;
      }
      // Blur opportunity analysis (show first 200 chars)
      response.opportunityAnalysisPreview = report.opportunityAnalysis?.slice(0, 200) + '...';
      response.dailyDigestPreview = report.dailyDigest?.slice(0, 200) + '...';
      response.piaoshuCommentaryPreview = report.piaoshuCommentary?.slice(0, 200) + '...';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('PiaoShu daily endpoint error:', error);

    // A database outage — or an unconfigured DATABASE_URL on a fresh deploy —
    // must not surface as a hard failure. The client already renders
    // "no report yet" from hasReport:false, which is far more useful to a
    // visitor than a 500. The real cause stays in the server logs.
    return NextResponse.json(
      {
        hasReport: false,
        reportDate: '',
        title: '',
        generatedAt: '',
        minMembership: 'plus',
        hasAccess: false,
        error: 'Report store unavailable',
        message: 'The report store is temporarily unavailable. Please try again later.',
      },
      { status: 200 },
    );
  }
}
