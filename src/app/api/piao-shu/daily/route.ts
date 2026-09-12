import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildPiaoShuReport, type BuiltReport } from '@/lib/piaoshu/report';

// ---------------------------------------------------------------------------
// GET /api/piao-shu/daily — latest PiaoShu daily report
//
//   date?       = "2026-06-04" (defaults to the newest)
//   membership? = "free" | "plus" | "pro" | "admin"
//
// If the report store is unreachable the report is assembled on demand instead
// of showing nothing, so this section stays usable before a database exists.
// ---------------------------------------------------------------------------

const MEMBERSHIP_LEVELS: Record<string, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  admin: 99, // administrators can read every tier
};

function canAccess(userMembership: string, requiredMembership: string): boolean {
  return (MEMBERSHIP_LEVELS[userMembership] ?? 0) >= (MEMBERSHIP_LEVELS[requiredMembership] ?? 99);
}

// ---------------------------------------------------------------------------
// On-demand fallback
// ---------------------------------------------------------------------------
// Assembling a report costs an AI call, so the result is held in memory rather
// than regenerated on every request.
// ---------------------------------------------------------------------------
const EPHEMERAL_TTL_MS = 30 * 60 * 1000;
let ephemeral: { report: BuiltReport; at: number } | null = null;

async function getEphemeralReport(): Promise<BuiltReport> {
  if (ephemeral && Date.now() - ephemeral.at < EPHEMERAL_TTL_MS) {
    return ephemeral.report;
  }
  const report = await buildPiaoShuReport();
  ephemeral = { report, at: Date.now() };
  return report;
}

/** The shape both a stored row and a live report are normalised into. */
interface ReportSource {
  reportDate: string;
  title: string;
  generatedAt: string | Date;
  minMembership: string;
  marketOverview: string;
  gainers: string;
  losers: string;
  fundingRadar: string;
  upcomingICO: string;
  airdropRadar: string;
  opportunityAnalysis: string;
  dailyDigest: string;
  piaoshuCommentary: string;
  fullContent: string;
}

function parse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function shape(
  src: ReportSource,
  membership: string,
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  const hasAccess = canAccess(membership, src.minMembership);

  const response: Record<string, unknown> = {
    hasReport: true,
    reportDate: src.reportDate,
    title: src.title,
    generatedAt: src.generatedAt,
    minMembership: src.minMembership,
    hasAccess,
    ...extras,
  };

  if (hasAccess) {
    response.marketOverview = parse(src.marketOverview, {});
    response.gainers = parse(src.gainers, []);
    response.losers = parse(src.losers, []);
    response.fundingRadar = parse(src.fundingRadar, []);
    response.upcomingICO = parse(src.upcomingICO, []);
    response.airdropRadar = parse(src.airdropRadar, []);
    response.opportunityAnalysis = src.opportunityAnalysis;
    response.dailyDigest = src.dailyDigest;
    response.piaoshuCommentary = src.piaoshuCommentary;
    response.fullContent = src.fullContent;
  } else {
    // Preview only — enough to show what sits behind the paywall.
    response.marketOverview = parse(src.marketOverview, {});
    const gainers = parse<unknown[]>(src.gainers, []);
    response.gainers = gainers.slice(0, 3);
    response.totalGainers = gainers.length;
    const losers = parse<unknown[]>(src.losers, []);
    response.losers = losers.slice(0, 3);
    response.totalLosers = losers.length;
    response.opportunityAnalysisPreview = (src.opportunityAnalysis ?? '').slice(0, 200) + '...';
    response.dailyDigestPreview = (src.dailyDigest ?? '').slice(0, 200) + '...';
    response.piaoshuCommentaryPreview = (src.piaoshuCommentary ?? '').slice(0, 200) + '...';
  }

  return response;
}

/** Present a live report like a stored row, so both paths share `shape`. */
function asSource(report: BuiltReport): ReportSource {
  return {
    reportDate: report.reportDate,
    title: report.title,
    generatedAt: new Date().toISOString(),
    minMembership: report.minMembership,
    marketOverview: JSON.stringify(report.marketOverview),
    gainers: JSON.stringify(report.gainers),
    losers: JSON.stringify(report.losers),
    fundingRadar: JSON.stringify(report.fundingRadar),
    upcomingICO: JSON.stringify(report.upcomingICO),
    airdropRadar: JSON.stringify(report.airdropRadar),
    opportunityAnalysis: report.opportunityAnalysis,
    dailyDigest: report.dailyDigest,
    piaoshuCommentary: report.piaoshuCommentary,
    fullContent: report.fullContent,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const membership = searchParams.get('membership') || 'free';

  try {
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
        { status: 404 },
      );
    }

    return NextResponse.json(shape(report as ReportSource, membership));
  } catch (error) {
    // A database outage — or a deployment with no DATABASE_URL yet — should not
    // cost the visitor the report entirely.
    console.error('PiaoShu daily: report store unavailable, generating live:', error);

    try {
      const live = await getEphemeralReport();
      return NextResponse.json(
        shape(asSource(live), membership, { source: 'generated-live' }),
      );
    } catch (genError) {
      console.error('PiaoShu daily: live generation failed as well:', genError);
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
}
