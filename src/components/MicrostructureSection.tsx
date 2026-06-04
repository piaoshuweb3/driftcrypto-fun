'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Microscope,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface MicrostructureData {
  symbol: string;
  name: string;
  coinId: string;
  price: number;
  imageUrl: string | null;
  spreadDollar: number;
  spreadPct: number;
  buyPct: number;
  sellPct: number;
  imbalanceLabel: 'buyDominant' | 'sellDominant' | 'balanced';
  liquidityScore: number;
  liquidityLabel: 'veryLow' | 'low' | 'medium' | 'high';
  volume24h: number;
  marketCap: number;
  volMcapRatio: number;
  volumeProfile: string;
  change24h: number | null;
}

type SortOption = 'liquidity' | 'spread' | 'volume' | 'mcap';

// ---------------------------------------------------------------------------
// Deterministic hash for consistent mock data per symbol
// ---------------------------------------------------------------------------

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded pseudo-random number generator from hash
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ---------------------------------------------------------------------------
// Volume profile descriptions
// ---------------------------------------------------------------------------

const VOLUME_PROFILES = [
  'Concentrated at current levels',
  'Distributed across price range',
  'High volume at support',
  'High volume at resistance',
  'Evenly distributed',
  'Clustered near VWAP',
  'Thin above current price',
  'Thin below current price',
  'Ascending volume profile',
  'Descending volume profile',
  'POC near current price',
  'Volume void above',
  'Volume void below',
  'Strong buying pressure at lows',
  'Strong selling pressure at highs',
  'Balanced bell curve shape',
  'Left-skewed distribution',
  'Right-skewed distribution',
  'High activity at open/close',
  'Low activity mid-range',
];

// ---------------------------------------------------------------------------
// Generate mock microstructure data
// ---------------------------------------------------------------------------

function generateMicrostructure(
  symbol: string,
  name: string,
  coinId: string,
  price: number,
  volume: number,
  marketCap: number,
  imageUrl: string | null,
  change24h: number | null,
): MicrostructureData {
  const seed = hashCode(symbol.toUpperCase());
  const rng = seededRandom(seed);

  // Spread percentage: 0.01% - 2%, lower for bigger coins
  const mcapB = (marketCap ?? 0) / 1e9;
  const spreadBase = mcapB > 100 ? 0.01 : mcapB > 10 ? 0.05 : mcapB > 1 ? 0.2 : 0.5;
  const spreadPct = spreadBase + rng() * Math.min(spreadBase * 3, 1.5);
  const spreadDollar = price * (spreadPct / 100);

  // Order book imbalance: 30-70% buy side
  const buyPct = Math.round(30 + rng() * 40);
  const sellPct = 100 - buyPct;

  let imbalanceLabel: MicrostructureData['imbalanceLabel'];
  if (buyPct > 58) imbalanceLabel = 'buyDominant';
  else if (sellPct > 58) imbalanceLabel = 'sellDominant';
  else imbalanceLabel = 'balanced';

  // Liquidity score: 0-100, higher for bigger coins
  const liquidityBase = mcapB > 100 ? 75 : mcapB > 10 ? 55 : mcapB > 1 ? 35 : 15;
  const liquidityScore = Math.round(
    Math.max(0, Math.min(100, liquidityBase + (rng() - 0.3) * 30)),
  );

  let liquidityLabel: MicrostructureData['liquidityLabel'];
  if (liquidityScore < 25) liquidityLabel = 'veryLow';
  else if (liquidityScore < 50) liquidityLabel = 'low';
  else if (liquidityScore < 75) liquidityLabel = 'medium';
  else liquidityLabel = 'high';

  // Vol/MCap ratio
  const volMcapRatio = marketCap > 0 ? ((volume ?? 0) / marketCap) * 100 : 0;

  // Volume profile
  const profileIdx = seed % VOLUME_PROFILES.length;

  return {
    symbol: symbol.toUpperCase(),
    name,
    coinId,
    price,
    imageUrl,
    spreadDollar,
    spreadPct,
    buyPct,
    sellPct,
    imbalanceLabel,
    liquidityScore,
    liquidityLabel,
    volume24h: volume ?? 0,
    marketCap: marketCap ?? 0,
    volMcapRatio,
    volumeProfile: VOLUME_PROFILES[profileIdx],
    change24h,
  };
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
}

// ---------------------------------------------------------------------------
// Liquidity score color helper
// ---------------------------------------------------------------------------

function getLiquidityColor(label: MicrostructureData['liquidityLabel']): string {
  switch (label) {
    case 'veryLow': return 'text-red-500';
    case 'low': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-bullish';
  }
}

function getLiquidityBgColor(label: MicrostructureData['liquidityLabel']): string {
  switch (label) {
    case 'veryLow': return 'bg-red-500';
    case 'low': return 'bg-orange-400';
    case 'medium': return 'bg-yellow-400';
    case 'high': return 'bg-bullish';
  }
}

function getLiquidityBorderBadge(label: MicrostructureData['liquidityLabel']): string {
  switch (label) {
    case 'veryLow': return 'border-red-500/30 text-red-500 bg-red-500/5';
    case 'low': return 'border-orange-400/30 text-orange-400 bg-orange-400/5';
    case 'medium': return 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5';
    case 'high': return 'border-bullish/30 text-bullish bg-bullish/5';
  }
}

// ---------------------------------------------------------------------------
// Imbalance badge styling
// ---------------------------------------------------------------------------

function getImbalanceBadgeStyle(label: MicrostructureData['imbalanceLabel']): string {
  switch (label) {
    case 'buyDominant': return 'border-bullish/30 text-bullish bg-bullish/5';
    case 'sellDominant': return 'border-bearish/30 text-bearish bg-bearish/5';
    case 'balanced': return 'border-neutral/30 text-neutral bg-neutral/5';
  }
}

// ---------------------------------------------------------------------------
// Coin Card sub-component
// ---------------------------------------------------------------------------

function CoinMicrostructureCard({
  data,
  index,
  t,
}: {
  data: MicrostructureData;
  index: number;
  t: (key: string) => string;
}) {
  const liquidityColor = getLiquidityColor(data.liquidityLabel);
  const liquidityBg = getLiquidityBgColor(data.liquidityLabel);
  const liquidityBadge = getLiquidityBorderBadge(data.liquidityLabel);
  const imbalanceBadge = getImbalanceBadgeStyle(data.imbalanceLabel);

  const imbalanceLabel = t(`microstructure.${data.imbalanceLabel}`);
  const liquidityLabel = t(`microstructure.${data.liquidityLabel}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * Math.min(index, 10) + 0.15, duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="bg-card border-border/50 hover:border-gold/20 transition-colors duration-200 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {data.imageUrl ? (
                <img
                  src={data.imageUrl}
                  alt={data.name}
                  className="size-8 rounded-full shrink-0"
                />
              ) : (
                <div className="size-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gold">
                    {data.symbol.slice(0, 2)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold text-foreground truncate">
                  {data.name}
                </CardTitle>
                <span className="text-[11px] text-muted-foreground uppercase">
                  {data.symbol}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-foreground">
                {formatPrice(data.price)}
              </div>
              {data.change24h !== null && (
                <span
                  className={`text-[11px] font-mono ${
                    data.change24h >= 0 ? 'text-bullish' : 'text-bearish'
                  }`}
                >
                  {data.change24h >= 0 ? '+' : ''}
                  {data.change24h.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-5 space-y-4">
          {/* Bid-Ask Spread */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {t('microstructure.bidAskSpread')}
              </span>
              <span className="text-[11px] font-mono text-foreground">
                {data.spreadDollar < 0.01
                  ? `<$0.01`
                  : `$${data.spreadDollar.toFixed(data.spreadDollar < 1 ? 4 : 2)}`}
                <span className="text-muted-foreground ml-1">
                  ({data.spreadPct.toFixed(3)}%)
                </span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  data.spreadPct < 0.1
                    ? 'bg-bullish'
                    : data.spreadPct < 0.5
                      ? 'bg-yellow-400'
                      : 'bg-bearish'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((data.spreadPct / 2) * 100, 100)}%` }}
                transition={{ delay: 0.3 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Order Book Imbalance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {t('microstructure.orderBookImbalance')}
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 ${imbalanceBadge}`}>
                {data.imbalanceLabel === 'buyDominant' && (
                  <TrendingUp className="size-2.5 mr-0.5" />
                )}
                {data.imbalanceLabel === 'sellDominant' && (
                  <TrendingDown className="size-2.5 mr-0.5" />
                )}
                {imbalanceLabel}
              </Badge>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
              <motion.div
                className="bg-bullish/80"
                initial={{ width: 0 }}
                animate={{ width: `${data.buyPct}%` }}
                transition={{ delay: 0.35 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
              />
              <motion.div
                className="bg-bearish/80"
                initial={{ width: 0 }}
                animate={{ width: `${data.sellPct}%` }}
                transition={{ delay: 0.35 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-bullish font-mono">
                {t('microstructure.buyPressure')} {data.buyPct}%
              </span>
              <span className="text-bearish font-mono">
                {t('microstructure.sellPressure')} {data.sellPct}%
              </span>
            </div>
          </div>

          {/* Liquidity Score */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {t('microstructure.liquidityScore')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${liquidityColor}`}>
                  {data.liquidityScore}
                </span>
                <Badge variant="outline" className={`text-[10px] px-1.5 ${liquidityBadge}`}>
                  {liquidityLabel}
                </Badge>
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${liquidityBg}`}
                initial={{ width: 0 }}
                animate={{ width: `${data.liquidityScore}%` }}
                transition={{ delay: 0.4 + index * 0.03, duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-muted-foreground block">
                {t('microstructure.volume24h')}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {formatCurrency(data.volume24h)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">
                {t('microstructure.volMcapRatio')}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {data.volMcapRatio.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MicrostructureSection() {
  const { t } = useI18n();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('mcap');

  // Fetch prices from API
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices');
        if (!res.ok) throw new Error('Failed to fetch prices');
        const data = await res.json();
        setCoins((data.coins ?? []).slice(0, 20));
      } catch {
        setCoins([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, []);

  // Generate microstructure data for each coin
  const microstructureData = useMemo<MicrostructureData[]>(() => {
    return coins.map((coin) =>
      generateMicrostructure(
        coin.symbol,
        coin.name,
        coin.coinId,
        coin.usdPrice,
        coin.volume24h ?? 0,
        coin.marketCap ?? 0,
        coin.imageUrl,
        coin.change24h,
      ),
    );
  }, [coins]);

  // Sort data
  const sortedData = useMemo<MicrostructureData[]>(() => {
    const sorted = [...microstructureData];
    switch (sortBy) {
      case 'liquidity':
        sorted.sort((a, b) => b.liquidityScore - a.liquidityScore);
        break;
      case 'spread':
        sorted.sort((a, b) => a.spreadPct - b.spreadPct);
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'mcap':
      default:
        sorted.sort((a, b) => b.marketCap - a.marketCap);
        break;
    }
    return sorted;
  }, [microstructureData, sortBy]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (microstructureData.length === 0) {
      return { total: 0, avgLiquidity: 0, avgSpread: 0, highLiquidityCount: 0 };
    }
    const total = microstructureData.length;
    const avgLiquidity = Math.round(
      microstructureData.reduce((sum, d) => sum + d.liquidityScore, 0) / total,
    );
    const avgSpread =
      microstructureData.reduce((sum, d) => sum + d.spreadPct, 0) / total;
    const highLiquidityCount = microstructureData.filter(
      (d) => d.liquidityScore >= 75,
    ).length;
    return { total, avgLiquidity, avgSpread, highLiquidityCount };
  }, [microstructureData]);

  // Sort options
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'mcap', label: t('microstructure.sortMarketCap') },
    { value: 'liquidity', label: t('microstructure.sortLiquidity') },
    { value: 'spread', label: t('microstructure.sortSpread') },
    { value: 'volume', label: t('microstructure.sortVolume') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Microscope className="size-6 text-gold" />
          {t('microstructure.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('microstructure.subtitle')}</p>
      </motion.div>

      {/* Summary Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <Card className="bg-card border-border/50">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="size-4 text-gold" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.totalCoins')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {summaryStats.total}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-bullish/10 flex items-center justify-center shrink-0">
                  <Activity className="size-4 text-bullish" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.avgLiquidity')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {summaryStats.avgLiquidity}
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-4 text-yellow-400" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.avgSpread')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {summaryStats.avgSpread.toFixed(3)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-bullish/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="size-4 text-bullish" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.highLiquidity')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {summaryStats.highLiquidityCount}
                    <span className="text-xs text-muted-foreground">
                      {' '}{t('microstructure.coinsAnalyzed')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sort Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex items-center gap-3"
      >
        <span className="text-sm text-muted-foreground">{t('microstructure.sortBy')}:</span>
        <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
          <SelectTrigger className="w-[180px] bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedData.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Microscope className="size-10 text-gold/30" />
            <span className="text-sm text-muted-foreground">{t('common.noData')}</span>
          </div>
        </div>
      )}

      {/* Coin Cards Grid */}
      {!loading && sortedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedData.map((data, index) => (
            <CoinMicrostructureCard
              key={data.coinId}
              data={data}
              index={index}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
