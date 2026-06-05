'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  Zap,
  Shield,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  RefreshCw,
  CandlestickChart,
  Target,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  MinusCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  change24h: number;
  volume24h: number;
  marketCap: number;
  imageUrl: string;
}

interface AIAnalysisResult {
  message: string;
}

interface TechnicalIndicator {
  name: string;
  value: string;
  signal: 'buy' | 'sell' | 'hold';
  description: string;
}

interface SignalEntry {
  indicator: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  detail: string;
}

// ---------------------------------------------------------------------------
// Quick-pick coins
// ---------------------------------------------------------------------------

const QUICK_PICKS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'DOGE', name: 'Dogecoin' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatCompact(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function getSignalColor(signal: 'buy' | 'sell' | 'hold'): string {
  switch (signal) {
    case 'buy': return 'text-bullish';
    case 'sell': return 'text-bearish';
    case 'hold': return 'text-gold';
  }
}

function getSignalBg(signal: 'buy' | 'sell' | 'hold'): string {
  switch (signal) {
    case 'buy': return 'bg-bullish/10 border-bullish/20 text-bullish';
    case 'sell': return 'bg-bearish/10 border-bearish/20 text-bearish';
    case 'hold': return 'bg-gold/10 border-gold/20 text-gold';
  }
}

function getSignalIcon(signal: 'buy' | 'sell' | 'hold') {
  switch (signal) {
    case 'buy': return <ArrowUpRight className="size-4" />;
    case 'sell': return <ArrowDownRight className="size-4" />;
    case 'hold': return <MinusCircle className="size-4" />;
  }
}

// ---------------------------------------------------------------------------
// Mock technical indicators (seeded by coin symbol)
// ---------------------------------------------------------------------------

function generateMockIndicators(symbol: string): TechnicalIndicator[] {
  // Use a simple hash to make mock data consistent per symbol
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash + symbol.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);

  const rsi = 30 + (seed % 40); // 30-70
  const macdSignal = (seed % 3) as 0 | 1 | 2; // 0=buy, 1=sell, 2=hold
  const bbPosition = (seed % 3) as 0 | 1 | 2;
  const sma20signal = (seed % 3) as 0 | 1 | 2;
  const sma50signal = ((seed + 1) % 3) as 0 | 1 | 2;
  const sma200signal = ((seed + 2) % 3) as 0 | 1 | 2;
  const volSignal = (seed % 3) as 0 | 1 | 2;

  const signals: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold'];

  return [
    {
      name: 'RSI (14)',
      value: rsi.toFixed(1),
      signal: rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'hold',
      description: rsi < 30 ? 'Oversold — potential reversal upward' : rsi > 70 ? 'Overbought — potential reversal downward' : 'Neutral range — no extreme readings',
    },
    {
      name: 'MACD',
      value: signals[macdSignal] === 'buy' ? 'Bullish crossover' : signals[macdSignal] === 'sell' ? 'Bearish crossover' : 'Signal line convergence',
      signal: signals[macdSignal],
      description: signals[macdSignal] === 'buy' ? 'MACD crossed above signal line' : signals[macdSignal] === 'sell' ? 'MACD crossed below signal line' : 'MACD and signal line converging',
    },
    {
      name: 'Bollinger Bands',
      value: signals[bbPosition] === 'buy' ? 'Lower band' : signals[bbPosition] === 'sell' ? 'Upper band' : 'Mid-band',
      signal: signals[bbPosition],
      description: signals[bbPosition] === 'buy' ? 'Price near lower band — oversold' : signals[bbPosition] === 'sell' ? 'Price near upper band — overbought' : 'Price in middle of bands',
    },
    {
      name: 'SMA 20',
      value: signals[sma20signal] === 'buy' ? 'Above' : signals[sma20signal] === 'sell' ? 'Below' : 'Touching',
      signal: signals[sma20signal],
      description: signals[sma20signal] === 'buy' ? 'Price above 20-period SMA — short-term bullish' : signals[sma20signal] === 'sell' ? 'Price below 20-period SMA — short-term bearish' : 'Price at 20-period SMA — indecision',
    },
    {
      name: 'SMA 50',
      value: signals[sma50signal] === 'buy' ? 'Above' : signals[sma50signal] === 'sell' ? 'Below' : 'Touching',
      signal: signals[sma50signal],
      description: signals[sma50signal] === 'buy' ? 'Price above 50-period SMA — medium-term bullish' : signals[sma50signal] === 'sell' ? 'Price below 50-period SMA — medium-term bearish' : 'Price at 50-period SMA — consolidation',
    },
    {
      name: 'SMA 200',
      value: signals[sma200signal] === 'buy' ? 'Above' : signals[sma200signal] === 'sell' ? 'Below' : 'Touching',
      signal: signals[sma200signal],
      description: signals[sma200signal] === 'buy' ? 'Price above 200-period SMA — long-term bullish' : signals[sma200signal] === 'sell' ? 'Price below 200-period SMA — long-term bearish' : 'Price at 200-period SMA — major decision point',
    },
    {
      name: 'Volume',
      value: signals[volSignal] === 'buy' ? 'Above average' : signals[volSignal] === 'sell' ? 'Below average' : 'Average',
      signal: signals[volSignal],
      description: signals[volSignal] === 'buy' ? 'High volume confirms trend strength' : signals[volSignal] === 'sell' ? 'Low volume — weak conviction' : 'Normal volume levels',
    },
  ];
}

// ---------------------------------------------------------------------------
// Mock signals data
// ---------------------------------------------------------------------------

function generateMockSignals(symbol: string): SignalEntry[] {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash + symbol.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);
  const signals: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold'];

  return [
    {
      indicator: 'Moving Averages',
      signal: signals[seed % 3],
      confidence: 60 + (seed % 30),
      detail: 'Based on SMA 20/50/200 and EMA crossovers',
    },
    {
      indicator: 'Oscillators',
      signal: signals[(seed + 1) % 3],
      confidence: 55 + ((seed + 7) % 35),
      detail: 'RSI, Stochastic, CCI, and MACD readings',
    },
    {
      indicator: 'Momentum',
      signal: signals[(seed + 2) % 3],
      confidence: 50 + ((seed + 3) % 40),
      detail: 'Rate of change and momentum indicators',
    },
    {
      indicator: 'Volatility',
      signal: signals[(seed + 3) % 3],
      confidence: 45 + ((seed + 11) % 40),
      detail: 'Bollinger Bands width and ATR analysis',
    },
    {
      indicator: 'Volume Analysis',
      signal: signals[(seed + 4) % 3],
      confidence: 55 + ((seed + 5) % 35),
      detail: 'OBV, volume trend, and accumulation patterns',
    },
    {
      indicator: 'Support & Resistance',
      signal: signals[(seed + 5) % 3],
      confidence: 50 + ((seed + 9) % 35),
      detail: 'Key level analysis and pivot points',
    },
    {
      indicator: 'Trend Strength',
      signal: signals[(seed + 1) % 3],
      confidence: 60 + ((seed + 2) % 30),
      detail: 'ADX and directional movement analysis',
    },
    {
      indicator: 'Market Sentiment',
      signal: signals[(seed + 2) % 3],
      confidence: 50 + ((seed + 13) % 35),
      detail: 'Fear & Greed and social sentiment overlay',
    },
  ];
}

// ---------------------------------------------------------------------------
// Compute aggregate summary from indicators
// ---------------------------------------------------------------------------

function computeSummary(indicators: TechnicalIndicator[], t: (key: string) => string) {
  const buyCount = indicators.filter((i) => i.signal === 'buy').length;
  const sellCount = indicators.filter((i) => i.signal === 'sell').length;
  const holdCount = indicators.filter((i) => i.signal === 'hold').length;

  let trend: 'bullish' | 'bearish' | 'neutral';
  let recommendation: 'buy' | 'sell' | 'hold';
  let risk: 'low' | 'medium' | 'high';

  if (buyCount > sellCount && buyCount > holdCount) {
    trend = 'bullish';
  } else if (sellCount > buyCount && sellCount > holdCount) {
    trend = 'bearish';
  } else {
    trend = 'neutral';
  }

  if (buyCount >= 4) recommendation = 'buy';
  else if (sellCount >= 4) recommendation = 'sell';
  else recommendation = 'hold';

  if (sellCount >= 5) risk = 'high';
  else if (holdCount >= 4) risk = 'medium';
  else risk = 'low';

  return {
    trend,
    recommendation,
    risk,
    trendLabel: t(`technicalAnalysis.${trend}`),
    recommendationLabel: t(`technicalAnalysis.${recommendation}`),
    riskLabel: t(`technicalAnalysis.${risk}`),
  };
}

// ---------------------------------------------------------------------------
// TradingView Widget
// ---------------------------------------------------------------------------

function TradingViewWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous widget
    const container = containerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // TradingView is loaded via external script
      const TV = (window as Record<string, unknown>).TradingView as
        | { widget: new (config: Record<string, unknown>) => { remove: () => void } }
        | undefined;
      if (TV && containerRef.current) {
        widgetRef.current = new TV.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}USDT`,
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0a0f',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          hide_side_toolbar: false,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies',
          ],
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (widgetRef.current) {
        try { (widgetRef.current as { remove: () => void }).remove(); } catch { /* ignore */ }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);

  return (
    <div
      id={`tradingview-widget-${symbol}`}
      ref={containerRef}
      className="w-full h-[500px] rounded-lg overflow-hidden"
    />
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

function SummaryCard({
  icon,
  label,
  value,
  subValue,
  colorClass,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  colorClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="bg-card/80 border-border/50 hover:border-border transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`size-8 rounded-lg flex items-center justify-center ${colorClass}`}>
              {icon}
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {label}
            </span>
          </div>
          <p className="text-xl font-bold text-foreground">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Indicator Row
// ---------------------------------------------------------------------------

function IndicatorRow({ indicator, index }: { indicator: TechnicalIndicator; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant="outline" className={getSignalBg(indicator.signal)}>
          {getSignalIcon(indicator.signal)}
          <span className="ml-1 capitalize text-xs">{indicator.signal}</span>
        </Badge>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{indicator.name}</p>
          <p className="text-xs text-muted-foreground truncate">{indicator.description}</p>
        </div>
      </div>
      <span className={`text-sm font-semibold shrink-0 ml-3 ${getSignalColor(indicator.signal)}`}>
        {indicator.value}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Signal Row
// ---------------------------------------------------------------------------

function SignalRow({ signal, index }: { signal: SignalEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
      className="p-4 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{signal.indicator}</span>
        <Badge variant="outline" className={getSignalBg(signal.signal)}>
          {getSignalIcon(signal.signal)}
          <span className="ml-1 capitalize text-xs">{signal.signal}</span>
        </Badge>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className={`font-semibold ${getSignalColor(signal.signal)}`}>{signal.confidence}%</span>
        </div>
        <Progress
          value={signal.confidence}
          className="h-1.5"
        />
      </div>
      <p className="text-xs text-muted-foreground">{signal.detail}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TechnicalAnalysisSection() {
  const { t, locale } = useI18n();

  // Selected coin
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [selectedName, setSelectedName] = useState('Bitcoin');

  // AI analysis result
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fetch coin prices
  const { data: priceData, isLoading: pricesLoading } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json as { coins: CoinData[] };
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Find current coin data
  const currentCoin = useMemo(() => {
    if (!priceData?.coins) return null;
    return priceData.coins.find((c) => c.symbol.toUpperCase() === selectedSymbol.toUpperCase()) ?? null;
  }, [priceData, selectedSymbol]);

  // Compute indicators & signals
  const indicators = useMemo(() => generateMockIndicators(selectedSymbol), [selectedSymbol]);
  const signals = useMemo(() => generateMockSignals(selectedSymbol), [selectedSymbol]);
  const summary = useMemo(() => computeSummary(indicators, t), [indicators, t]);

  // Dropdown options (top 100 coins from API)
  const dropdownCoins = useMemo(() => {
    if (!priceData?.coins) return QUICK_PICKS.map((p) => ({ symbol: p.symbol, name: p.name }));
    return priceData.coins.slice(0, 100).map((c) => ({ symbol: c.symbol.toUpperCase(), name: c.name }));
  }, [priceData]);

  // Generate AI analysis
  const generateAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Perform a comprehensive technical analysis for ${selectedName} (${selectedSymbol}). Include trend analysis, key support and resistance levels, RSI interpretation, MACD analysis, Bollinger Band positioning, moving average crossovers, volume analysis, and an overall recommendation with risk assessment. Current price: ${currentCoin ? formatPrice(currentCoin.usdPrice) : 'N/A'}. 24h change: ${currentCoin ? currentCoin.change24h.toFixed(2) + '%' : 'N/A'}.`,
          locale,
        }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: AIAnalysisResult = await res.json();
      setAnalysisResult(data.message || 'No analysis available.');
    } catch (err) {
      console.error('TA analysis error:', err);
      setAnalysisError(locale === 'zh' ? '分析请求失败，请重试。' : 'Analysis request failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSymbol, selectedName, currentCoin, locale]);

  // Handle quick-pick selection
  const handleQuickPick = useCallback((symbol: string, name: string) => {
    setSelectedSymbol(symbol);
    setSelectedName(name);
    setAnalysisResult(null);
    setAnalysisError(null);
  }, []);

  // Handle dropdown selection
  const handleDropdownSelect = useCallback(
    (value: string) => {
      const coin = dropdownCoins.find((c) => c.symbol === value);
      if (coin) {
        setSelectedSymbol(coin.symbol);
        setSelectedName(coin.name);
        setAnalysisResult(null);
        setAnalysisError(null);
      }
    },
    [dropdownCoins],
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <CandlestickChart className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('technicalAnalysis.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('technicalAnalysis.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Coin Selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-3"
      >
        {/* Quick-pick buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PICKS.map((coin) => (
            <Button
              key={coin.symbol}
              variant={selectedSymbol === coin.symbol ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickPick(coin.symbol, coin.name)}
              className={
                selectedSymbol === coin.symbol
                  ? 'bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20 font-semibold'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/40'
              }
            >
              {coin.symbol}
            </Button>
          ))}

          {/* Dropdown for top 100 */}
          <Select value={selectedSymbol} onValueChange={handleDropdownSelect}>
            <SelectTrigger
              size="sm"
              className="w-[180px] border-border/50 text-muted-foreground hover:border-gold/40"
            >
              <SelectValue placeholder="Top 100" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50 max-h-[300px]">
              {dropdownCoins.map((coin) => (
                <SelectItem key={coin.symbol} value={coin.symbol}>
                  <span className="font-medium">{coin.symbol}</span>
                  <span className="text-muted-foreground ml-1.5 text-xs">{coin.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected coin info + generate button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentCoin?.imageUrl && (
              <img
                src={currentCoin.imageUrl}
                alt={currentCoin.name}
                className="size-8 rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-bold text-foreground">
                {selectedName}{' '}
                <span className="text-muted-foreground font-normal text-sm">({selectedSymbol})</span>
              </p>
              {currentCoin && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">
                    {formatPrice(currentCoin.usdPrice)}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      currentCoin.change24h >= 0 ? 'text-bullish' : 'text-bearish'
                    }`}
                  >
                    {currentCoin.change24h >= 0 ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {Math.abs(currentCoin.change24h).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={generateAnalysis}
            disabled={isAnalyzing}
            className="bg-gold hover:bg-gold/90 text-primary-foreground shadow-lg shadow-gold/20 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t('technicalAnalysis.generating')}
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                {t('technicalAnalysis.generate')}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* AI Analysis Result */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-card/80 border-gold/20 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Sparkles className="size-4 text-gold" />
                  AI Technical Analysis — {selectedName} ({selectedSymbol})
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="prose prose-sm prose-invert max-w-none text-foreground/90 whitespace-pre-wrap break-words leading-relaxed text-sm">
                  {analysisResult}
                </div>
                <div className="flex items-center gap-1 mt-3">
                  <AlertTriangle className="size-3 text-gold/40" />
                  <span className="text-[10px] text-muted-foreground/60">
                    {locale === 'zh'
                      ? 'AI 生成内容仅供参考，不构成投资建议'
                      : 'AI-generated content for reference only. Not financial advice.'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {analysisError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-bearish/10 border border-bearish/20"
          >
            <span className="text-sm text-bearish">{analysisError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateAnalysis}
              className="h-7 px-2 text-xs text-bearish hover:text-bearish hover:bg-bearish/10"
            >
              <RefreshCw className="size-3 mr-1" />
              {t('common.retry')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pricesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card/80 border-border/50">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <SummaryCard
              icon={<BarChart3 className="size-4 text-gold" />}
              label={t('technicalAnalysis.currentPrice')}
              value={currentCoin ? formatPrice(currentCoin.usdPrice) : '—'}
              subValue={currentCoin ? `MCap: ${formatCompact(currentCoin.marketCap)}` : undefined}
              colorClass="bg-gold/10"
              delay={0}
            />
            <SummaryCard
              icon={
                summary.trend === 'bullish' ? (
                  <TrendingUp className="size-4 text-bullish" />
                ) : summary.trend === 'bearish' ? (
                  <TrendingDown className="size-4 text-bearish" />
                ) : (
                  <Minus className="size-4 text-gold" />
                )
              }
              label={t('technicalAnalysis.trendAnalysis')}
              value={summary.trendLabel}
              subValue={
                summary.trend === 'bullish'
                  ? `${indicators.filter((i) => i.signal === 'buy').length}/${indicators.length} bullish`
                  : summary.trend === 'bearish'
                  ? `${indicators.filter((i) => i.signal === 'sell').length}/${indicators.length} bearish`
                  : `${indicators.filter((i) => i.signal === 'hold').length}/${indicators.length} neutral`
              }
              colorClass={
                summary.trend === 'bullish'
                  ? 'bg-bullish/10'
                  : summary.trend === 'bearish'
                  ? 'bg-bearish/10'
                  : 'bg-gold/10'
              }
              delay={0.05}
            />
            <SummaryCard
              icon={
                summary.recommendation === 'buy' ? (
                  <Target className="size-4 text-bullish" />
                ) : summary.recommendation === 'sell' ? (
                  <Target className="size-4 text-bearish" />
                ) : (
                  <Target className="size-4 text-gold" />
                )
              }
              label={t('technicalAnalysis.recommendation')}
              value={summary.recommendationLabel}
              subValue={`Based on ${indicators.length} indicators`}
              colorClass={
                summary.recommendation === 'buy'
                  ? 'bg-bullish/10'
                  : summary.recommendation === 'sell'
                  ? 'bg-bearish/10'
                  : 'bg-gold/10'
              }
              delay={0.1}
            />
            <SummaryCard
              icon={
                summary.risk === 'low' ? (
                  <Shield className="size-4 text-bullish" />
                ) : summary.risk === 'medium' ? (
                  <AlertTriangle className="size-4 text-gold" />
                ) : (
                  <AlertTriangle className="size-4 text-bearish" />
                )
              }
              label={t('technicalAnalysis.riskLevel')}
              value={summary.riskLabel}
              subValue={`Volatility: ${summary.risk === 'low' ? 'Stable' : summary.risk === 'medium' ? 'Moderate' : 'Elevated'}`}
              colorClass={
                summary.risk === 'low'
                  ? 'bg-bullish/10'
                  : summary.risk === 'medium'
                  ? 'bg-gold/10'
                  : 'bg-bearish/10'
              }
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/30">
          <TabsTrigger value="chart" className="gap-1.5 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
            <CandlestickChart className="size-3.5" />
            {t('technicalAnalysis.chart')}
          </TabsTrigger>
          <TabsTrigger value="indicators" className="gap-1.5 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
            <Activity className="size-3.5" />
            {t('technicalAnalysis.indicators')}
          </TabsTrigger>
          <TabsTrigger value="signals" className="gap-1.5 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
            <Zap className="size-3.5" />
            {t('technicalAnalysis.signals')}
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
            <Gauge className="size-3.5" />
            {t('technicalAnalysis.overview')}
          </TabsTrigger>
        </TabsList>

        {/* Chart Tab */}
        <TabsContent value="chart">
          <Card className="bg-card/80 border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <TradingViewWidget symbol={selectedSymbol} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indicators Tab */}
        <TabsContent value="indicators">
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Activity className="size-4 text-gold" />
                {t('technicalAnalysis.indicators')}
                <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground ml-2">
                  {indicators.length} indicators
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                {indicators.map((ind, i) => (
                  <IndicatorRow key={ind.name} indicator={ind} index={i} />
                ))}
              </div>

              {/* Signal summary bar */}
              <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="size-3.5 text-bullish" />
                    <span className="text-xs text-muted-foreground">Buy:</span>
                    <span className="text-sm font-semibold text-bullish">
                      {indicators.filter((i) => i.signal === 'buy').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowDownRight className="size-3.5 text-bearish" />
                    <span className="text-xs text-muted-foreground">Sell:</span>
                    <span className="text-sm font-semibold text-bearish">
                      {indicators.filter((i) => i.signal === 'sell').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MinusCircle className="size-3.5 text-gold" />
                    <span className="text-xs text-muted-foreground">Hold:</span>
                    <span className="text-sm font-semibold text-gold">
                      {indicators.filter((i) => i.signal === 'hold').length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals">
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Zap className="size-4 text-gold" />
                {t('technicalAnalysis.signals')}
                <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground ml-2">
                  {signals.length} signals
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {signals.map((sig, i) => (
                  <SignalRow key={sig.indicator} signal={sig} index={i} />
                ))}
              </div>

              {/* Aggregate signal */}
              <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Overall Signal</span>
                  <Badge variant="outline" className={getSignalBg(summary.recommendation)}>
                    {getSignalIcon(summary.recommendation)}
                    <span className="ml-1 capitalize">{summary.recommendation}</span>
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-bullish">
                      {signals.filter((s) => s.signal === 'buy').length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buy</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gold">
                      {signals.filter((s) => s.signal === 'hold').length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hold</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-bearish">
                      {signals.filter((s) => s.signal === 'sell').length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sell</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Gauge className="size-4 text-gold" />
                {t('technicalAnalysis.overview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              {/* Summary boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t('technicalAnalysis.trendAnalysis')}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {summary.trend === 'bullish' ? (
                      <TrendingUp className="size-5 text-bullish" />
                    ) : summary.trend === 'bearish' ? (
                      <TrendingDown className="size-5 text-bearish" />
                    ) : (
                      <Minus className="size-5 text-gold" />
                    )}
                    <span
                      className={`text-lg font-bold ${
                        summary.trend === 'bullish'
                          ? 'text-bullish'
                          : summary.trend === 'bearish'
                          ? 'text-bearish'
                          : 'text-gold'
                      }`}
                    >
                      {summary.trendLabel}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t('technicalAnalysis.recommendation')}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className={`text-base px-3 py-1 ${getSignalBg(summary.recommendation)}`}>
                      {getSignalIcon(summary.recommendation)}
                      <span className="ml-1 capitalize">{summary.recommendationLabel}</span>
                    </Badge>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t('technicalAnalysis.riskLevel')}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {summary.risk === 'low' ? (
                      <Shield className="size-5 text-bullish" />
                    ) : summary.risk === 'medium' ? (
                      <AlertTriangle className="size-5 text-gold" />
                    ) : (
                      <AlertTriangle className="size-5 text-bearish" />
                    )}
                    <span
                      className={`text-lg font-bold ${
                        summary.risk === 'low'
                          ? 'text-bullish'
                          : summary.risk === 'medium'
                          ? 'text-gold'
                          : 'text-bearish'
                      }`}
                    >
                      {summary.riskLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicator breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Activity className="size-3.5 text-gold" />
                  {t('technicalAnalysis.indicators')}
                </h3>
                <div className="space-y-2">
                  {indicators.map((ind, i) => (
                    <IndicatorRow key={`overview-${ind.name}`} indicator={ind} index={i} />
                  ))}
                </div>
              </div>

              {/* Signal breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="size-3.5 text-gold" />
                  {t('technicalAnalysis.signals')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {signals.map((sig, i) => (
                    <SignalRow key={`overview-${sig.indicator}`} signal={sig} index={i} />
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-center gap-1.5 pt-2">
                <AlertTriangle className="size-3 text-gold/40" />
                <span className="text-[10px] text-muted-foreground/60">
                  {locale === 'zh'
                    ? '技术分析基于历史数据和指标计算，仅供参考，不构成投资建议。过往表现不代表未来收益。'
                    : 'Technical analysis is based on historical data and indicator calculations for reference only. Not financial advice. Past performance does not guarantee future results.'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
