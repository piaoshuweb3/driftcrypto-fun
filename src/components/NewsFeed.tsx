'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ExternalLink,
  Clock,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NewsItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  publishedAt: string;
  favicon: string;
}

type SentimentFilter = 'all' | 'bullish' | 'bearish' | 'neutral';

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch('/api/news?num=20&recency_days=7');
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  return data.items;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

function getSentimentConfig(sentiment: NewsItem['sentiment']) {
  switch (sentiment) {
    case 'bullish':
      return {
        label: 'Bullish',
        icon: TrendingUp,
        className:
          'bg-bullish/10 text-bullish border-bullish/20 hover:bg-bullish/20',
      };
    case 'bearish':
      return {
        label: 'Bearish',
        icon: TrendingDown,
        className:
          'bg-bearish/10 text-bearish border-bearish/20 hover:bg-bearish/20',
      };
    case 'neutral':
      return {
        label: 'Neutral',
        icon: Minus,
        className:
          'bg-neutral/10 text-neutral border-neutral/20 hover:bg-neutral/20',
      };
  }
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function NewsCardSkeleton() {
  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// News Card
// ---------------------------------------------------------------------------

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const sentiment = getSentimentConfig(item.sentiment);
  const SentimentIcon = sentiment.icon;

  return (
    <motion.div variants={cardVariants} layout>
      <Card className="bg-card border-border/50 overflow-hidden hover:border-gold/20 transition-colors duration-300 group h-full">
        <CardContent className="p-4 flex flex-col h-full gap-2">
          {/* Source badge + Sentiment */}
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 border-border/60 text-muted-foreground bg-muted/40 font-mono"
            >
              {extractDomain(item.url)}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 border ${sentiment.className}`}
            >
              <SentimentIcon className="size-3 mr-0.5" />
              {sentiment.label}
            </Badge>
          </div>

          {/* Title */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-gold transition-colors"
          >
            {item.title}
          </a>

          {/* Snippet */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {item.snippet}
          </p>

          {/* Footer: time + external link */}
          <div className="flex items-center justify-between pt-1 mt-auto">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              {timeAgo(item.publishedAt)}
            </span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-gold transition-colors"
              aria-label="Open original article"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function NewsFeed() {
  const [filter, setFilter] = useState<SentimentFilter>('all');
  const [visibleCount, setVisibleCount] = useState(8);

  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.sentiment === filter);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <section aria-label="AI News Feed">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Newspaper className="size-5 text-gold" />
          AI News Feed
        </h2>

        <Tabs
          value={filter}
          onValueChange={(v) => {
            setFilter(v as SentimentFilter);
            setVisibleCount(8);
          }}
        >
          <TabsList className="bg-muted/60 h-8">
            <TabsTrigger value="all" className="text-xs px-2.5 h-6">
              All
            </TabsTrigger>
            <TabsTrigger value="bullish" className="text-xs px-2.5 h-6">
              Bullish 🟢
            </TabsTrigger>
            <TabsTrigger value="bearish" className="text-xs px-2.5 h-6">
              Bearish 🔴
            </TabsTrigger>
            <TabsTrigger value="neutral" className="text-xs px-2.5 h-6">
              Neutral ⚪
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error State */}
      {isError && (
        <div className="text-center py-12">
          <p className="text-bearish text-sm">
            Failed to load news:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* News Grid */}
      {!isLoading && !isError && (
        <>
          {visible.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                No news found for this filter.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {visible.map((item, index) => (
                  <NewsCard key={item.id} item={item} index={index} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + 8)}
                className="border-border/60 text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
