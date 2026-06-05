'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Wallet,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  PieChart,
  Briefcase,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface Holding {
  id: string;
  coinId: string;
  quantity: number;
  avgPrice: number;
  addedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const HOLDINGS_KEY = 'driftcrypto-portfolio-holdings';
const WATCHLIST_KEY = 'driftcrypto-portfolio-watchlist';
const ALLOCATION_COLORS = [
  '#f59e0b', // gold
  '#22c55e', // green
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#a855f7', // violet
];

/* ------------------------------------------------------------------ */
/*  localStorage Helpers                                               */
/* ------------------------------------------------------------------ */

function loadHoldings(): Holding[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HOLDINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: Holding[]) {
  try {
    localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
  } catch {
    // localStorage not available
  }
}

function loadWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(ids: string[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
  } catch {
    // localStorage not available
  }
}

/* ------------------------------------------------------------------ */
/*  Format Helpers                                                     */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1) {
    return (
      '$' +
      price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  return '$' + price.toFixed(6);
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
  return '$' + num.toFixed(2);
}

function formatPnl(pnl: number): string {
  const prefix = pnl >= 0 ? '+' : '';
  if (Math.abs(pnl) >= 1e9) return prefix + (pnl / 1e9).toFixed(2) + 'B';
  if (Math.abs(pnl) >= 1e6) return prefix + (pnl / 1e6).toFixed(2) + 'M';
  if (Math.abs(pnl) >= 1e3) return prefix + (pnl / 1e3).toFixed(2) + 'K';
  return prefix + pnl.toFixed(2);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ------------------------------------------------------------------ */
/*  Fetch                                                              */
/* ------------------------------------------------------------------ */

async function fetchPrices(): Promise<CoinData[]> {
  const res = await fetch('/api/prices');
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  return data.coins;
}

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 100, damping: 18 },
  }),
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 100, damping: 18 },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortfolioSection() {
  const { t } = useI18n();

  /* ---- State ---- */
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [coinSearch, setCoinSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  /* ---- Hydration-safe localStorage load using ref callback ---- */
  const initRef = useCallback((node: null) => {
    if (node !== null || initialized) return;
    queueMicrotask(() => {
      setHoldings(loadHoldings());
      setWatchlist(loadWatchlist());
      setMounted(true);
      setInitialized(true);
    });
  }, [initialized]);

  /* ---- Persist holdings ---- */
  useEffect(() => {
    if (mounted) saveHoldings(holdings);
  }, [holdings, mounted]);

  /* ---- Persist watchlist ---- */
  useEffect(() => {
    if (mounted) saveWatchlist(watchlist);
  }, [watchlist, mounted]);

  /* ---- Fetch prices ---- */
  const {
    data: coins,
    isLoading: pricesLoading,
    isError: pricesError,
  } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  /* ---- Build lookup map ---- */
  const coinMap = useMemo(() => {
    const map = new Map<string, CoinData>();
    coins?.forEach((c) => map.set(c.coinId, c));
    return map;
  }, [coins]);

  /* ---- Add holding ---- */
  const handleAddHolding = useCallback(() => {
    const qty = parseFloat(quantity);
    const price = parseFloat(purchasePrice);
    if (!selectedCoinId || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;

    // Check if already holding this coin - merge
    const existing = holdings.find((h) => h.coinId === selectedCoinId);
    if (existing) {
      const totalQuantity = existing.quantity + qty;
      const totalCost = existing.quantity * existing.avgPrice + qty * price;
      const newAvg = totalCost / totalQuantity;
      setHoldings((prev) =>
        prev.map((h) =>
          h.id === existing.id
            ? { ...h, quantity: totalQuantity, avgPrice: newAvg }
            : h,
        ),
      );
    } else {
      const newHolding: Holding = {
        id: generateId(),
        coinId: selectedCoinId,
        quantity: qty,
        avgPrice: price,
        addedAt: new Date().toISOString(),
      };
      setHoldings((prev) => [...prev, newHolding]);
    }

    // Reset form
    setSelectedCoinId('');
    setQuantity('');
    setPurchasePrice('');
    setDialogOpen(false);
  }, [selectedCoinId, quantity, purchasePrice, holdings]);

  /* ---- Remove holding ---- */
  const handleRemoveHolding = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setHoldings((prev) => prev.filter((h) => h.id !== id));
      setRemovingId(null);
    }, 300);
  }, []);

  /* ---- Toggle watchlist ---- */
  const toggleWatchlist = useCallback(
    (coinId: string) => {
      setWatchlist((prev) =>
        prev.includes(coinId)
          ? prev.filter((id) => id !== coinId)
          : [...prev, coinId],
      );
    },
    [],
  );

  /* ---- Portfolio calculations ---- */
  const portfolioData = useMemo(() => {
    const enriched = holdings.map((h) => {
      const coin = coinMap.get(h.coinId);
      const currentPrice = coin?.usdPrice ?? 0;
      const currentValue = h.quantity * currentPrice;
      const costBasis = h.quantity * h.avgPrice;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return {
        ...h,
        coin,
        currentPrice,
        currentValue,
        costBasis,
        pnl,
        pnlPercent,
      };
    });

    const totalValue = enriched.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = enriched.reduce((sum, h) => sum + h.costBasis, 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return { enriched, totalValue, totalCost, totalPnL, totalPnLPercent };
  }, [holdings, coinMap]);

  /* ---- Allocation data ---- */
  const allocationData = useMemo(() => {
    if (portfolioData.totalValue <= 0) return [];

    return portfolioData.enriched
      .map((h, idx) => ({
        coinId: h.coinId,
        symbol: h.coin?.symbol?.toUpperCase() ?? h.coinId,
        name: h.coin?.name ?? h.coinId,
        percent: (h.currentValue / portfolioData.totalValue) * 100,
        value: h.currentValue,
        color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [portfolioData]);

  /* ---- Filter coins for the dialog select ---- */
  const availableCoins = useMemo(() => {
    if (!coins) return [];
    let filtered = coins;
    if (coinSearch.trim()) {
      const q = coinSearch.toLowerCase();
      filtered = coins.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [coins, coinSearch]);

  /* ---- Auto-fill purchase price when coin is selected ---- */
  const handleCoinSelect = useCallback((coinId: string) => {
    setSelectedCoinId(coinId);
    const coin = coinMap.get(coinId);
    if (coin && !purchasePrice) {
      setPurchasePrice(coin.usdPrice.toString());
    }
  }, [coinMap, purchasePrice]);

  /* ---- Summary cards data ---- */
  const summaryCards = [
    {
      key: 'totalValue',
      label: t('portfolio.totalValue'),
      value: formatLargeNumber(portfolioData.totalValue),
      icon: CircleDollarSign,
      accent: '#f59e0b',
      sub: `${holdings.length} ${t('portfolio.holdings')}`,
    },
    {
      key: 'totalChange',
      label: t('portfolio.totalChange'),
      value:
        (portfolioData.totalPnL >= 0 ? '+' : '') +
        formatPnl(portfolioData.totalPnL),
      icon: portfolioData.totalPnL >= 0 ? TrendingUp : TrendingDown,
      accent: portfolioData.totalPnL >= 0 ? '#22c55e' : '#ef4444',
      sub:
        portfolioData.totalPnLPercent >= 0
          ? '+' + portfolioData.totalPnLPercent.toFixed(2) + '%'
          : portfolioData.totalPnLPercent.toFixed(2) + '%',
    },
    {
      key: 'performance',
      label: t('portfolio.performance'),
      value:
        portfolioData.totalPnLPercent >= 0
          ? '+' + portfolioData.totalPnLPercent.toFixed(2) + '%'
          : portfolioData.totalPnLPercent.toFixed(2) + '%',
      icon: portfolioData.totalPnLPercent >= 0 ? ArrowUpRight : ArrowDownRight,
      accent: portfolioData.totalPnLPercent >= 0 ? '#22c55e' : '#ef4444',
      sub:
        holdings.length > 0
          ? `${portfolioData.enriched.filter((h) => h.pnl >= 0).length}/${holdings.length} profitable`
          : '—',
    },
  ];

  /* ---- Watchlist coins ---- */
  const watchlistCoins = useMemo(() => {
    return watchlist
      .map((id) => coinMap.get(id))
      .filter((c): c is CoinData => !!c);
  }, [watchlist, coinMap]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Hidden ref for hydration-safe init */}
      <span ref={initRef} className="hidden" aria-hidden="true" />
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/15 flex items-center justify-center">
            <Briefcase className="size-5 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('portfolio.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('portfolio.subtitle')}</p>
          </div>
        </div>

        {/* Add Holding Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-gold-foreground font-semibold gap-2 shadow-lg shadow-gold/20">
              <Plus className="size-4" />
              {t('portfolio.addHolding')}
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Wallet className="size-5 text-gold" />
                {t('portfolio.addCoin')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('portfolio.selectCoin')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Coin Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search coins..."
                  value={coinSearch}
                  onChange={(e) => setCoinSearch(e.target.value)}
                  className="pl-8 h-9 bg-background border-border text-sm focus-visible:border-gold/50 focus-visible:ring-gold/20"
                />
              </div>

              {/* Coin Select */}
              <Select value={selectedCoinId} onValueChange={handleCoinSelect}>
                <SelectTrigger className="w-full h-10 bg-background border-border focus:ring-gold/20">
                  <SelectValue placeholder={t('portfolio.selectCoin')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60">
                  {availableCoins.length === 0 && (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                      No coins found
                    </div>
                  )}
                  {availableCoins.map((coin) => (
                    <SelectItem key={coin.coinId} value={coin.coinId}>
                      <div className="flex items-center gap-2">
                        {coin.imageUrl ? (
                          <Image
                            src={coin.imageUrl}
                            alt={coin.name}
                            width={18}
                            height={18}
                            className="size-[18px] rounded-full"
                            unoptimized
                          />
                        ) : (
                          <span className="size-[18px] rounded-full bg-gold/15 flex items-center justify-center text-[10px] font-bold text-gold">
                            {coin.symbol.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span>{coin.name}</span>
                        <span className="text-muted-foreground uppercase text-xs">
                          {coin.symbol}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('portfolio.quantity')}
                </label>
                <Input
                  type="number"
                  placeholder={t('portfolio.enterQuantity')}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="any"
                  className="h-10 bg-background border-border text-sm focus-visible:border-gold/50 focus-visible:ring-gold/20"
                />
              </div>

              {/* Purchase Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('portfolio.avgPrice')} (USD)
                </label>
                <Input
                  type="number"
                  placeholder={t('portfolio.enterPrice')}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  min="0"
                  step="any"
                  className="h-10 bg-background border-border text-sm focus-visible:border-gold/50 focus-visible:ring-gold/20"
                />
              </div>

              {/* Preview */}
              {selectedCoinId && quantity && purchasePrice && (
                <div className="rounded-lg bg-background/50 border border-border p-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Cost</span>
                    <span className="text-foreground font-medium">
                      {formatPrice(parseFloat(quantity) * parseFloat(purchasePrice))}
                    </span>
                  </div>
                  {coinMap.get(selectedCoinId) && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Current Price</span>
                      <span className="text-foreground font-medium">
                        {formatPrice(coinMap.get(selectedCoinId)!.usdPrice)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-border bg-card hover:bg-accent/50"
              >
                {t('portfolio.cancel')}
              </Button>
              <Button
                onClick={handleAddHolding}
                disabled={
                  !selectedCoinId ||
                  !quantity ||
                  !purchasePrice ||
                  parseFloat(quantity) <= 0 ||
                  parseFloat(purchasePrice) <= 0
                }
                className="bg-gold hover:bg-gold/90 text-gold-foreground font-semibold"
              >
                <Plus className="size-4 mr-1" />
                {t('portfolio.add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="bg-card border-border/50 hover:border-border transition-colors overflow-hidden relative">
                {/* Accent glow */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] blur-2xl"
                  style={{ background: card.accent }}
                />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {card.label}
                    </span>
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${card.accent}15` }}
                    >
                      <Icon className="size-4" style={{ color: card.accent }} />
                    </div>
                  </div>
                  <p
                    className="text-2xl font-bold tabular-nums tracking-tight"
                    style={{ color: card.accent }}
                  >
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ---- Main Content Grid ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Holdings Table (2/3 width) ---- */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Briefcase className="size-4 text-gold" />
                {t('portfolio.holdings')}
                {holdings.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-gold/15 text-gold border-gold/20 text-[10px] px-1.5"
                  >
                    {holdings.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pricesLoading && (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              )}

              {pricesError && (
                <div className="text-center py-12 text-sm text-[#ef4444]">
                  Failed to load price data. Please try again later.
                </div>
              )}

              {!pricesLoading && !pricesError && holdings.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="size-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="size-7 text-gold/50" />
                  </div>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    {t('portfolio.noHoldings')}
                  </p>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="mt-4 bg-gold/15 text-gold hover:bg-gold/25 border border-gold/20"
                    variant="outline"
                  >
                    <Plus className="size-4 mr-1.5" />
                    {t('portfolio.addHolding')}
                  </Button>
                </div>
              )}

              {!pricesLoading && !pricesError && holdings.length > 0 && (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs font-medium">
                          {t('portfolio.coin')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium">
                          {t('portfolio.quantity')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium">
                          {t('portfolio.avgPrice')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium">
                          {t('portfolio.currentValue')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium">
                          {t('portfolio.pnl')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium w-16">
                          {t('portfolio.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {portfolioData.enriched.map((h, i) => {
                          const isPositive = h.pnl >= 0;
                          const pnlColor = isPositive ? '#22c55e' : '#ef4444';
                          const PnlIcon = isPositive ? TrendingUp : TrendingDown;
                          const isRemoving = removingId === h.id;

                          return (
                            <motion.tr
                              key={h.id}
                              custom={i}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className={`border-border hover:bg-accent/30 transition-colors group ${
                                isRemoving ? 'opacity-0 scale-95' : ''
                              }`}
                            >
                              {/* Coin */}
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  {h.coin?.imageUrl ? (
                                    <Image
                                      src={h.coin.imageUrl}
                                      alt={h.coin.name}
                                      width={28}
                                      height={28}
                                      className="size-7 rounded-full shrink-0 ring-1 ring-border group-hover:ring-gold/30 transition-all"
                                      unoptimized
                                    />
                                  ) : (
                                    <span className="size-7 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold shrink-0 ring-1 ring-border group-hover:ring-gold/30 transition-all">
                                      {(h.coin?.symbol ?? h.coinId)
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground leading-tight truncate max-w-[100px] sm:max-w-[140px]">
                                      {h.coin?.name ?? h.coinId}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground uppercase leading-tight">
                                      {h.coin?.symbol ?? h.coinId}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Quantity */}
                              <TableCell className="text-right text-sm text-foreground tabular-nums">
                                {h.quantity < 0.001
                                  ? h.quantity.toExponential(2)
                                  : h.quantity.toLocaleString(undefined, {
                                      maximumFractionDigits: 6,
                                    })}
                              </TableCell>

                              {/* Avg Price */}
                              <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                                {formatPrice(h.avgPrice)}
                              </TableCell>

                              {/* Current Value */}
                              <TableCell className="text-right text-sm font-semibold text-foreground tabular-nums">
                                {formatLargeNumber(h.currentValue)}
                              </TableCell>

                              {/* P&L */}
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end">
                                  <span
                                    className="text-sm font-semibold tabular-nums flex items-center gap-0.5"
                                    style={{ color: pnlColor }}
                                  >
                                    <PnlIcon className="size-3" />
                                    {formatPnl(h.pnl)}
                                  </span>
                                  <span
                                    className="text-[11px] tabular-nums"
                                    style={{ color: pnlColor }}
                                  >
                                    {h.pnlPercent >= 0 ? '+' : ''}
                                    {h.pnlPercent.toFixed(2)}%
                                  </span>
                                </div>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                                  onClick={() => handleRemoveHolding(h.id)}
                                  title={t('portfolio.remove')}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column (1/3 width) ---- */}
        <div className="space-y-6">
          {/* ---- Allocation Chart ---- */}
          <Card className="bg-card border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <PieChart className="size-4 text-gold" />
                {t('portfolio.allocation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {allocationData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="size-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    <PieChart className="size-5 text-gold/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('portfolio.noHoldings')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual Pie-like ring using CSS conic-gradient */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div
                        className="size-32 rounded-full"
                        style={{
                          background: `conic-gradient(${allocationData
                            .map((d, i) => {
                              const start = allocationData
                                .slice(0, i)
                                .reduce((sum, item) => sum + item.percent, 0);
                              return `${d.color} ${start}% ${start + d.percent}%`;
                            })
                            .join(', ')})`,
                        }}
                      />
                      {/* Inner circle for donut effect */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-20 rounded-full bg-card flex items-center justify-center flex-col">
                          <span className="text-xs text-muted-foreground">
                            Total
                          </span>
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {formatLargeNumber(portfolioData.totalValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend with bars */}
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {allocationData.map((item) => (
                      <div key={item.coinId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-2.5 rounded-full shrink-0"
                              style={{ background: item.color }}
                            />
                            <span className="font-medium text-foreground">
                              {item.symbol}
                            </span>
                          </div>
                          <span className="text-muted-foreground tabular-nums">
                            {item.percent.toFixed(1)}% · {formatLargeNumber(item.value)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: item.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Watchlist ---- */}
          <Card className="bg-card border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Star className="size-4 text-gold" />
                {t('portfolio.watchlist')}
                {watchlist.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-gold/15 text-gold border-gold/20 text-[10px] px-1.5"
                  >
                    {watchlist.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {watchlistCoins.length === 0 ? (
                <div className="text-center py-6">
                  <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
                    <Eye className="size-4 text-gold/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {coins && coins.length > 0
                      ? 'Click ★ on coins to watch them'
                      : 'Loading coins...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {watchlistCoins.map((coin, i) => {
                    const isPositive =
                      coin.change24h !== null && coin.change24h >= 0;
                    const changeColor = isPositive ? '#22c55e' : '#ef4444';

                    return (
                      <motion.div
                        key={coin.coinId}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          {coin.imageUrl ? (
                            <Image
                              src={coin.imageUrl}
                              alt={coin.name}
                              width={22}
                              height={22}
                              className="size-[22px] rounded-full ring-1 ring-border group-hover:ring-gold/30 transition-all"
                              unoptimized
                            />
                          ) : (
                            <span className="size-[22px] rounded-full bg-gold/15 flex items-center justify-center text-[9px] font-bold text-gold ring-1 ring-border group-hover:ring-gold/30 transition-all">
                              {coin.symbol.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground leading-tight">
                              {coin.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase leading-tight">
                              {coin.symbol}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-foreground tabular-nums">
                              {formatPrice(coin.usdPrice)}
                            </span>
                            {coin.change24h !== null && (
                              <span
                                className="text-[10px] tabular-nums font-medium"
                                style={{ color: changeColor }}
                              >
                                {isPositive ? '+' : ''}
                                {coin.change24h.toFixed(2)}%
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-gold hover:text-[#ef4444] hover:bg-[#ef4444]/10 shrink-0"
                            onClick={() => toggleWatchlist(coin.coinId)}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Quick add to watchlist from top coins */}
              {coins && coins.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                    Quick Add
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {coins
                      .slice(0, 8)
                      .filter((c) => !watchlist.includes(c.coinId))
                      .slice(0, 5)
                      .map((coin) => (
                        <button
                          key={coin.coinId}
                          onClick={() => toggleWatchlist(coin.coinId)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/30 hover:bg-accent/50 border border-border/50 transition-colors text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Star className="size-2.5 text-gold/60" />
                          {coin.symbol.toUpperCase()}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---- Available Coins (for adding to watchlist/portfolio) ---- */}
      {!pricesLoading && !pricesError && coins && coins.length > 0 && (
        <Card className="bg-card border-border/50 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <CircleDollarSign className="size-4 text-gold" />
              Available Coins
              <span className="text-xs text-muted-foreground font-normal ml-1">
                — Click ★ to add to watchlist
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {coins.slice(0, 20).map((coin, i) => {
                const isWatched = watchlist.includes(coin.coinId);
                const isPositive =
                  coin.change24h !== null && coin.change24h >= 0;
                const changeColor = isPositive ? '#22c55e' : '#ef4444';

                return (
                  <motion.div
                    key={coin.coinId}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/20 border border-border/40 hover:border-gold/30 hover:bg-accent/40 transition-all group cursor-default"
                  >
                    {coin.imageUrl ? (
                      <Image
                        src={coin.imageUrl}
                        alt={coin.name}
                        width={24}
                        height={24}
                        className="size-6 rounded-full ring-1 ring-border group-hover:ring-gold/30 transition-all shrink-0"
                        unoptimized
                      />
                    ) : (
                      <span className="size-6 rounded-full bg-gold/15 flex items-center justify-center text-[9px] font-bold text-gold ring-1 ring-border group-hover:ring-gold/30 transition-all shrink-0">
                        {coin.symbol.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate leading-tight">
                        {coin.symbol.toUpperCase()}
                      </p>
                      {coin.change24h !== null && (
                        <p
                          className="text-[10px] tabular-nums font-medium leading-tight"
                          style={{ color: changeColor }}
                        >
                          {isPositive ? '+' : ''}
                          {coin.change24h.toFixed(2)}%
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleWatchlist(coin.coinId)}
                      className="shrink-0 transition-colors"
                      title={
                        isWatched
                          ? 'Remove from watchlist'
                          : t('portfolio.addToWatchlist')
                      }
                    >
                      {isWatched ? (
                        <EyeOff className="size-3.5 text-gold" />
                      ) : (
                        <Eye className="size-3.5 text-muted-foreground hover:text-gold" />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Custom scrollbar styling ---- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </motion.div>
  );
}
