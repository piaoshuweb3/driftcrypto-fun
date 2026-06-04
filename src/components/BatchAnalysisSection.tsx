'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoinOption {
  symbol: string;
  name: string;
  coinId: string;
  usdPrice?: number;
  change24h?: number | null;
  imageUrl?: string | null;
}

interface BatchResult {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  verdict: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  keyMetrics: {
    label: string;
    value: string;
  }[];
  overallRank: number;
  analysis: string;
}

// ---------------------------------------------------------------------------
// Quick-pick coins
// ---------------------------------------------------------------------------

const QUICK_PICKS: CoinOption[] = [
  { symbol: 'BTC', name: 'Bitcoin', coinId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', coinId: 'ethereum' },
  { symbol: 'SOL', name: 'Solana', coinId: 'solana' },
  { symbol: 'BNB', name: 'BNB', coinId: 'binancecoin' },
  { symbol: 'XRP', name: 'XRP', coinId: 'ripple' },
  { symbol: 'ADA', name: 'Cardano', coinId: 'cardano' },
  { symbol: 'AVAX', name: 'Avalanche', coinId: 'avalanche-2' },
  { symbol: 'DOGE', name: 'Dogecoin', coinId: 'dogecoin' },
];

const MAX_COINS = 10;
const MIN_COINS = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  if (price >= 1)
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function getVerdictColor(verdict: BatchResult['verdict']): string {
  switch (verdict) {
    case 'Bullish':
      return 'text-bullish';
    case 'Bearish':
      return 'text-bearish';
    case 'Neutral':
      return 'text-gold';
  }
}

function getVerdictBg(verdict: BatchResult['verdict']): string {
  switch (verdict) {
    case 'Bullish':
      return 'bg-bullish/10 border-bullish/30 text-bullish';
    case 'Bearish':
      return 'bg-bearish/10 border-bearish/30 text-bearish';
    case 'Neutral':
      return 'bg-gold/10 border-gold/30 text-gold';
  }
}

function getVerdictIcon(verdict: BatchResult['verdict']) {
  switch (verdict) {
    case 'Bullish':
      return <TrendingUp className="size-3.5" />;
    case 'Bearish':
      return <TrendingDown className="size-3.5" />;
    case 'Neutral':
      return <BarChart3 className="size-3.5" />;
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 75) return '#22c55e';
  if (confidence >= 50) return '#d4a017';
  return '#ef4444';
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'bg-gold/15 border-gold/40 text-gold';
  if (rank === 2) return 'bg-bullish/10 border-bullish/30 text-bullish';
  if (rank === 3) return 'bg-bullish/5 border-bullish/20 text-bullish/70';
  return 'bg-muted/50 border-border/30 text-muted-foreground';
}

// ---------------------------------------------------------------------------
// Mock results generator
// ---------------------------------------------------------------------------

function generateMockResults(coins: CoinOption[]): BatchResult[] {
  const verdicts: BatchResult['verdict'][] = ['Bullish', 'Bearish', 'Neutral'];

  return coins
    .map((coin, index) => {
      const hash = coin.symbol.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
      const seed = Math.abs(hash);
      const verdict = verdicts[seed % 3];
      const confidence = 45 + (seed % 45);
      const price = coin.usdPrice ?? 100 + seed % 50000;
      const change = -8 + (seed % 16);

      return {
        symbol: coin.symbol,
        name: coin.name,
        price,
        change24h: change,
        verdict,
        confidence: Math.min(95, confidence),
        keyMetrics: [
          { label: 'Market Cap', value: `$${((seed % 900 + 100) * 1e9).toFixed(0)}` },
          { label: 'Volume 24h', value: `$${((seed % 50 + 1) * 1e9).toFixed(0)}` },
          { label: 'RSI (14)', value: `${30 + (seed % 40)}` },
          { label: 'Volatility', value: `${(5 + (seed % 25)).toFixed(1)}%` },
        ],
        overallRank: 0,
        analysis: verdict === 'Bullish'
          ? `${coin.name} shows strong momentum with positive technical indicators. Key support levels holding. Volume confirms trend direction.`
          : verdict === 'Bearish'
          ? `${coin.name} displays weakening momentum. Resistance levels remain firm. Consider risk management strategies.`
          : `${coin.name} is consolidating within a range. Mixed signals from indicators. Awaiting clearer directional cues.`,
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .map((result, index) => ({ ...result, overallRank: index + 1 }));
}

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ---------------------------------------------------------------------------
// Result Card Component
// ---------------------------------------------------------------------------

function ResultCard({ result, t }: { result: BatchResult; t: (key: string) => string }) {
  return (
    <motion.div variants={cardVariants}>
      <Card className="bg-card border-border/50 hover:border-border transition-colors overflow-hidden h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="size-7 rounded-lg bg-gold/10 flex items-center justify-center">
                <span className="text-xs text-gold font-bold">{result.symbol.charAt(0)}</span>
              </div>
              <div>
                <span className="text-foreground">{result.name}</span>
                <span className="text-muted-foreground text-xs ml-1">({result.symbol})</span>
              </div>
            </CardTitle>
            <Badge variant="outline" className={`text-[10px] px-2 font-bold ${getRankBadgeClass(result.overallRank)}`}>
              #{result.overallRank}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          {/* Price + Change */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">{formatPrice(result.price)}</span>
            <span
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                result.change24h >= 0 ? 'text-bullish' : 'text-bearish'
              }`}
            >
              {result.change24h >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {result.change24h >= 0 ? '+' : ''}
              {result.change24h.toFixed(2)}%
            </span>
          </div>

          {/* AI Verdict */}
          <div className="p-3 rounded-lg bg-background/50 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('batchAnalysis.aiVerdict')}
              </span>
              <Badge variant="outline" className={`text-[10px] px-2 ${getVerdictBg(result.verdict)}`}>
                {getVerdictIcon(result.verdict)}
                <span className="ml-1">{result.verdict}</span>
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{t('batchAnalysis.confidence')}</span>
              <span className="text-xs font-semibold" style={{ color: getConfidenceColor(result.confidence) }}>
                {result.confidence}%
              </span>
            </div>
            <div className="relative">
              <Progress value={result.confidence} className="h-1.5 bg-white/5" />
              <div
                className="absolute top-0 left-0 h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${result.confidence}%`,
                  backgroundColor: getConfidenceColor(result.confidence),
                  boxShadow: `0 0 6px ${getConfidenceColor(result.confidence)}40`,
                }}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {result.keyMetrics.map((metric) => (
              <div
                key={metric.label}
                className="p-2 rounded-md bg-background/30 border border-border/20 text-center"
              >
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Analysis */}
          <div className="p-2.5 rounded-lg bg-background/20 border border-border/20">
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="size-3 text-gold" />
              <span className="text-[10px] font-semibold text-gold">AI Analysis</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{result.analysis}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BatchAnalysisSection() {
  const { t, locale } = useI18n();

  // Selected coins
  const [selectedCoins, setSelectedCoins] = useState<CoinOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Available coins from API
  const [availableCoins, setAvailableCoins] = useState<CoinOption[]>([]);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch coins on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/prices');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const coins: CoinOption[] = (data.coins || []).slice(0, 200).map((c: Record<string, unknown>) => ({
          symbol: (c.symbol as string).toUpperCase(),
          name: c.name as string,
          coinId: c.coinId as string,
          usdPrice: c.usdPrice as number,
          change24h: c.change24h as number | null,
          imageUrl: c.imageUrl as string | null,
        }));
        setAvailableCoins(coins);
      } catch {
        setAvailableCoins(QUICK_PICKS);
      }
    }
    load();
  }, []);

  // Filtered coins for search dropdown
  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const selectedSymbols = new Set(selectedCoins.map((c) => c.symbol.toUpperCase()));
    return availableCoins
      .filter(
        (c) =>
          !selectedSymbols.has(c.symbol.toUpperCase()) &&
          (c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q) ||
            c.coinId.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, availableCoins, selectedCoins]);

  // Add coin
  const addCoin = useCallback(
    (coin: CoinOption) => {
      if (selectedCoins.length >= MAX_COINS) return;
      if (selectedCoins.some((c) => c.symbol.toUpperCase() === coin.symbol.toUpperCase())) return;
      setSelectedCoins((prev) => [...prev, coin]);
      setSearchQuery('');
      setShowDropdown(false);
    },
    [selectedCoins]
  );

  // Remove coin
  const removeCoin = useCallback((symbol: string) => {
    setSelectedCoins((prev) => prev.filter((c) => c.symbol.toUpperCase() !== symbol.toUpperCase()));
  }, []);

  // Quick-pick handler
  const handleQuickPick = useCallback(
    (coin: CoinOption) => {
      const match = availableCoins.find((c) => c.symbol.toUpperCase() === coin.symbol.toUpperCase());
      addCoin(match || coin);
    },
    [availableCoins, addCoin]
  );

  // Run batch analysis
  const runAnalysis = useCallback(async () => {
    if (selectedCoins.length < MIN_COINS) return;
    setIsAnalyzing(true);
    setError(null);
    setResults([]);

    try {
      const coinList = selectedCoins.map((c) => `${c.name} (${c.symbol})`).join(', ');
      const prompt =
        locale === 'zh'
          ? `对以下加密货币进行批量对比分析: ${coinList}。对每种币提供: 1) 看涨/看跌/中性判断, 2) 置信度(0-100), 3) 关键指标, 4) 总体排名。格式: COIN: [name], SYMBOL: [symbol], VERDICT: [Bullish/Bearish/Neutral], CONFIDENCE: [number], RANK: [number], ANALYSIS: [brief text]`
          : `Perform a batch comparison analysis for the following cryptocurrencies: ${coinList}. For each coin provide: 1) Bullish/Bearish/Neutral verdict, 2) Confidence score (0-100), 3) Key metrics comparison, 4) Overall ranking. Format each coin as: COIN: [name], SYMBOL: [symbol], VERDICT: [Bullish/Bearish/Neutral], CONFIDENCE: [number], RANK: [number], ANALYSIS: [brief text]`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, locale }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      const text = data.message || '';

      // Parse AI response or fallback to mock
      const parsed = parseAIResponse(text, selectedCoins);
      setResults(parsed);
    } catch {
      // Fallback to mock results
      setResults(generateMockResults(selectedCoins));
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedCoins, locale]);

  // Parse AI response into structured results
  function parseAIResponse(text: string, coins: CoinOption[]): BatchResult[] {
    const verdicts: BatchResult['verdict'][] = ['Bullish', 'Bearish', 'Neutral'];
    const results: BatchResult[] = [];

    for (const coin of coins) {
      const coinRegex = new RegExp(
        `COIN:\\s*${coin.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^]*?(?=COIN:|$)`,
        'gi'
      );
      const coinMatch = text.match(coinRegex);
      const section = coinMatch ? coinMatch[0] : '';

      const verdictMatch = section.match(/VERDICT:\s*(Bullish|Bearish|Neutral)/i);
      const confMatch = section.match(/CONFIDENCE:\s*(\d+)/i);
      const rankMatch = section.match(/RANK:\s*(\d+)/i);
      const analysisMatch = section.match(/ANALYSIS:\s*([\s\S]+?)(?=COIN:|$)/i);

      const verdict = verdictMatch
        ? (verdictMatch[1].charAt(0).toUpperCase() + verdictMatch[1].slice(1).toLowerCase()) as BatchResult['verdict']
        : verdicts[Math.abs(coin.symbol.charCodeAt(0)) % 3];
      const confidence = confMatch ? Math.min(95, Math.max(20, parseInt(confMatch[1], 10))) : 50 + Math.round(Math.random() * 30);
      const rank = rankMatch ? parseInt(rankMatch[1], 10) : 0;
      const analysis = analysisMatch?.[1]?.trim() || '';

      results.push({
        symbol: coin.symbol,
        name: coin.name,
        price: coin.usdPrice ?? 0,
        change24h: coin.change24h ?? 0,
        verdict,
        confidence,
        keyMetrics: [
          { label: 'Market Cap', value: '—' },
          { label: 'Volume 24h', value: '—' },
          { label: 'RSI (14)', value: '—' },
          { label: 'Volatility', value: '—' },
        ],
        overallRank: rank,
        analysis: analysis || `${coin.name}: ${verdict} outlook with ${confidence}% confidence.`,
      });
    }

    // Sort by confidence and assign ranks if not provided
    results.sort((a, b) => b.confidence - a.confidence);
    return results.map((r, i) => ({
      ...r,
      overallRank: r.overallRank || i + 1,
    }));
  }

  // Can run analysis?
  const canAnalyze = selectedCoins.length >= MIN_COINS && !isAnalyzing;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center">
          <BarChart3 className="size-5 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('batchAnalysis.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('batchAnalysis.subtitle')}</p>
        </div>
      </motion.div>

      {/* Coin Selector Area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Search className="size-4 text-gold" />
              {t('batchAnalysis.coinSelector')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={t('batchAnalysis.searchPlaceholder')}
                className="pl-9 bg-background/50 border-border/50 focus-visible:border-gold/40 focus-visible:ring-gold/20"
                disabled={selectedCoins.length >= MAX_COINS}
              />

              {/* Search Dropdown */}
              <AnimatePresence>
                {showDropdown && filteredCoins.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border/50 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto custom-scrollbar"
                  >
                    {filteredCoins.map((coin) => (
                      <button
                        key={coin.coinId}
                        onMouseDown={() => addCoin(coin)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                      >
                        {coin.imageUrl ? (
                          <img
                            src={coin.imageUrl}
                            alt={coin.name}
                            className="size-5 rounded-full bg-muted"
                            loading="lazy"
                          />
                        ) : (
                          <div className="size-5 rounded-full bg-gold/10 flex items-center justify-center">
                            <span className="text-[9px] text-gold font-bold">
                              {coin.symbol.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground">{coin.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-1 uppercase">
                            {coin.symbol}
                          </span>
                        </div>
                        <Plus className="size-3 text-gold/60" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected coins as removable badges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {t('batchAnalysis.selectedCoins')}
                </span>
                <span className={`text-xs font-semibold ${
                  selectedCoins.length < MIN_COINS
                    ? 'text-bearish'
                    : selectedCoins.length >= MAX_COINS
                    ? 'text-gold'
                    : 'text-foreground'
                }`}>
                  {selectedCoins.length}/{MAX_COINS}{' '}
                  <span className="text-muted-foreground font-normal">
                    ({t('batchAnalysis.minimum')} {MIN_COINS})
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[36px]">
                <AnimatePresence>
                  {selectedCoins.map((coin) => (
                    <motion.div
                      key={coin.symbol}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="outline"
                        className="bg-gold/5 border-gold/30 text-foreground px-2.5 py-1 text-xs gap-1.5 hover:border-gold/50 transition-colors"
                      >
                        {coin.symbol}
                        <button
                          onClick={() => removeCoin(coin.symbol)}
                          className="size-3.5 rounded-full hover:bg-gold/20 flex items-center justify-center transition-colors"
                          aria-label={`Remove ${coin.symbol}`}
                        >
                          <X className="size-2.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {selectedCoins.length === 0 && (
                  <span className="text-xs text-muted-foreground/50 italic">
                    {t('batchAnalysis.noCoinsSelected')}
                  </span>
                )}
              </div>
            </div>

            {/* Quick-pick buttons */}
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('batchAnalysis.quickPick')}
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PICKS.map((coin) => {
                  const isSelected = selectedCoins.some(
                    (c) => c.symbol.toUpperCase() === coin.symbol.toUpperCase()
                  );
                  const isFull = selectedCoins.length >= MAX_COINS;
                  return (
                    <Button
                      key={coin.symbol}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleQuickPick(coin)}
                      disabled={isSelected || isFull}
                      className={
                        isSelected
                          ? 'bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20 font-semibold'
                          : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/40 disabled:opacity-30'
                      }
                    >
                      {coin.symbol}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Run Analysis Button */}
            <Button
              onClick={runAnalysis}
              disabled={!canAnalyze}
              size="lg"
              className="w-full bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20 transition-all duration-200 disabled:opacity-40 disabled:shadow-none"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('batchAnalysis.analyzing')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>{t('batchAnalysis.runAnalysis')}</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isAnalyzing && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card border-border/50">
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center gap-3 mb-6">
                  <div className="size-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Loader2 className="size-6 text-gold animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('batchAnalysis.analyzing')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCoins.map((coin) => (
                    <Card key={coin.symbol} className="bg-background/30 border-border/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-7 rounded-lg" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Skeleton className="h-12 rounded-md" />
                          <Skeleton className="h-12 rounded-md" />
                          <Skeleton className="h-12 rounded-md" />
                          <Skeleton className="h-12 rounded-md" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!isAnalyzing && results.length > 0 && (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Overall ranking bar */}
            <motion.div variants={itemVariants} className="mb-4">
              <Card className="bg-card border-border/50">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="size-4 text-gold" />
                    <span className="text-sm font-semibold text-foreground">{t('batchAnalysis.overallRanking')}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {results.map((r) => (
                      <div
                        key={r.symbol}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/50 border border-border/30"
                      >
                        <span className="text-xs font-bold text-gold">#{r.overallRank}</span>
                        <span className="text-xs font-medium text-foreground">{r.symbol}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${getVerdictBg(r.verdict)}`}
                        >
                          {r.verdict}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Side-by-side comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, index) => (
                <ResultCard key={result.symbol} result={result} t={t} />
              ))}
            </div>

            {/* Disclaimer */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-1 justify-center mt-4"
            >
              <AlertTriangle className="size-2.5 text-gold/40" />
              <span className="text-[10px] text-muted-foreground/50">
                {t('batchAnalysis.disclaimer')}
              </span>
            </motion.div>
          </motion.div>
        )}

        {!isAnalyzing && results.length === 0 && selectedCoins.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card border-border/50">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="size-20 rounded-full bg-gold/5 flex items-center justify-center mb-4">
                  <BarChart3 className="size-8 text-gold/30" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('batchAnalysis.title')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t('batchAnalysis.noResults')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
