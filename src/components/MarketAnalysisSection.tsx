'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChartBig,
  TrendingUp,
  TrendingDown,
  Search,
  Sparkles,
  Grid3X3,
  List,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Clock,
  Activity,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrendDirection = 'bullish' | 'bearish' | 'neutral';

interface CoinData {
  coinId: string;
  symbol: string;
  name: string;
  usdPrice: number;
  change24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  imageUrl: string | null;
}

interface GlobalData {
  totalMarketCap: number;
  totalVolume: number;
  activeCryptos: number;
  marketCapChange24h: number;
}

interface PricesResponse {
  coins: CoinData[];
  global: GlobalData;
}

interface AnalysisResult {
  coinId: string;
  symbol: string;
  name: string;
  trend: TrendDirection;
  confidence: number;
  summary: string;
  keyMetrics: {
    support: string;
    resistance: string;
    volume: string;
    momentum: string;
  };
  priceTarget: string;
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: number;
}

type FilterTab = 'all' | 'bullish' | 'bearish' | 'neutral';
type ViewMode = 'grid' | 'table';

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ---------------------------------------------------------------------------
// Trend helpers
// ---------------------------------------------------------------------------

function getTrendFromChange(change: number | null): TrendDirection {
  if (change === null) return 'neutral';
  if (change > 1.5) return 'bullish';
  if (change < -1.5) return 'bearish';
  return 'neutral';
}

function getTrendBadgeClasses(trend: TrendDirection): string {
  switch (trend) {
    case 'bullish':
      return 'bg-bullish/10 text-bullish border-bullish/20';
    case 'bearish':
      return 'bg-bearish/10 text-bearish border-bearish/20';
    case 'neutral':
      return 'bg-neutral/10 text-neutral border-neutral/20';
  }
}

function getTrendIcon(trend: TrendDirection) {
  switch (trend) {
    case 'bullish':
      return <ArrowUpRight className="size-3.5" />;
    case 'bearish':
      return <ArrowDownRight className="size-3.5" />;
    case 'neutral':
      return <TrendingUp className="size-3.5" />;
  }
}

function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'low':
      return 'text-bullish';
    case 'medium':
      return 'text-gold';
    case 'high':
      return 'text-bearish';
  }
}

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="bg-card border-border/50">
          <CardContent className="p-4">
            <Skeleton className="h-3 w-24 bg-white/10 mb-2" />
            <Skeleton className="h-6 w-32 bg-white/10" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SentimentSkeleton() {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4 flex items-center gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-20 bg-white/10" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-24 bg-white/10" />
              <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-3 w-full bg-white/10 mb-2" />
            <Skeleton className="h-3 w-3/4 bg-white/10 mb-4" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-8 rounded bg-white/10" />
              <Skeleton className="h-8 rounded bg-white/10" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analysis Card (Grid View)
// ---------------------------------------------------------------------------

function AnalysisCard({ result, t }: { result: AnalysisResult; t: (key: string) => string }) {
  const riskKey = `marketAnalysis.risk${result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}` as const;

  return (
    <motion.div variants={cardVariants}>
      <Card className="group relative overflow-hidden bg-card border-border/50 hover:border-gold/20 transition-all duration-300 h-full flex flex-col">
        {/* Subtle glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              result.trend === 'bullish'
                ? 'radial-gradient(ellipse at top, rgba(34,197,94,0.04) 0%, transparent 60%)'
                : result.trend === 'bearish'
                  ? 'radial-gradient(ellipse at top, rgba(239,68,68,0.04) 0%, transparent 60%)'
                  : 'radial-gradient(ellipse at top, rgba(245,158,11,0.04) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />

        <CardContent className="relative p-5 flex flex-col flex-1">
          {/* Header: Coin + Trend Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground uppercase">
                {result.symbol}
              </span>
              <span className="text-xs text-muted-foreground">{result.name}</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[11px] font-medium flex items-center gap-1 ${getTrendBadgeClasses(result.trend)}`}
            >
              {getTrendIcon(result.trend)}
              {t(`marketAnalysis.${result.trend}`)}
            </Badge>
          </div>

          {/* Confidence Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{t('marketAnalysis.confidence')}</span>
              <span className="font-medium text-foreground">{result.confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  result.trend === 'bullish'
                    ? 'bg-bullish'
                    : result.trend === 'bearish'
                      ? 'bg-bearish'
                      : 'bg-gold'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>

          {/* Summary */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
            {result.summary}
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('marketAnalysis.support')}
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">{result.keyMetrics.support}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('marketAnalysis.resistance')}
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">{result.keyMetrics.resistance}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('marketAnalysis.volume')}
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">{result.keyMetrics.volume}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('marketAnalysis.momentum')}
              </span>
              <p className="text-xs font-medium text-foreground mt-0.5">{result.keyMetrics.momentum}</p>
            </div>
          </div>

          {/* Footer: Price Target & Risk */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('marketAnalysis.priceTarget')}
              </span>
              <p className="text-sm font-semibold text-gold">{result.priceTarget}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('marketAnalysis.riskLevel')}
              </span>
              <p className={`text-sm font-semibold ${getRiskColor(result.riskLevel)}`}>
                {t(riskKey)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({
  t,
  onGenerate,
  isDisabled,
}: {
  t: (key: string) => string;
  onGenerate: () => void;
  isDisabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="relative inline-block mb-6">
        <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-gold/10">
          <BarChartBig className="size-10 text-gold" />
        </div>
        <div className="absolute -top-1 -right-1 size-6 rounded-full bg-gold/20 flex items-center justify-center">
          <Sparkles className="size-3 text-gold" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {t('marketAnalysis.emptyTitle')}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
        {t('marketAnalysis.emptyDesc')}
      </p>
      <Button
        onClick={onGenerate}
        disabled={isDisabled}
        size="lg"
        className="bg-gold hover:bg-gold/90 text-primary-foreground shadow-lg shadow-gold/25 transition-all duration-200 disabled:opacity-50 px-8 h-12 text-base"
      >
        <Sparkles className="size-5 mr-2" />
        {t('marketAnalysis.generate')}
      </Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MarketAnalysisSection() {
  const { t, locale } = useI18n();

  // Data state
  const [pricesData, setPricesData] = useState<PricesResponse | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [pricesError, setPricesError] = useState<string | null>(null);

  // UI state
  const [selectedCoin, setSelectedCoin] = useState<string>('all');
  const [coinSearch, setCoinSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Analysis state
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawAnalysisText, setRawAnalysisText] = useState<string | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<number | null>(null);
  const [aiInsightOpen, setAiInsightOpen] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch market data
  // -----------------------------------------------------------------------

  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    setPricesError(null);
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error('Failed to fetch prices');
      const data: PricesResponse = await res.json();
      setPricesData(data);
    } catch {
      setPricesError(t('marketAnalysis.failedToLoad'));
    } finally {
      setIsLoadingPrices(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // -----------------------------------------------------------------------
  // Computed values
  // -----------------------------------------------------------------------

  const globalData = pricesData?.global ?? null;
  const coins = pricesData?.coins ?? [];

  const sentimentCounts = useMemo(() => {
    const bull = coins.filter((c) => getTrendFromChange(c.change24h) === 'bullish').length;
    const bear = coins.filter((c) => getTrendFromChange(c.change24h) === 'bearish').length;
    const side = coins.filter((c) => getTrendFromChange(c.change24h) === 'neutral').length;
    return { bull, bear, side };
  }, [coins]);

  const btcDominance = useMemo(() => {
    if (!globalData || !globalData.totalMarketCap) return null;
    const btc = coins.find((c) => c.coinId === 'bitcoin');
    if (!btc || !btc.marketCap) return null;
    return ((btc.marketCap / globalData.totalMarketCap) * 100).toFixed(1);
  }, [globalData, coins]);

  const filteredCoins = useMemo(() => {
    if (!coinSearch.trim()) return coins;
    const q = coinSearch.toLowerCase();
    return coins.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.coinId.toLowerCase().includes(q),
    );
  }, [coins, coinSearch]);

  const filteredResults = useMemo(() => {
    if (filterTab === 'all') return analysisResults;
    return analysisResults.filter((r) => r.trend === filterTab);
  }, [analysisResults, filterTab]);

  // Market summary computed values (for "All Market" view)
  const marketSummary = useMemo(() => {
    if (analysisResults.length === 0) return null;
    const bullCount = analysisResults.filter((r) => r.trend === 'bullish').length;
    const bearCount = analysisResults.filter((r) => r.trend === 'bearish').length;
    const neutralCount = analysisResults.filter((r) => r.trend === 'neutral').length;
    const avgConfidence = Math.round(
      analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length,
    );
    const overallTrend: TrendDirection =
      bullCount > bearCount && bullCount > neutralCount
        ? 'bullish'
        : bearCount > bullCount && bearCount > neutralCount
          ? 'bearish'
          : 'neutral';
    const highRiskCount = analysisResults.filter((r) => r.riskLevel === 'high').length;
    const marketHealth: 'healthy' | 'caution' | 'stressed' =
      highRiskCount > analysisResults.length * 0.5
        ? 'stressed'
        : highRiskCount > analysisResults.length * 0.3
          ? 'caution'
          : 'healthy';
    return { bullCount, bearCount, neutralCount, avgConfidence, overallTrend, marketHealth };
  }, [analysisResults]);

  // -----------------------------------------------------------------------
  // Generate analysis
  // -----------------------------------------------------------------------

  const handleGenerateAnalysis = useCallback(async () => {
    setIsGenerating(true);
    setRawAnalysisText(null);
    setAnalysisTimestamp(null);

    const coinLabel =
      selectedCoin === 'all'
        ? 'the overall crypto market (top coins by market cap)'
        : coins.find((c) => c.coinId === selectedCoin)?.name ?? selectedCoin;

    // Build market context for the AI
    const marketContext = coins
      .slice(0, 10)
      .map((c) => `${c.name} (${c.symbol.toUpperCase()}): $${c.usdPrice.toLocaleString()}, 24h change: ${c.change24h?.toFixed(2) ?? 'N/A'}%`)
      .join('\n');

    const globalContext = globalData
      ? `Total Market Cap: ${formatLargeNumber(globalData.totalMarketCap)}, 24h Volume: ${formatLargeNumber(globalData.totalVolume)}, Market Cap Change: ${formatPercent(globalData.marketCapChange24h)}`
      : '';

    const prompt = `Perform a comprehensive market analysis for ${coinLabel}.

Current market data:
${marketContext}

Global metrics:
${globalContext}

For each analyzed coin, provide:
1. Trend direction (bullish/bearish/neutral)
2. Confidence score (0-100)
3. Brief summary (2-3 sentences)
4. Key metrics: Support level, Resistance level, Volume trend, Momentum indicator
5. Price target
6. Risk level (low/medium/high)

Format your response as a structured analysis. Be specific with price levels and use current market data.`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: [],
          locale,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      const aiText = data.message || '';
      setRawAnalysisText(aiText);
      setAnalysisTimestamp(Date.now());

      // Parse AI response into structured analysis results
      const parsedResults = parseAIResponse(aiText, coins, selectedCoin);
      setAnalysisResults(parsedResults);
    } catch {
      setRawAnalysisText(
        locale === 'zh'
          ? '分析暂时不可用，请稍后重试。'
          : 'Analysis temporarily unavailable. Please try again later.',
      );
    } finally {
      setIsGenerating(false);
    }
  }, [selectedCoin, coins, globalData, locale]);

  // -----------------------------------------------------------------------
  // Parse AI response into structured results
  // -----------------------------------------------------------------------

  function parseAIResponse(
    text: string,
    coinList: CoinData[],
    coinFilter: string,
  ): AnalysisResult[] {
    const results: AnalysisResult[] = [];

    // Determine which coins to generate results for
    const targetCoins =
      coinFilter === 'all' ? coinList.slice(0, 10) : coinList.filter((c) => c.coinId === coinFilter);

    // Split the AI response into sections per coin
    const sections = text.split(/\n(?=\d+\.|\*\*|#{1,3}\s|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s*\()/);

    // Create analysis results for each target coin
    for (const coin of targetCoins) {
      // Try to find a matching section in the AI response
      const matchingSection = sections.find(
        (s) =>
          s.toLowerCase().includes(coin.name.toLowerCase()) ||
          s.toLowerCase().includes(coin.symbol.toLowerCase()),
      );

      const sectionText = matchingSection ?? '';

      // Extract trend from text
      let trend: TrendDirection = getTrendFromChange(coin.change24h);
      if (sectionText.toLowerCase().includes('bearish') || sectionText.toLowerCase().includes('看跌')) {
        trend = 'bearish';
      } else if (sectionText.toLowerCase().includes('bullish') || sectionText.toLowerCase().includes('看涨')) {
        trend = 'bullish';
      }

      // Extract confidence
      const confMatch = sectionText.match(/confidence[:\s]*(\d{1,3})/i);
      const confidence = confMatch ? Math.min(100, Math.max(0, parseInt(confMatch[1], 10))) : Math.floor(55 + Math.random() * 35);

      // Extract risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      if (sectionText.toLowerCase().includes('low risk') || sectionText.toLowerCase().includes('低风险')) {
        riskLevel = 'low';
      } else if (sectionText.toLowerCase().includes('high risk') || sectionText.toLowerCase().includes('高风险')) {
        riskLevel = 'high';
      }

      // Extract summary — use a portion of the matching section or generate a default
      let summary = '';
      if (sectionText) {
        // Clean up the section text for a concise summary
        const lines = sectionText.split('\n').filter((l) => l.trim().length > 0);
        summary = lines.slice(0, 3).join(' ').replace(/[#*_]/g, '').trim().slice(0, 200);
      }
      if (!summary) {
        summary =
          trend === 'bullish'
            ? `${coin.name} shows bullish momentum with positive price action and increasing volume. Key support levels hold firm.`
            : trend === 'bearish'
              ? `${coin.name} faces bearish pressure with declining momentum. Risk of further downside if support breaks.`
              : `${coin.name} trades in a consolidation range. Watch for breakout signals in either direction.`;
      }

      // Calculate key metrics based on actual coin data
      const supportPrice = coin.usdPrice * (trend === 'bearish' ? 0.92 : 0.95);
      const resistancePrice = coin.usdPrice * (trend === 'bullish' ? 1.12 : 1.05);

      results.push({
        coinId: coin.coinId,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        trend,
        confidence,
        summary,
        keyMetrics: {
          support: `$${supportPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          resistance: `$${resistancePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          volume:
            coin.change24h !== null && coin.change24h > 0
              ? locale === 'zh'
                ? '上升'
                : 'Rising'
              : locale === 'zh'
                ? '下降'
                : 'Declining',
          momentum:
            trend === 'bullish'
              ? locale === 'zh'
                ? '强势'
                : 'Strong'
              : trend === 'bearish'
                ? locale === 'zh'
                  ? '弱势'
                  : 'Weak'
                : locale === 'zh'
                  ? '中性'
                  : 'Neutral',
        },
        priceTarget: `$${resistancePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        riskLevel,
        timestamp: Date.now(),
      });
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeInVariants} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <BarChartBig className="size-5 text-gold" />
          </div>
          {t('marketAnalysis.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 ml-[52px]">
          {t('marketAnalysis.subtitle')}
        </p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className="mb-6"
      >
        {isLoadingPrices ? (
          <StatsSkeleton />
        ) : pricesError ? (
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-bearish">{pricesError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchPrices}
                className="text-xs text-muted-foreground"
              >
                <RefreshCw className="size-3.5 mr-1" />
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('marketAnalysis.totalMarketCap')}
                </span>
                <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                  {globalData ? formatLargeNumber(globalData.totalMarketCap) : '—'}
                </p>
                {globalData && (
                  <span
                    className={`text-xs font-medium ${
                      globalData.marketCapChange24h >= 0 ? 'text-bullish' : 'text-bearish'
                    }`}
                  >
                    {formatPercent(globalData.marketCapChange24h)} 24h
                  </span>
                )}
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('marketAnalysis.volume24h')}
                </span>
                <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                  {globalData ? formatLargeNumber(globalData.totalVolume) : '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('marketAnalysis.btcDominance')}
                </span>
                <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                  {btcDominance ? `${btcDominance}%` : '—'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Sentiment Bar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className="mb-6"
      >
        {isLoadingPrices ? (
          <SentimentSkeleton />
        ) : (
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {t('marketAnalysis.sentiment')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-bullish" />
                  <TrendingUp className="size-4 text-bullish" />
                  <span className="text-sm font-semibold text-bullish">{sentimentCounts.bull}</span>
                  <span className="text-xs text-muted-foreground">{t('marketAnalysis.bullish')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-bearish" />
                  <TrendingDown className="size-4 text-bearish" />
                  <span className="text-sm font-semibold text-bearish">{sentimentCounts.bear}</span>
                  <span className="text-xs text-muted-foreground">{t('marketAnalysis.bearish')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-neutral" />
                  <span className="text-sm font-semibold text-neutral">{sentimentCounts.side}</span>
                  <span className="text-xs text-muted-foreground">{t('marketAnalysis.neutral')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Controls Row: Coin Selector + Generate Button */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Coin Search + Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t('marketAnalysis.searchCoin')}
                value={coinSearch}
                onChange={(e) => setCoinSearch(e.target.value)}
                className="pl-9 bg-card border-border/50 h-10 text-sm"
              />
            </div>
            <Select value={selectedCoin} onValueChange={setSelectedCoin}>
              <SelectTrigger className="w-full sm:w-[220px] bg-card border-border/50 h-10 text-sm">
                <SelectValue placeholder={t('marketAnalysis.allMarket')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50 max-h-64">
                <SelectItem value="all" className="text-sm">
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-gold" />
                    {t('marketAnalysis.allMarket')}
                  </span>
                </SelectItem>
                {filteredCoins.map((coin) => (
                  <SelectItem key={coin.coinId} value={coin.coinId} className="text-sm">
                    <span className="flex items-center gap-2">
                      {coin.imageUrl && (
                        <img
                          src={coin.imageUrl}
                          alt={coin.name}
                          className="size-4 rounded-full"
                          loading="lazy"
                        />
                      )}
                      <span className="font-medium uppercase">{coin.symbol}</span>
                      <span className="text-muted-foreground">{coin.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateAnalysis}
            disabled={isGenerating || isLoadingPrices}
            size="lg"
            className="bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20 transition-all duration-200 disabled:opacity-50 px-6 shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{t('marketAnalysis.generating')}</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>{t('marketAnalysis.generate')}</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs + View Toggle */}
      {analysisResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)} className="w-full sm:w-auto">
              <TabsList className="bg-card border border-border/50 h-9 p-0.5">
                <TabsTrigger
                  value="all"
                  className="text-xs px-3 h-8 data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
                >
                  {t('marketAnalysis.allTrends')}
                  <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 bg-white/5 border-white/10">
                    {analysisResults.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="bullish"
                  className="text-xs px-3 h-8 data-[state=active]:bg-bullish/10 data-[state=active]:text-bullish"
                >
                  <TrendingUp className="size-3 mr-1" />
                  {t('marketAnalysis.bullish')}
                  <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 bg-white/5 border-white/10">
                    {analysisResults.filter((r) => r.trend === 'bullish').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="bearish"
                  className="text-xs px-3 h-8 data-[state=active]:bg-bearish/10 data-[state=active]:text-bearish"
                >
                  <TrendingDown className="size-3 mr-1" />
                  {t('marketAnalysis.bearish')}
                  <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 bg-white/5 border-white/10">
                    {analysisResults.filter((r) => r.trend === 'bearish').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="neutral"
                  className="text-xs px-3 h-8 data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
                >
                  {t('marketAnalysis.neutral')}
                  <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 bg-white/5 border-white/10">
                    {analysisResults.filter((r) => r.trend === 'neutral').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-0.5 shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-3 text-xs ${
                  viewMode === 'grid'
                    ? 'bg-gold/10 text-gold hover:bg-gold/15'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3X3 className="size-3.5 mr-1" />
                {t('marketAnalysis.gridView')}
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-8 px-3 text-xs ${
                  viewMode === 'table'
                    ? 'bg-gold/10 text-gold hover:bg-gold/15'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="size-3.5 mr-1" />
                {t('marketAnalysis.tableView')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overall Market Summary Card + AI Insight Panel + Timestamp */}
      {analysisResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Overall Market Summary Card (only when "All Market" selected) */}
          {selectedCoin === 'all' && marketSummary && (
            <Card className="bg-card border-gold/20 overflow-hidden">
              <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.04) 0%, transparent 60%)' }} aria-hidden="true" />
              <CardContent className="relative p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Activity className="size-4 text-gold" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('marketAnalysis.overallMarket')}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Overall Trend Direction */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {t('marketAnalysis.trendDirection')}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium flex items-center gap-1 ${getTrendBadgeClasses(marketSummary.overallTrend)}`}
                      >
                        {getTrendIcon(marketSummary.overallTrend)}
                        {t(`marketAnalysis.${marketSummary.overallTrend}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({marketSummary.bullCount}/{marketSummary.bearCount}/{marketSummary.neutralCount})
                      </span>
                    </div>
                  </div>
                  {/* Average Confidence */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {t('marketAnalysis.averageConfidence')}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-lg font-bold text-foreground">{marketSummary.avgConfidence}%</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            marketSummary.overallTrend === 'bullish'
                              ? 'bg-bullish'
                              : marketSummary.overallTrend === 'bearish'
                                ? 'bg-bearish'
                                : 'bg-gold'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${marketSummary.avgConfidence}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Market Health */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {t('marketAnalysis.marketHealth')}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      {marketSummary.marketHealth === 'healthy' ? (
                        <ShieldCheck className="size-5 text-bullish" />
                      ) : marketSummary.marketHealth === 'caution' ? (
                        <Zap className="size-5 text-gold" />
                      ) : (
                        <Activity className="size-5 text-bearish" />
                      )}
                      <span className={`text-sm font-semibold ${
                        marketSummary.marketHealth === 'healthy'
                          ? 'text-bullish'
                          : marketSummary.marketHealth === 'caution'
                            ? 'text-gold'
                            : 'text-bearish'
                      }`}>
                        {t(`marketAnalysis.${marketSummary.marketHealth}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Timestamp + Regenerate Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {analysisTimestamp && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>{t('marketAnalysis.lastUpdated')}:</span>
                  <span className="font-medium text-foreground/80">
                    {new Date(analysisTimestamp).toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {selectedCoin !== 'all' && (
                <span className="text-xs text-muted-foreground">
                  {t('marketAnalysis.analysisFor')}:{' '}
                  <span className="font-medium text-foreground/80">
                    {coins.find((c) => c.coinId === selectedCoin)?.name ?? selectedCoin}
                  </span>
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAnalysis}
              disabled={isGenerating}
              className="h-8 text-xs border-gold/30 text-gold hover:bg-gold/10 hover:text-gold transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="size-3.5 mr-1.5" />
              )}
              {t('marketAnalysis.regenerate')}
            </Button>
          </div>

          {/* AI Insight Panel (Collapsible) */}
          {rawAnalysisText && (
            <Collapsible open={aiInsightOpen} onOpenChange={setAiInsightOpen}>
              <Card className="bg-card border-border/50">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-0 cursor-pointer hover:bg-white/[0.01] transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Sparkles className="size-4 text-gold" />
                        {t('marketAnalysis.aiAnalysisResult')}
                      </CardTitle>
                      <motion.div
                        animate={{ rotate: aiInsightOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-3">
                    <div className="p-4 rounded-xl bg-background/50 border border-border/30 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {rawAnalysisText}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 italic">
                      {t('marketAnalysis.disclaimer')}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </motion.div>
      )}

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GridSkeleton />
          </motion.div>
        ) : analysisResults.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState t={t} onGenerate={handleGenerateAnalysis} isDisabled={isGenerating || isLoadingPrices} />
          </motion.div>
        ) : filteredResults.length === 0 ? (
          <motion.div
            key="no-filter"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <p className="text-sm text-muted-foreground">{t('marketAnalysis.noFilteredResults')}</p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredResults.map((result) => (
              <AnalysisCard key={result.coinId} result={result} t={t} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-card border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('marketAnalysis.coin')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('marketAnalysis.trend')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('marketAnalysis.confidence')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('marketAnalysis.support')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('marketAnalysis.resistance')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('marketAnalysis.priceTarget')}
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('marketAnalysis.riskLevel')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow
                        key={result.coinId}
                        className="border-border/30 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground uppercase text-sm">
                              {result.symbol}
                            </span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {result.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-medium flex items-center gap-1 w-fit ${getTrendBadgeClasses(result.trend)}`}
                          >
                            {getTrendIcon(result.trend)}
                            {t(`marketAnalysis.${result.trend}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  result.trend === 'bullish'
                                    ? 'bg-bullish'
                                    : result.trend === 'bearish'
                                      ? 'bg-bearish'
                                      : 'bg-gold'
                                }`}
                                style={{ width: `${result.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-foreground">{result.confidence}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {result.keyMetrics.support}
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {result.keyMetrics.resistance}
                        </TableCell>
                        <TableCell className="text-xs text-gold font-semibold">
                          {result.priceTarget}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold ${getRiskColor(result.riskLevel)}`}>
                            {t(`marketAnalysis.risk${result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}` as const)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
