'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Search,
  ArrowUp,
  ArrowDown,
  Building2,
  Wallet,
  ChevronRight,
  Landmark,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Holding {
  token: string;
  name: string;
  quantity: string;
  value: string;
  percent: number;
  change24h: number;
}

interface VCFirm {
  id: string;
  name: string;
  emoji: string;
  aum: string;
  holdings: Holding[];
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const VC_FIRMS: VCFirm[] = [
  {
    id: 'a16z',
    name: 'a16z Crypto',
    emoji: '🏛️',
    aum: '$7.6B',
    holdings: [
      { token: 'ETH', name: 'Ethereum', quantity: '245,000', value: '$890.5M', percent: 28.5, change24h: 2.30 },
      { token: 'SOL', name: 'Solana', quantity: '12,500,000', value: '$562.5M', percent: 18.0, change24h: -1.20 },
      { token: 'UNI', name: 'Uniswap', quantity: '42,000,000', value: '$378.0M', percent: 12.1, change24h: 3.80 },
      { token: 'MKR', name: 'Maker', quantity: '150,000', value: '$285.0M', percent: 9.1, change24h: 1.50 },
      { token: 'COMP', name: 'Compound', quantity: '2,800,000', value: '$168.0M', percent: 5.4, change24h: -0.80 },
    ],
  },
  {
    id: 'paradigm',
    name: 'Paradigm',
    emoji: '⬡',
    aum: '$10.2B',
    holdings: [
      { token: 'BTC', name: 'Bitcoin', quantity: '12,000', value: '$804.0M', percent: 26.0, change24h: 1.50 },
      { token: 'ETH', name: 'Ethereum', quantity: '180,000', value: '$654.0M', percent: 21.1, change24h: 2.30 },
      { token: 'SOL', name: 'Solana', quantity: '8,000,000', value: '$360.0M', percent: 11.6, change24h: -1.20 },
      { token: 'AVAX', name: 'Avalanche', quantity: '15,000,000', value: '$225.0M', percent: 7.3, change24h: -0.60 },
    ],
  },
  {
    id: 'multicoin',
    name: 'Multicoin Capital',
    emoji: '🔷',
    aum: '$3.5B',
    holdings: [
      { token: 'SOL', name: 'Solana', quantity: '20,000,000', value: '$900.0M', percent: 25.7, change24h: -1.20 },
      { token: 'BTC', name: 'Bitcoin', quantity: '4,500', value: '$301.5M', percent: 8.6, change24h: 1.50 },
      { token: 'MATIC', name: 'Polygon', quantity: '500,000,000', value: '$250.0M', percent: 7.1, change24h: 0.80 },
    ],
  },
  {
    id: 'coinbase',
    name: 'Coinbase Ventures',
    emoji: '🪙',
    aum: '$2.1B',
    holdings: [
      { token: 'ETH', name: 'Ethereum', quantity: '100,000', value: '$363.3M', percent: 17.3, change24h: 2.30 },
      { token: 'BTC', name: 'Bitcoin', quantity: '2,500', value: '$167.5M', percent: 8.0, change24h: 1.50 },
      { token: 'UNI', name: 'Uniswap', quantity: '25,000,000', value: '$225.0M', percent: 10.7, change24h: 3.80 },
    ],
  },
  {
    id: 'binance',
    name: 'Binance Labs',
    emoji: '🔶',
    aum: '$9.0B',
    holdings: [
      { token: 'BNB', name: 'BNB', quantity: '8,500,000', value: '$2.55B', percent: 38.0, change24h: 0.50 },
      { token: 'ETH', name: 'Ethereum', quantity: '200,000', value: '$728.0M', percent: 10.8, change24h: 2.30 },
      { token: 'CAKE', name: 'PancakeSwap', quantity: '120,000,000', value: '$360.0M', percent: 5.4, change24h: -1.50 },
    ],
  },
  {
    id: 'polychain',
    name: 'Polychain Capital',
    emoji: '🔗',
    aum: '$5.8B',
    holdings: [
      { token: 'BTC', name: 'Bitcoin', quantity: '8,000', value: '$536.0M', percent: 18.5, change24h: 1.50 },
      { token: 'ETH', name: 'Ethereum', quantity: '150,000', value: '$546.0M', percent: 18.8, change24h: 2.30 },
      { token: 'DOT', name: 'Polkadot', quantity: '50,000,000', value: '$350.0M', percent: 12.1, change24h: -2.10 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const firmCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 120, damping: 16 },
  }),
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 100, damping: 18 },
  }),
  exit: { opacity: 0, x: 16, transition: { duration: 0.15 } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 20, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { type: 'spring', stiffness: 80, damping: 20 },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: { duration: 0.2 },
  },
};

/* ------------------------------------------------------------------ */
/*  Token color map (for visual flair)                                 */
/* ------------------------------------------------------------------ */

const TOKEN_COLORS: Record<string, string> = {
  BTC: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  ETH: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  SOL: 'bg-purple-500/15 text-purple-400 ring-purple-500/30',
  BNB: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30',
  UNI: 'bg-pink-500/15 text-pink-400 ring-pink-500/30',
  MKR: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  COMP: 'bg-teal-500/15 text-teal-400 ring-teal-500/30',
  AVAX: 'bg-red-500/15 text-red-400 ring-red-500/30',
  MATIC: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
  CAKE: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  DOT: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/30',
};

function getTokenColor(token: string): string {
  return TOKEN_COLORS[token] ?? 'bg-gold/15 text-gold ring-gold/30';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScreenerSection() {
  const { t } = useI18n();
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletResult, setWalletResult] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedFirm = VC_FIRMS.find((f) => f.id === selectedFirmId) ?? null;

  /* ---- Handlers ---- */

  const handleFirmClick = (firmId: string) => {
    setSelectedFirmId((prev) => (prev === firmId ? null : firmId));
    setWalletResult(null);
  };

  const handleWalletLookup = () => {
    if (!walletAddress.trim()) return;
    // Simulate a wallet lookup with mock result
    setWalletResult(
      `0x${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} — Holdings: 142.5 ETH ($517.8K), 3,200 USDC, 1,000 MATIC ($500)`,
    );
  };

  /* ---- Compute portfolio bar widths for selected firm ---- */
  const maxPercent = selectedFirm
    ? Math.max(...selectedFirm.holdings.map((h) => h.percent))
    : 0;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ---- Section Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <Landmark className="size-5 text-gold" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {t('screener.title')}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-7.5">
          {t('screener.subtitle')}
        </p>
      </motion.div>

      {/* ---- VC Firm Selection Row ---- */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Search className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('screener.searchFirms')}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          style={{ scrollbarWidth: 'thin' }}
        >
          {VC_FIRMS.map((firm, i) => {
            const isSelected = selectedFirmId === firm.id;
            return (
              <motion.button
                key={firm.id}
                custom={i}
                variants={firmCardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFirmClick(firm.id)}
                className={`
                  relative flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
                  transition-colors duration-200 select-none
                  ${
                    isSelected
                      ? 'border-gold/60 bg-gold/10 shadow-lg shadow-gold/10'
                      : 'border-border bg-card hover:border-gold/30 hover:bg-accent/40'
                  }
                `}
              >
                {/* Emoji icon */}
                <span className="text-2xl leading-none" role="img" aria-label={firm.name}>
                  {firm.emoji}
                </span>

                <div className="flex flex-col items-start text-left">
                  <span
                    className={`text-sm font-semibold leading-tight ${
                      isSelected ? 'text-gold' : 'text-foreground'
                    }`}
                  >
                    {firm.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {t('screener.totalAUM')}: {firm.aum}
                  </span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="firm-indicator"
                    className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gold"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ---- Firm Detail Panel ---- */}
      <AnimatePresence mode="wait">
        {selectedFirm ? (
          <motion.div
            key={selectedFirm.id}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="border-border bg-card overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" role="img" aria-label={selectedFirm.name}>
                      {selectedFirm.emoji}
                    </span>
                    <div>
                      <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        {selectedFirm.name}
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium border-gold/40 text-gold"
                        >
                          VC
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('screener.firmInfo')} — {t('screener.totalAUM')}: {selectedFirm.aum}
                      </p>
                    </div>
                  </div>

                  {/* Mini portfolio stats */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <PieChart className="size-4 text-gold/70" />
                      <span className="text-xs text-muted-foreground">
                        {selectedFirm.holdings.length} tokens
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="size-4 text-bullish/70" />
                      <span className="text-xs text-bullish font-medium">
                        +{selectedFirm.holdings.filter((h) => h.change24h > 0).length}
                      </span>
                      <span className="text-xs text-muted-foreground">/</span>
                      <span className="text-xs text-bearish font-medium">
                        {selectedFirm.holdings.filter((h) => h.change24h < 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Portfolio allocation bar */}
                <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-muted/30">
                  {selectedFirm.holdings.map((holding, idx) => {
                    const colors = [
                      'bg-amber-500',
                      'bg-purple-500',
                      'bg-pink-500',
                      'bg-emerald-500',
                      'bg-cyan-500',
                      'bg-orange-500',
                    ];
                    return (
                      <motion.div
                        key={holding.token}
                        initial={{ width: 0 }}
                        animate={{ width: `${holding.percent}%` }}
                        transition={{ delay: idx * 0.08, duration: 0.5, ease: 'easeOut' }}
                        className={`${colors[idx % colors.length]} first:rounded-l-full last:rounded-r-full`}
                        title={`${holding.token}: ${holding.percent}%`}
                      />
                    );
                  })}
                </div>

                {/* Holdings Table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs font-medium">
                          {t('screener.token')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium hidden sm:table-cell">
                          {t('screener.quantity')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium">
                          {t('screener.value')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium">
                          {t('screener.percentPortfolio')}
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground text-xs font-medium">
                          {t('screener.change24h')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {selectedFirm.holdings.map((holding, i) => {
                          const isPositive = holding.change24h >= 0;
                          const changeColor = isPositive ? 'text-bullish' : 'text-bearish';
                          const ChangeIcon = isPositive ? ArrowUp : ArrowDown;
                          const tokenColorClass = getTokenColor(holding.token);
                          const barWidth = (holding.percent / maxPercent) * 100;

                          return (
                            <motion.tr
                              key={`${selectedFirm.id}-${holding.token}`}
                              custom={i}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="border-border hover:bg-accent/30 transition-colors group"
                            >
                              {/* Token */}
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`inline-flex items-center justify-center size-8 rounded-full text-[11px] font-bold ring-1 ${tokenColorClass}`}
                                  >
                                    {holding.token.slice(0, 3)}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground leading-tight">
                                      {holding.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground uppercase leading-tight">
                                      {holding.token}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Quantity (hidden on mobile) */}
                              <TableCell className="text-right text-sm text-muted-foreground tabular-nums hidden sm:table-cell">
                                {holding.quantity}
                              </TableCell>

                              {/* Value */}
                              <TableCell className="text-right text-sm font-semibold text-foreground tabular-nums">
                                {holding.value}
                              </TableCell>

                              {/* Percent of Portfolio */}
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-sm font-medium text-foreground tabular-nums">
                                    {holding.percent.toFixed(1)}%
                                  </span>
                                  {/* Mini progress bar */}
                                  <div className="w-16 h-1 rounded-full bg-muted/40 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${barWidth}%` }}
                                      transition={{ delay: i * 0.06 + 0.2, duration: 0.4, ease: 'easeOut' }}
                                      className="h-full rounded-full bg-gold/60"
                                    />
                                  </div>
                                </div>
                              </TableCell>

                              {/* 24h Change */}
                              <TableCell className="text-right">
                                <span
                                  className={`inline-flex items-center gap-0.5 text-sm font-medium tabular-nums ${changeColor}`}
                                >
                                  <ChangeIcon className="size-3" />
                                  {Math.abs(holding.change24h).toFixed(2)}%
                                </span>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-dashed border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  {t('screener.noFirmSelected')}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 text-center">
                  Click a VC firm above to explore their token holdings
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Wallet Lookup ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 80, damping: 18 }}
        className="mt-6"
      >
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Wallet className="size-4 text-gold" />
              {t('screener.walletLookup')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('screener.enterWallet')}
                  value={walletAddress}
                  onChange={(e) => {
                    setWalletAddress(e.target.value);
                    setWalletResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWalletLookup();
                  }}
                  className="pl-9 h-10 bg-background/50 border-border text-sm placeholder:text-muted-foreground focus-visible:border-gold/50 focus-visible:ring-gold/20"
                />
              </div>
              <Button
                onClick={handleWalletLookup}
                disabled={!walletAddress.trim()}
                className="h-10 bg-gold text-gold-foreground hover:bg-gold/90 font-medium gap-1.5 disabled:opacity-40 shrink-0"
              >
                {t('screener.lookUp')}
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Wallet Lookup Result */}
            <AnimatePresence>
              {walletResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                  className="mt-3"
                >
                  <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Wallet className="size-4 text-gold mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground/90 break-all">
                        {walletResult}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
