'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  Search,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1)
    return (
      '$' +
      price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  return '$' + price.toFixed(6);
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
  return '$' + num.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Fetch                                                              */
/* ------------------------------------------------------------------ */

async function fetchPrices(): Promise<CoinData[]> {
  const res = await fetch('/api/prices');
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  return Array.isArray(data?.coins) ? data.coins : [];
}

/* ------------------------------------------------------------------ */
/*  Filter options                                                     */
/* ------------------------------------------------------------------ */

type FilterOption = 'all' | 'top10' | 'top50' | 'gainers' | 'losers';

const ITEMS_PER_PAGE = 10;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MarketTable() {
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [page, setPage] = useState(1);

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

  /* ---- Derived data ---- */
  const filtered = useMemo(() => {
    let result = coins ?? [];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q),
      );
    }

    // Category filter
    switch (filter) {
      case 'top10':
        result = result.slice(0, 10);
        break;
      case 'top50':
        result = result.slice(0, 50);
        break;
      case 'gainers':
        result = [...result]
          .filter((c) => c.change24h !== null && c.change24h > 0)
          .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
        break;
      case 'losers':
        result = [...result]
          .filter((c) => c.change24h !== null && c.change24h < 0)
          .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0));
        break;
      default:
        break;
    }

    return result;
  }, [coins, search, filter]);

  /* ---- Pagination ---- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  /* Reset page when filter/search changes */
  const handleFilterChange = (val: FilterOption) => {
    setFilter(val);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  /* ---- Row animation variants ---- */
  const rowVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, type: 'spring', stiffness: 100, damping: 18 },
    }),
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  };

  /* ---- Skeleton rows ---- */
  const skeletonRows = Array.from({ length: ITEMS_PER_PAGE });

  return (
    <section className="w-full">
      {/* ---- Header row ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="size-5 text-gold" />
          <h2 className="text-lg font-bold text-foreground">
            {t('market.title')}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('market.searchPlaceholder')}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9 w-full sm:w-56 bg-card border-border text-sm placeholder:text-muted-foreground focus-visible:border-gold/50 focus-visible:ring-gold/20"
            />
          </div>

          {/* Filter select */}
          <Select
            value={filter}
            onValueChange={(val) => handleFilterChange(val as FilterOption)}
          >
            <SelectTrigger className="h-9 w-full sm:w-36 bg-card border-border text-sm focus:ring-gold/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">{t('market.all')}</SelectItem>
              <SelectItem value="top10">{t('market.top10')}</SelectItem>
              <SelectItem value="top50">{t('market.top50')}</SelectItem>
              <SelectItem value="gainers">{t('market.gainers')}</SelectItem>
              <SelectItem value="losers">{t('market.losers')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ---- Table ---- */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12 text-muted-foreground text-xs font-medium">
                {t('market.rank')}
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium">
                {t('market.name')}
              </TableHead>
              <TableHead className="text-right text-muted-foreground text-xs font-medium">
                {t('market.price')}
              </TableHead>
              <TableHead className="text-right text-muted-foreground text-xs font-medium">
                {t('market.change24h')}
              </TableHead>
              <TableHead className="text-right text-muted-foreground text-xs font-medium hidden md:table-cell">
                {t('market.marketCap')}
              </TableHead>
              <TableHead className="text-right text-muted-foreground text-xs font-medium hidden md:table-cell">
                {t('market.volume24h')}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* ---- Loading state ---- */}
            {isLoading &&
              skeletonRows.map((_, i) => (
                <TableRow key={`skel-${i}`} className="border-border">
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-14 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}

            {/* ---- Error state ---- */}
            {isError && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-bearish text-sm"
                >
                  {t('market.failedToLoad')}
                </TableCell>
              </TableRow>
            )}

            {/* ---- Empty state ---- */}
            {!isLoading && !isError && paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  {t('market.noCoinsFound')}
                </TableCell>
              </TableRow>
            )}

            {/* ---- Data rows ---- */}
            <AnimatePresence mode="popLayout">
              {!isLoading &&
                !isError &&
                paged.map((coin, i) => {
                  const globalIndex =
                    (safePage - 1) * ITEMS_PER_PAGE + i + 1;
                  const isPositive =
                    coin.change24h !== null && coin.change24h >= 0;
                  const changeColor = isPositive ? 'text-bullish' : 'text-bearish';
                  const ChangeIcon = isPositive ? ArrowUp : ArrowDown;

                  return (
                    <motion.tr
                      key={coin.coinId}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="border-border hover:bg-accent/40 cursor-pointer transition-colors group"
                    >
                      {/* Rank */}
                      <TableCell className="text-muted-foreground text-xs font-mono tabular-nums">
                        {globalIndex}
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {coin.imageUrl ? (
                            <Image
                              src={coin.imageUrl}
                              alt={coin.name}
                              width={28}
                              height={28}
                              className="size-7 rounded-full shrink-0 ring-1 ring-border group-hover:ring-gold/30 transition-all"
                              unoptimized
                            />
                          ) : (
                            <span className="size-7 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold shrink-0 ring-1 ring-border group-hover:ring-gold/30 transition-all">
                              {coin.symbol.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground leading-tight truncate max-w-[120px] sm:max-w-[180px]">
                              {coin.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground uppercase leading-tight">
                              {coin.symbol}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-right text-sm font-semibold text-foreground tabular-nums">
                        {formatPrice(coin.usdPrice)}
                      </TableCell>

                      {/* 24h Change */}
                      <TableCell className="text-right">
                        {coin.change24h !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 text-sm font-medium tabular-nums ${changeColor}`}
                          >
                            <ChangeIcon className="size-3" />
                            {Math.abs(coin.change24h).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Market Cap (hidden on mobile) */}
                      <TableCell className="text-right text-sm text-muted-foreground tabular-nums hidden md:table-cell">
                        {coin.marketCap !== null
                          ? formatLargeNumber(coin.marketCap)
                          : '—'}
                      </TableCell>

                      {/* Volume (hidden on mobile) */}
                      <TableCell className="text-right text-sm text-muted-foreground tabular-nums hidden md:table-cell">
                        {coin.volume24h !== null
                          ? formatLargeNumber(coin.volume24h)
                          : '—'}
                      </TableCell>
                    </motion.tr>
                  );
                })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* ---- Pagination ---- */}
      {!isLoading && !isError && filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-muted-foreground">
            {t('market.showing')} {(safePage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} {t('market.of')}{' '}
            {filtered.length}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-border bg-card hover:bg-accent/50 hover:border-gold/30 disabled:opacity-30"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {/* Page indicator */}
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 1,
              )
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) {
                  acc.push('…');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                typeof item === 'string' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-muted-foreground text-xs"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === safePage ? 'default' : 'outline'}
                    size="icon"
                    className={`size-8 text-xs font-medium ${
                      item === safePage
                        ? 'bg-gold text-gold-foreground hover:bg-gold/90 border-gold'
                        : 'border-border bg-card hover:bg-accent/50 hover:border-gold/30'
                    }`}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="icon"
              className="size-8 border-border bg-card hover:bg-accent/50 hover:border-gold/30 disabled:opacity-30"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
