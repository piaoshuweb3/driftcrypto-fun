'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
  Coins,
  Image as ImageIcon,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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

interface NFTCollection {
  name: string;
  floorPrice: string;
  change24h: string;
  volume: string;
  positive: boolean;
  image: string;
}

interface TrendingCategory {
  name: string;
  description: string;
  coins: number;
  marketCap: string;
  change24h: string;
  positive: boolean;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockNFTs: NFTCollection[] = [
  { name: 'Bored Ape YC', floorPrice: '28.5 ETH', change24h: '+5.2%', volume: '1,245 ETH', positive: true, image: '🦍' },
  { name: 'CryptoPunks', floorPrice: '52.3 ETH', change24h: '+2.1%', volume: '890 ETH', positive: true, image: '👾' },
  { name: 'Azuki', floorPrice: '8.2 ETH', change24h: '-3.4%', volume: '560 ETH', positive: false, image: '⛩️' },
  { name: 'Pudgy Penguins', floorPrice: '12.8 ETH', change24h: '+8.7%', volume: '720 ETH', positive: true, image: '🐧' },
  { name: 'Doodles', floorPrice: '3.5 ETH', change24h: '-1.2%', volume: '340 ETH', positive: false, image: '🎨' },
  { name: 'Milady Maker', floorPrice: '4.8 ETH', change24h: '+12.3%', volume: '980 ETH', positive: true, image: '🎀' },
  { name: 'DeGods', floorPrice: '6.1 ETH', change24h: '+1.8%', volume: '450 ETH', positive: true, image: '😇' },
  { name: 'Meebits', floorPrice: '2.3 ETH', change24h: '-0.5%', volume: '210 ETH', positive: false, image: '🧊' },
];

const mockCategories: TrendingCategory[] = [
  { name: 'DeFi', description: 'Decentralized Finance protocols', coins: 245, marketCap: '$82.3B', change24h: '+3.2%', positive: true },
  { name: 'Gaming', description: 'Blockchain gaming & metaverse', coins: 189, marketCap: '$24.5B', change24h: '+5.8%', positive: true },
  { name: 'AI & Big Data', description: 'Artificial intelligence tokens', coins: 87, marketCap: '$18.7B', change24h: '+12.4%', positive: true },
  { name: 'Layer 1', description: 'Base layer blockchain protocols', coins: 124, marketCap: '$312.5B', change24h: '+1.5%', positive: true },
  { name: 'Layer 2', description: 'Scaling solutions', coins: 56, marketCap: '$28.4B', change24h: '+4.2%', positive: true },
  { name: 'Meme', description: 'Meme coins & community tokens', coins: 312, marketCap: '$45.6B', change24h: '-2.3%', positive: false },
  { name: 'RWA', description: 'Real World Asset tokenization', coins: 34, marketCap: '$5.8B', change24h: '+8.1%', positive: true },
  { name: 'Privacy', description: 'Privacy-focused cryptocurrencies', coins: 28, marketCap: '$3.2B', change24h: '-0.8%', positive: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatMarketCap(cap: number | null): string {
  if (!cap) return '—';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(vol: number | null): string {
  if (!vol) return '—';
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  return `$${vol.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Coin Card
// ---------------------------------------------------------------------------

function CoinCard({ coin, index }: { coin: CoinData; index: number }) {
  const change = coin.change24h ?? 0;
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Card className="bg-card border-border/50 hover:border-gold/20 transition-all duration-200 hover:shadow-lg hover:shadow-gold/5 h-full">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 mb-3">
            {coin.imageUrl ? (
              <img
                src={coin.imageUrl}
                alt={coin.name}
                className="size-9 rounded-full bg-muted"
                loading="lazy"
              />
            ) : (
              <div className="size-9 rounded-full bg-gold/10 flex items-center justify-center">
                <Coins className="size-4 text-gold" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{coin.name}</div>
              <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-1.5 shrink-0 ${
                isPositive
                  ? 'border-bullish/30 text-bullish bg-bullish/5'
                  : 'border-bearish/30 text-bearish bg-bearish/5'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="size-2.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="size-2.5 mr-0.5" />
              )}
              {Math.abs(change).toFixed(2)}%
            </Badge>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-lg font-bold text-foreground">{formatPrice(coin.usdPrice)}</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
            <span>MCap: {formatMarketCap(coin.marketCap)}</span>
            <span>Vol: {formatVolume(coin.volume24h)}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// NFT Card
// ---------------------------------------------------------------------------

function NFTCard({ nft, index }: { nft: NFTCollection; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Card className="bg-card border-border/50 hover:border-gold/20 transition-all duration-200 hover:shadow-lg hover:shadow-gold/5 h-full">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-gold/5 flex items-center justify-center text-xl">
              {nft.image}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{nft.name}</div>
              <div className="text-xs text-muted-foreground">Floor: {nft.floorPrice}</div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-1.5 shrink-0 ${
                nft.positive
                  ? 'border-bullish/30 text-bullish bg-bullish/5'
                  : 'border-bearish/30 text-bearish bg-bearish/5'
              }`}
            >
              {nft.positive ? (
                <ArrowUpRight className="size-2.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="size-2.5 mr-0.5" />
              )}
              {nft.change24h}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Vol: {nft.volume}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category Card
// ---------------------------------------------------------------------------

function CategoryCard({ category, index }: { category: TrendingCategory; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Card className="bg-card border-border/50 hover:border-gold/20 transition-all duration-200 hover:shadow-lg hover:shadow-gold/5 h-full">
        <CardContent className="py-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-foreground">{category.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{category.description}</div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-1.5 shrink-0 ${
                category.positive
                  ? 'border-bullish/30 text-bullish bg-bullish/5'
                  : 'border-bearish/30 text-bearish bg-bearish/5'
              }`}
            >
              {category.positive ? (
                <TrendingUp className="size-2.5 mr-0.5" />
              ) : (
                <TrendingDown className="size-2.5 mr-0.5" />
              )}
              {category.change24h}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
            <span>{category.coins} coins</span>
            <span>MCap: {category.marketCap}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Grid
// ---------------------------------------------------------------------------

function CoinSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="bg-card border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 mb-2" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TrendingPageSection() {
  const { t } = useI18n();
  const [filter, setFilter] = useState('all');
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Filter coins based on selected filter
  const filteredCoins = (() => {
    if (!coins.length) return [];
    switch (filter) {
      case 'gainers':
        return [...coins].sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
      case 'losers':
        return [...coins].sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0));
      case 'volume':
        return [...coins].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
      case 'new':
        return coins.slice(0, 8); // Simulate "new" with first 8
      default:
        return coins;
    }
  })();

  const filterButtons = [
    { key: 'all', label: t('trendingPage.allTrending'), icon: Flame },
    { key: 'gainers', label: t('trendingPage.topGainers'), icon: TrendingUp },
    { key: 'losers', label: t('trendingPage.topLosers'), icon: TrendingDown },
    { key: 'volume', label: t('trendingPage.highVolume'), icon: BarChart3 },
    { key: 'new', label: t('trendingPage.newCoins'), icon: Sparkles },
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
          <Flame className="size-6 text-gold" />
          {t('trendingPage.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('trendingPage.subtitle')}</p>
      </motion.div>

      {/* Filter buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {filterButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <Button
                key={btn.key}
                variant={filter === btn.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(btn.key)}
                className={`shrink-0 ${
                  filter === btn.key
                    ? 'bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20'
                    : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/30'
                }`}
              >
                <Icon className="size-3.5 mr-1.5" />
                {btn.label}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="coins" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/30">
          <TabsTrigger
            value="coins"
            className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold"
          >
            <Coins className="size-3.5 mr-1.5" />
            {t('trendingPage.coins')}
          </TabsTrigger>
          <TabsTrigger
            value="nfts"
            className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold"
          >
            <ImageIcon className="size-3.5 mr-1.5" />
            {t('trendingPage.nfts')}
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold"
          >
            <Tag className="size-3.5 mr-1.5" />
            {t('trendingPage.categories')}
          </TabsTrigger>
        </TabsList>

        {/* Coins Tab */}
        <TabsContent value="coins">
          <AnimatePresence mode="wait">
            {loading ? (
              <CoinSkeletonGrid />
            ) : filteredCoins.length > 0 ? (
              <motion.div
                key={filter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredCoins.slice(0, 12).map((coin, idx) => (
                  <CoinCard key={coin.coinId} coin={coin} index={idx} />
                ))}
              </motion.div>
            ) : (
              <Card className="bg-card border-border/50">
                <CardContent className="py-12 text-center">
                  <Coins className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                </CardContent>
              </Card>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* NFTs Tab */}
        <TabsContent value="nfts">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockNFTs.map((nft, idx) => (
              <NFTCard key={nft.name} nft={nft} index={idx} />
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockCategories.map((cat, idx) => (
              <CategoryCard key={cat.name} category={cat} index={idx} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
