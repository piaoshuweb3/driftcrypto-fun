'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Bot,
  Lock,
  Crown,
  Zap,
  RefreshCw,
  Calendar,
  DollarSign,
  Rocket,
  Gift,
  BarChart3,
  Newspaper,
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useSession } from 'next-auth/react';
import MembershipDialog from '@/components/auth/MembershipDialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketOverview {
  btcDominance?: number;
  ethDominance?: number;
  totalMarketCap?: string;
  totalVolume?: string;
  marketCapChange24h?: number;
  activeCryptos?: number;
}

interface CoinEntry {
  name: string;
  symbol: string;
  price: number;
  change24h: number | null;
  change7d?: number | null;
  volume24h?: number | null;
  marketCap?: number | null;
  category?: string;
}

interface FundingEntry {
  project: string;
  stage: string;
  amount: string;
  investors: string;
  date: string;
  signal: string;
  url?: string;
}

interface ICOEntry {
  project: string;
  type: string;
  platform: string;
  timeUntil: string;
  amount: string;
  url?: string;
}

interface AirdropEntry {
  project: string;
  score: number;
  type: string;
  status: string;
  updated: string;
  investors: string;
  url?: string;
}

interface PiaoShuDailyResponse {
  hasReport: boolean;
  reportDate: string;
  title: string;
  generatedAt: string;
  minMembership: string;
  hasAccess: boolean;
  marketOverview?: MarketOverview;
  gainers?: CoinEntry[];
  losers?: CoinEntry[];
  totalGainers?: number;
  totalLosers?: number;
  fundingRadar?: FundingEntry[];
  upcomingICO?: ICOEntry[];
  airdropRadar?: AirdropEntry[];
  opportunityAnalysis?: string;
  opportunityAnalysisPreview?: string;
  dailyDigest?: string;
  dailyDigestPreview?: string;
  piaoshuCommentary?: string;
  piaoshuCommentaryPreview?: string;
  fullContent?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchPiaoShuDaily(membership: string): Promise<PiaoShuDailyResponse> {
  const res = await fetch(`/api/piao-shu/daily?membership=${membership}`);
  if (!res.ok) {
    if (res.status === 404) {
      return { hasReport: false, reportDate: '', title: '', generatedAt: '', minMembership: 'plus', hasAccess: false };
    }
    throw new Error('Failed to fetch');
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Simple Markdown renderer
// ---------------------------------------------------------------------------

function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading lines
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-gold mt-4 mb-2">
          {line.replace(/^## /, '')}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-foreground mt-4 mb-2">
          {line.replace(/^# /, '')}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const content = line.replace(/^> /, '');
      const parts = content.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, pi) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pi} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={pi}>{part}</span>;
      });
      elements.push(
        <blockquote key={i} className="border-l-2 border-gold/40 pl-3 my-2 text-xs text-muted-foreground italic">
          {rendered}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(<Separator key={i} className="my-4 bg-border/40" />);
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      continue;
    }

    // List items
    if (line.trim().startsWith('- ') || line.trim().startsWith('  - ')) {
      const isSubItem = line.trim().startsWith('  - ');
      const content = line.trim().replace(/^[\s-]+- /, '');
      const parts = content.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, pi) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pi} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={pi}>{part}</span>;
      });
      elements.push(
        <div key={i} className={`flex items-start gap-2 text-xs text-muted-foreground ${isSubItem ? 'pl-4' : ''}`}>
          <span className="text-gold/60 mt-0.5 shrink-0">•</span>
          <span>{rendered}</span>
        </div>
      );
      continue;
    }

    // Numbered items
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      const content = line.replace(/^\d+\.\s/, '');
      const parts = content.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, pi) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pi} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={pi}>{part}</span>;
      });
      elements.push(
        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="text-gold font-mono text-[10px] mt-0.5 shrink-0">{numberedMatch[1]}.</span>
          <span>{rendered}</span>
        </div>
      );
      continue;
    }

    // Regular text with bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pi} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={pi}>{part}</span>;
    });
    elements.push(
      <p key={i} className="text-xs text-muted-foreground leading-relaxed">
        {rendered}
      </p>
    );
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
      <div className="h-2" />
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paywall overlay
// ---------------------------------------------------------------------------

function PaywallOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useI18n();
  return (
    <div className="relative mt-6">
      {/* Blurred preview content */}
      <div className="filter blur-md select-none pointer-events-none opacity-60 space-y-3 p-6">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <Skeleton className="h-5 w-2/3 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
        <Skeleton className="h-3 w-full rounded" />
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl border border-gold/20">
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center ring-2 ring-gold/30">
            <Lock className="size-7 text-gold" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{t('piaoShu.paywallTitle')}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{t('piaoShu.paywallDesc')}</p>
          <Button
            onClick={onUpgrade}
            className="mt-2 bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20"
          >
            <Crown className="size-4 mr-1.5" />
            {t('piaoShu.upgradeToUnlock')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Market Snapshot Card
// ---------------------------------------------------------------------------

function MarketSnapshotCard({ data }: { data: MarketOverview }) {
  const { t } = useI18n();
  const isUp = (data.marketCapChange24h ?? 0) >= 0;

  const stats = [
    {
      label: t('piaoShu.btcDominance'),
      value: `${(data.btcDominance ?? 0).toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-gold',
      bg: 'bg-gold/10',
    },
    {
      label: t('piaoShu.totalMarketCap'),
      value: data.totalMarketCap ?? 'N/A',
      icon: DollarSign,
      color: isUp ? 'text-bullish' : 'text-bearish',
      bg: isUp ? 'bg-bullish/10' : 'bg-bearish/10',
    },
    {
      label: t('piaoShu.volume24h'),
      value: data.totalVolume ?? 'N/A',
      icon: TrendingUp,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      label: t('piaoShu.marketChange24h'),
      value: `${isUp ? '+' : ''}${(data.marketCapChange24h ?? 0).toFixed(2)}%`,
      icon: isUp ? ArrowUpRight : ArrowDownRight,
      color: isUp ? 'text-bullish' : 'text-bearish',
      bg: isUp ? 'bg-bullish/10' : 'bg-bearish/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="bg-card border-border/50 hover:border-gold/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <div className={`size-6 rounded-md ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`size-3 ${stat.color}`} />
                </div>
              </div>
              <span className="text-base sm:text-lg font-bold text-foreground">{stat.value}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coin List (gainers/losers)
// ---------------------------------------------------------------------------

function CoinList({ coins, type }: { coins: CoinEntry[]; type: 'gainers' | 'losers' }) {
  const { t } = useI18n();
  const isGainer = type === 'gainers';

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {isGainer ? (
            <TrendingUp className="size-4 text-bullish" />
          ) : (
            <TrendingDown className="size-4 text-bearish" />
          )}
          <span>{isGainer ? t('piaoShu.topGainers') : t('piaoShu.topLosers')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {coins.slice(0, 8).map((coin, i) => (
            <div
              key={`${coin.symbol}-${i}`}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0">{i + 1}</span>
                <span className="text-xs font-medium text-foreground truncate">{coin.name}</span>
                <span className="text-[10px] text-muted-foreground">{coin.symbol}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">
                  ${coin.price !== undefined ? (coin.price < 0.01 ? coin.price.toFixed(6) : coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString()) : '0'}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    (coin.change24h ?? 0) >= 0 ? 'text-bullish' : 'text-bearish'
                  }`}
                >
                  {(coin.change24h ?? 0) >= 0 ? '+' : ''}
                  {coin.change24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
          {coins.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">{t('common.noData')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Radar Section (funding / ICO / airdrop)
// ---------------------------------------------------------------------------

function RadarCard<T extends object>({
  title,
  icon: Icon,
  items,
  renderRow,
  emptyText,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: T[];
  renderRow: (item: T, i: number) => React.ReactNode;
  emptyText: string;
}) {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="size-4 text-gold" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {items.length > 0 ? items.map((item, i) => renderRow(item, i)) : (
            <p className="text-xs text-muted-foreground text-center py-4">{emptyText}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PiaoShuAnalysisSection() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Get user membership level
  const membership = (session?.user as Record<string, unknown> | undefined)?.membership as string || 'free';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['piaoshu-daily', membership],
    queryFn: () => fetchPiaoShuDaily(membership),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const hasAccess = data?.hasAccess ?? false;
  const hasReport = data?.hasReport ?? false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center ring-1 ring-gold/30">
            <Flame className="size-5 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {t('piaoShu.title')}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-gold/30 text-gold bg-gold/5">
                <Crown className="size-2.5 mr-0.5" />
                PLUS
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">{t('piaoShu.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.reportDate && (
            <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
              <Calendar className="size-3 mr-1" />
              {data.reportDate}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-border/50 hover:border-gold/30 text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            {t('piaoShu.refresh')}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <Card className="bg-card border-bearish/20">
          <CardContent className="p-6 text-center">
            <p className="text-bearish text-sm">{t('piaoShu.failedToLoad')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No report yet */}
      {!isLoading && !isError && !hasReport && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-8 text-center">
            <Bot className="size-12 text-gold/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('piaoShu.noReport')}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('piaoShu.noReportDesc')}</p>
          </CardContent>
        </Card>
      )}

      {/* Report content */}
      {!isLoading && !isError && hasReport && data && (
        <>
          {/* Market Snapshot - always visible */}
          {data.marketOverview && (
            <MarketSnapshotCard data={data.marketOverview} />
          )}

          {/* Gainers / Losers - always visible */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CoinList coins={data.gainers ?? []} type="gainers" />
            <CoinList coins={(data as PiaoShuDailyResponse).losers ?? []} type="losers" />
          </div>

          {/* Tabbed content - paywall protected */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card border border-border/50 h-auto p-1">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Flame className="size-3.5 mr-1.5" />
                {t('piaoShu.tabOverview')}
              </TabsTrigger>
              <TabsTrigger value="opportunity" className="text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Zap className="size-3.5 mr-1.5" />
                {t('piaoShu.tabOpportunity')}
              </TabsTrigger>
              <TabsTrigger value="commentary" className="text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Bot className="size-3.5 mr-1.5" />
                {t('piaoShu.tabCommentary')}
              </TabsTrigger>
              <TabsTrigger value="digest" className="text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Newspaper className="size-3.5 mr-1.5" />
                {t('piaoShu.tabDigest')}
              </TabsTrigger>
              <TabsTrigger value="radar" className="text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Rocket className="size-3.5 mr-1.5" />
                {t('piaoShu.tabRadar')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              {hasAccess ? (
                <>
                  {/* Funding Radar */}
                  <RadarCard
                    title={t('piaoShu.fundingRadar')}
                    icon={DollarSign}
                    items={data.fundingRadar ?? []}
                    emptyText={t('common.noData')}
                    renderRow={(item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-foreground">{item.project}</span>
                          <Badge variant="outline" className="text-[10px] px-1 h-4 border-gold/20 text-gold/80">{item.stage}</Badge>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground">{item.investors?.slice(0, 30)}</span>
                          <span className="text-xs font-semibold text-foreground">{item.amount}</span>
                        </div>
                      </div>
                    )}
                  />
                  {/* Upcoming ICO */}
                  <RadarCard
                    title={t('piaoShu.upcomingICO')}
                    icon={Rocket}
                    items={data.upcomingICO ?? []}
                    emptyText={t('common.noData')}
                    renderRow={(item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-foreground">{item.project}</span>
                          <Badge variant="outline" className="text-[10px] px-1 h-4 border-sky-500/20 text-sky-400">{item.type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground">{item.platform}</span>
                          <span className="text-xs text-gold">{item.timeUntil}</span>
                          <span className="text-xs font-semibold text-foreground">{item.amount}</span>
                        </div>
                      </div>
                    )}
                  />
                  {/* Airdrop Radar */}
                  <RadarCard
                    title={t('piaoShu.airdropRadar')}
                    icon={Gift}
                    items={data.airdropRadar ?? []}
                    emptyText={t('common.noData')}
                    renderRow={(item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-foreground">{item.project}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1 h-4 ${
                              item.status === 'Confirmed'
                                ? 'border-bullish/20 text-bullish'
                                : 'border-gold/20 text-gold'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground">Score: {item.score}</span>
                          <span className="text-xs font-semibold text-foreground">{item.type}</span>
                        </div>
                      </div>
                    )}
                  />
                </>
              ) : (
                <PaywallOverlay onUpgrade={() => setMembershipOpen(true)} />
              )}
            </TabsContent>

            {/* Opportunity Analysis Tab */}
            <TabsContent value="opportunity" className="mt-4">
              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  {hasAccess ? (
                    <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {renderMarkdown(data.opportunityAnalysis ?? '')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview */}
                      <div className="p-4 rounded-lg bg-white/[0.02] border border-border/30">
                        <p className="text-xs text-muted-foreground">{data.opportunityAnalysisPreview}</p>
                      </div>
                      <PaywallOverlay onUpgrade={() => setMembershipOpen(true)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PiaoShu Commentary Tab */}
            <TabsContent value="commentary" className="mt-4">
              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  {hasAccess ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                          <Bot className="size-4 text-gold" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground">{t('piaoShu.piaoshuSays')}</span>
                          <Badge variant="outline" className="ml-2 text-[10px] px-1 h-4 border-gold/20 text-gold/80 bg-gold/5">
                            AI
                          </Badge>
                        </div>
                      </div>
                      <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {renderMarkdown(data.piaoshuCommentary ?? '')}
                      </div>
                      <Separator className="bg-border/40" />
                      <p className="text-[10px] text-muted-foreground/60 italic">
                        {t('piaoShu.disclaimer')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-white/[0.02] border border-border/30">
                        <p className="text-xs text-muted-foreground">{data.piaoshuCommentaryPreview}</p>
                      </div>
                      <PaywallOverlay onUpgrade={() => setMembershipOpen(true)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Daily Digest Tab */}
            <TabsContent value="digest" className="mt-4">
              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  {hasAccess ? (
                    <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {renderMarkdown(data.dailyDigest ?? '')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-white/[0.02] border border-border/30">
                        <p className="text-xs text-muted-foreground">{data.dailyDigestPreview}</p>
                      </div>
                      <PaywallOverlay onUpgrade={() => setMembershipOpen(true)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Radar Tab (combined) */}
            <TabsContent value="radar" className="mt-4 space-y-6">
              {hasAccess ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RadarCard
                      title={t('piaoShu.fundingRadar')}
                      icon={DollarSign}
                      items={data.fundingRadar ?? []}
                      emptyText={t('common.noData')}
                      renderRow={(item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors">
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-foreground">{item.project}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[10px] px-1 h-4 border-gold/20 text-gold/80">{item.stage}</Badge>
                              <span className="text-[10px] text-muted-foreground">{item.date}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-foreground">{item.amount}</span>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{item.investors}</p>
                          </div>
                        </div>
                      )}
                    />
                    <RadarCard
                      title={t('piaoShu.airdropRadar')}
                      icon={Gift}
                      items={data.airdropRadar ?? []}
                      emptyText={t('common.noData')}
                      renderRow={(item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors">
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-foreground">{item.project}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1 h-4 ${
                                  item.status === 'Confirmed'
                                    ? 'border-bullish/20 text-bullish'
                                    : 'border-gold/20 text-gold'
                                }`}
                              >
                                {item.status}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{item.type}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-foreground">{item.score}</span>
                            <p className="text-[10px] text-muted-foreground">Score</p>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <RadarCard
                    title={t('piaoShu.upcomingICO')}
                    icon={Rocket}
                    items={data.upcomingICO ?? []}
                    emptyText={t('common.noData')}
                    renderRow={(item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors">
                        <div className="min-w-0 flex items-center gap-3">
                          <span className="text-xs font-medium text-foreground">{item.project}</span>
                          <Badge variant="outline" className="text-[10px] px-1 h-4 border-sky-500/20 text-sky-400">{item.type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{item.platform}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-gold font-medium">{item.timeUntil}</span>
                          <ChevronRight className="size-3 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  />
                </>
              ) : (
                <PaywallOverlay onUpgrade={() => setMembershipOpen(true)} />
              )}
            </TabsContent>
          </Tabs>

          {/* Access indicator */}
          <div className="flex items-center justify-center gap-2 py-4">
            {hasAccess ? (
              <Badge variant="outline" className="border-bullish/30 text-bullish bg-bullish/5">
                <Eye className="size-3 mr-1" />
                {t('piaoShu.fullAccess')}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gold/30 text-gold bg-gold/5">
                <EyeOff className="size-3 mr-1" />
                {t('piaoShu.previewOnly')}
              </Badge>
            )}
          </div>
        </>
      )}

      {/* Membership Dialog */}
      <MembershipDialog open={membershipOpen} onOpenChange={setMembershipOpen} />
    </div>
  );
}
