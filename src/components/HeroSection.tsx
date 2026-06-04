'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';

interface GlobalData {
  totalMarketCap: number;
  totalVolume: number;
  activeCryptos: number;
  marketCapChange24h: number;
}

interface PricesResponse {
  coins: {
    coinId: string;
    symbol: string;
    name: string;
    usdPrice: number;
    change24h: number | null;
    volume24h: number | null;
    marketCap: number | null;
    imageUrl: string | null;
  }[];
  global: GlobalData;
}

async function fetchGlobalData(): Promise<GlobalData & { btcDominance: number }> {
  const res = await fetch('/api/prices');
  if (!res.ok) throw new Error('Failed to fetch');
  const data: PricesResponse = await res.json();

  // Calculate BTC dominance from coins data
  const btcCoin = data.coins.find((c) => c.coinId === 'bitcoin');
  const btcDominance =
    btcCoin?.marketCap && data.global.totalMarketCap > 0
      ? (btcCoin.marketCap / data.global.totalMarketCap) * 100
      : 0;

  return { ...data.global, btcDominance };
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden bg-white/[0.03] border-white/[0.06] backdrop-blur-md rounded-xl">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="size-9 rounded-lg bg-white/10" />
        </div>
        <Skeleton className="h-8 w-32 mb-2 bg-white/10" />
        <Skeleton className="h-4 w-20 bg-white/10" />
      </CardContent>
    </Card>
  );
}

export default function HeroSection() {
  const { t } = useI18n();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['global-market-data'],
    queryFn: fetchGlobalData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const stats = data
    ? [
        {
          title: t('hero.totalMarketCap'),
          value: formatLargeNumber(data.totalMarketCap),
          change: data.marketCapChange24h,
          icon: TrendingUp,
          iconBg: 'bg-bullish/10',
          iconColor: 'text-bullish',
        },
        {
          title: t('hero.volume24h'),
          value: formatLargeNumber(data.totalVolume),
          change: null,
          icon: BarChart3,
          iconBg: 'bg-gold/10',
          iconColor: 'text-gold',
        },
        {
          title: t('hero.btcDominance'),
          value: `${data.btcDominance.toFixed(1)}%`,
          change: null,
          icon: PieChart,
          iconBg: 'bg-chart-3/10',
          iconColor: 'text-chart-3',
        },
      ]
    : [];

  return (
    <section className="relative pt-24 pb-12 sm:pt-28 sm:pb-16 overflow-hidden">
      {/* Background: Hero banner with gradient fade */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-banner.png"
          alt=""
          fill
          className="object-cover object-center opacity-[0.08]"
          priority
          aria-hidden="true"
        />
        {/* Gradient fade from bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/70 to-[#0a0a0f]" />
        {/* Radial glow accent */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-20 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-10 sm:mb-12"
        >
          <motion.h1
            variants={headingVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
          >
            <span className="gradient-text">{t('hero.title1')}</span>{' '}
            <span className="text-foreground">{t('hero.title2')}</span>
            <br />
            <span className="text-foreground">{t('hero.title3')}</span>
          </motion.h1>
          <motion.p
            variants={headingVariants}
            className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>
        </motion.div>

        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : isError ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card className="relative overflow-hidden bg-white/[0.03] border-bearish/20 backdrop-blur-md rounded-xl">
              <CardContent className="p-5 sm:p-6 text-center">
                <Activity className="size-6 text-bearish mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('hero.failedToLoad')}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              const isPositive =
                stat.change !== null && stat.change >= 0;
              const changeColor = isPositive ? 'text-bullish' : 'text-bearish';

              return (
                <motion.div key={stat.title} variants={cardVariants}>
                  <Card className="group relative overflow-hidden bg-white/[0.03] border-white/[0.06] hover:border-gold/20 backdrop-blur-md rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/5">
                    {/* Subtle gold glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(ellipse at top, rgba(245,158,11,0.04) 0%, transparent 60%)',
                      }}
                      aria-hidden="true"
                    />
                    <CardContent className="relative p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {stat.title}
                        </span>
                        <div
                          className={`size-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}
                        >
                          <Icon className={`size-4 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                          {stat.value}
                        </span>
                      </div>
                      {stat.change !== null && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {isPositive ? (
                            <TrendingUp className="size-3.5 text-bullish" />
                          ) : (
                            <TrendingUp className="size-3.5 text-bearish rotate-180" />
                          )}
                          <span
                            className={`text-xs sm:text-sm font-medium ${changeColor}`}
                          >
                            {isPositive ? '+' : ''}
                            {stat.change.toFixed(2)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            24h
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
