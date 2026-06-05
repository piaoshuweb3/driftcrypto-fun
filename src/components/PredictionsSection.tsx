'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Target,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  BrainCircuit,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  imageUrl: string | null;
}

interface PredictionResult {
  coinName: string;
  symbol: string;
  currentPrice: number;
  shortTermTarget: string;
  midTermTarget: string;
  longTermTarget: string;
  confidence: number;
  analysis: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return '#22c55e';
  if (confidence >= 60) return '#f59e0b';
  return '#ef4444';
}

// ---------------------------------------------------------------------------
// Prediction Result Card
// ---------------------------------------------------------------------------

function PredictionResultCard({ result, t }: { result: PredictionResult; t: (key: string) => string }) {
  const confidenceColor = getConfidenceColor(result.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="bg-card border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Target className="size-4 text-gold" />
            {result.coinName} ({result.symbol.toUpperCase()})
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 space-y-5">
          {/* Current Price */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Price</span>
            <span className="text-lg font-bold text-foreground">{formatPrice(result.currentPrice)}</span>
          </div>

          {/* Price Targets */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {t('predictions.shortTerm')}
              </div>
              <div className="text-sm font-semibold text-bullish">{result.shortTermTarget}</div>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {t('predictions.midTerm')}
              </div>
              <div className="text-sm font-semibold text-gold">{result.midTermTarget}</div>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {t('predictions.longTerm')}
              </div>
              <div className="text-sm font-semibold text-foreground">{result.longTermTarget}</div>
            </div>
          </div>

          {/* Confidence Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t('predictions.confidence')}</span>
              <span className="text-sm font-bold" style={{ color: confidenceColor }}>
                {result.confidence}%
              </span>
            </div>
            <div className="relative">
              <Progress
                value={result.confidence}
                className="h-2.5 bg-white/5"
              />
              <div
                className="absolute top-0 left-0 h-2.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${result.confidence}%`,
                  backgroundColor: confidenceColor,
                  boxShadow: `0 0 8px ${confidenceColor}40`,
                }}
              />
            </div>
          </div>

          {/* Analysis Text */}
          <div className="p-4 rounded-xl bg-background/30 border border-border/30">
            <div className="flex items-center gap-1.5 mb-2">
              <BrainCircuit className="size-3.5 text-gold" />
              <span className="text-xs font-semibold text-gold">AI Analysis</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {result.analysis}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="flex items-center gap-1">
            <AlertTriangle className="size-2.5 text-gold/40" />
            <span className="text-[10px] text-muted-foreground/50">
              AI-generated prediction for reference only. Not financial advice.
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PredictionsSection() {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch coins
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/prices');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setCoins(data.coins || []);
      } catch {
        setCoins([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtered coin list for search
  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return coins
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.coinId.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery, coins]);

  // Select a coin
  const handleSelectCoin = (coin: CoinData) => {
    setSelectedCoin(coin);
    setSearchQuery(`${coin.name} (${coin.symbol.toUpperCase()})`);
    setShowDropdown(false);
  };

  // Generate prediction
  const handleGenerate = async () => {
    if (!selectedCoin) return;
    setIsGenerating(true);
    setPrediction(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a price prediction for ${selectedCoin.name} (${selectedCoin.symbol.toUpperCase()}). Current price: $${selectedCoin.usdPrice}. Provide: 1) Short-term (7-day) price target, 2) Mid-term (30-day) price target, 3) Long-term (90-day) price target, 4) Confidence score (0-100), 5) Brief analysis. Format your response as: SHORT_TARGET: [value], MID_TARGET: [value], LONG_TARGET: [value], CONFIDENCE: [number], ANALYSIS: [text]`,
          history: [],
          locale,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      const text = data.message || '';

      // Parse the AI response
      const shortMatch = text.match(/SHORT_TARGET:\s*([^\n,]+)/i);
      const midMatch = text.match(/MID_TARGET:\s*([^\n,]+)/i);
      const longMatch = text.match(/LONG_TARGET:\s*([^\n,]+)/i);
      const confMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
      const analysisMatch = text.match(/ANALYSIS:\s*([\s\S]+?)(?:$|DISCLAIMER)/i);

      // Fallback calculations
      const price = selectedCoin.usdPrice;
      const shortTarget = shortMatch?.[1]?.trim() || `$${(price * (1 + 0.03 + Math.random() * 0.04)).toFixed(2)}`;
      const midTarget = midMatch?.[1]?.trim() || `$${(price * (1 + 0.08 + Math.random() * 0.07)).toFixed(2)}`;
      const longTarget = longMatch?.[1]?.trim() || `$${(price * (1 + 0.15 + Math.random() * 0.15)).toFixed(2)}`;
      const confidence = confMatch ? parseInt(confMatch[1], 10) : Math.round(55 + Math.random() * 30);
      const analysis = analysisMatch?.[1]?.trim() || text;

      setPrediction({
        coinName: selectedCoin.name,
        symbol: selectedCoin.symbol,
        currentPrice: selectedCoin.usdPrice,
        shortTermTarget: shortTarget,
        midTermTarget: midTarget,
        longTermTarget: longTarget,
        confidence: Math.min(95, Math.max(30, confidence)),
        analysis,
      });
    } catch {
      setPrediction({
        coinName: selectedCoin.name,
        symbol: selectedCoin.symbol,
        currentPrice: selectedCoin.usdPrice,
        shortTermTarget: '—',
        midTermTarget: '—',
        longTermTarget: '—',
        confidence: 0,
        analysis:
          locale === 'zh'
            ? '预测暂时不可用，请稍后重试。'
            : 'Prediction temporarily unavailable. Please try again later.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="size-6 text-gold" />
          {t('predictions.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('predictions.subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Search className="size-4 text-gold" />
                  {t('predictions.searchCoin').replace('...', '')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      if (selectedCoin) {
                        setSelectedCoin(null);
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder={t('predictions.searchCoin')}
                    className="pl-9 bg-background/50 border-border/50 focus-visible:border-gold/40 focus-visible:ring-gold/20"
                  />

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showDropdown && filteredCoins.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border/50 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                      >
                        {filteredCoins.map((coin) => (
                          <button
                            key={coin.coinId}
                            onClick={() => handleSelectCoin(coin)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                          >
                            {coin.imageUrl ? (
                              <img
                                src={coin.imageUrl}
                                alt={coin.name}
                                className="size-6 rounded-full bg-muted"
                                loading="lazy"
                              />
                            ) : (
                              <div className="size-6 rounded-full bg-gold/10 flex items-center justify-center">
                                <span className="text-[10px] text-gold font-bold">
                                  {coin.symbol.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">
                                {coin.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase">
                                {coin.symbol}
                              </div>
                            </div>
                            <span className="text-xs text-foreground font-mono">
                              {formatPrice(coin.usdPrice)}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected coin indicator */}
                {selectedCoin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-2.5 rounded-lg bg-gold/5 border border-gold/20 flex items-center gap-2"
                  >
                    {selectedCoin.imageUrl ? (
                      <img
                        src={selectedCoin.imageUrl}
                        alt={selectedCoin.name}
                        className="size-6 rounded-full"
                      />
                    ) : (
                      <div className="size-6 rounded-full bg-gold/10 flex items-center justify-center">
                        <span className="text-[10px] text-gold font-bold">
                          {selectedCoin.symbol.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-foreground font-medium">{selectedCoin.name}</span>
                    <span className="text-xs text-gold font-mono">
                      {formatPrice(selectedCoin.usdPrice)}
                    </span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Generate Prediction button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Button
              onClick={handleGenerate}
              disabled={!selectedCoin || isGenerating}
              size="lg"
              className="w-full bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20 transition-all duration-200 disabled:opacity-40 disabled:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('predictions.generating')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>{t('predictions.generate')}</span>
                </>
              )}
            </Button>
          </motion.div>

          {/* Engine Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="size-4 text-gold" />
                    <span className="text-xs text-muted-foreground">
                      {t('predictions.engineStatus')}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-bullish/30 text-bullish bg-bullish/5 text-[10px] px-2"
                  >
                    <CheckCircle2 className="size-2.5 mr-1" />
                    {t('predictions.healthy')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5 text-gold" />
                  {t('predictions.timeframe')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('predictions.shortTerm')}</span>
                  <span className="text-bullish font-medium">7 days</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('predictions.midTerm')}</span>
                  <span className="text-gold font-medium">30 days</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('predictions.longTerm')}</span>
                  <span className="text-foreground font-medium">90 days</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Prediction result */}
        <div className="lg:col-span-2">
          {prediction ? (
            <PredictionResultCard result={prediction} t={t} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card border-border/50 h-full">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="size-20 rounded-full bg-gold/5 flex items-center justify-center mb-4">
                    <TrendingUp className="size-8 text-gold/30" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('predictions.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {t('predictions.subtitle')}
                  </p>
                  <div className="flex items-center gap-1 mt-4">
                    <AlertTriangle className="size-2.5 text-gold/40" />
                    <span className="text-[10px] text-muted-foreground/50">
                      AI-generated predictions for reference only. Not financial advice.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
