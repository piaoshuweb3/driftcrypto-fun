'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';

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

async function fetchPrices(): Promise<CoinData[]> {
  const res = await fetch('/api/prices');
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  return Array.isArray(data?.coins) ? data.coins : [];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

export default function TrendingStrip() {
  const { t } = useI18n();

  const {
    data: coins,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Take top 7 by market cap (API already sorts by market_cap_desc)
  const trendingCoins = (coins ?? []).slice(0, 7);

  return (
    <section className="w-full py-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <TrendingUp className="size-5 text-gold" />
        <h2 className="text-sm font-semibold text-gold tracking-wide uppercase">
          {t('trending.label')}
        </h2>
      </div>

      {/* Scrollable pills row */}
      <div className="relative">
        <motion.div
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoading &&
            Array.from({ length: 7 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border animate-pulse shrink-0"
                style={{ minWidth: '140px' }}
              >
                <div className="size-6 rounded-full bg-muted" />
                <div className="h-3 w-10 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
            ))}

          {isError && (
            <p className="text-sm text-bearish px-2">
              {t('trending.failedToLoad')}
            </p>
          )}

          {!isLoading &&
            !isError &&
            trendingCoins.map((coin, index) => {
              const isPositive =
                coin.change24h !== null && coin.change24h >= 0;
              const changeColor = isPositive ? 'text-bullish' : 'text-bearish';

              return (
                <motion.div key={coin.coinId} variants={itemVariants}>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-2 rounded-full border-border bg-card hover:bg-accent/50 hover:border-gold/30 transition-colors cursor-pointer shrink-0"
                    style={{ minWidth: '140px' }}
                  >
                    {/* Rank */}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {index + 1}
                    </span>

                    {/* Coin icon */}
                    {coin.imageUrl ? (
                      <Image
                        src={coin.imageUrl}
                        alt={coin.name}
                        width={20}
                        height={20}
                        className="size-5 rounded-full shrink-0"
                        unoptimized
                      />
                    ) : (
                      <span className="size-5 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">
                        {coin.symbol.charAt(0).toUpperCase()}
                      </span>
                    )}

                    {/* Symbol */}
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {coin.symbol}
                    </span>

                    {/* 24h change */}
                    {coin.change24h !== null && (
                      <span
                        className={`text-[11px] font-medium tabular-nums ${changeColor}`}
                      >
                        {isPositive ? '+' : ''}
                        {coin.change24h.toFixed(2)}%
                      </span>
                    )}
                  </Badge>
                </motion.div>
              );
            })}
        </motion.div>
      </div>
    </section>
  );
}
