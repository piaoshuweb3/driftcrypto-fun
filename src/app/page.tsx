'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import TrendingStrip from '@/components/TrendingStrip';
import NewsFeed from '@/components/NewsFeed';
import MarketTable from '@/components/MarketTable';
import FearGreedWidget from '@/components/FearGreedWidget';
import AIDigestSection from '@/components/AIDigestSection';
import AIChatSection from '@/components/AIChatSection';
import PortfolioSection from '@/components/PortfolioSection';
import ScreenerSection from '@/components/ScreenerSection';
import NFTSection from '@/components/NFTSection';
import AIAnalysisSection from '@/components/AIAnalysisSection';
import MarketAnalysisSection from '@/components/MarketAnalysisSection';
import TechnicalAnalysisSection from '@/components/TechnicalAnalysisSection';
import SentimentSection from '@/components/SentimentSection';
import CorrelationsSection from '@/components/CorrelationsSection';
import MacroEconomicsSection from '@/components/MacroEconomicsSection';
import TrendingPageSection from '@/components/TrendingPageSection';
import PredictionsSection from '@/components/PredictionsSection';
import MicrostructureSection from '@/components/MicrostructureSection';
import PredictionAccuracySection from '@/components/PredictionAccuracySection';
import BatchAnalysisSection from '@/components/BatchAnalysisSection';
import PiaoShuAnalysisSection from '@/components/PiaoShuAnalysisSection';
import Footer from '@/components/Footer';
import { useI18n } from '@/lib/i18n';

export type SectionId =
  | 'dashboard'
  | 'market'
  | 'portfolio'
  | 'screener'
  | 'ai-chat'
  | 'nft'
  | 'piao-shu'
  | 'ai-analysis'
  | 'technical-analysis'
  | 'sentiment'
  | 'enhanced-predictions'
  | 'market-analysis'
  | 'macro-economics'
  | 'correlations'
  | 'microstructure'
  | 'trending'
  | 'prediction-accuracy'
  | 'batch-analysis';

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const { mounted } = useI18n();

  // Handle hash-based navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as SectionId;
      if (hash && isValidSection(hash)) {
        setActiveSection(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Don't render until i18n is mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-background grid-pattern">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background grid-pattern">
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 pt-16">
        {activeSection === 'dashboard' && <DashboardSection onSectionChange={setActiveSection} />}
        {activeSection === 'market' && <MarketSection />}
        {activeSection === 'portfolio' && <PortfolioSection />}
        {activeSection === 'screener' && <ScreenerSection />}
        {activeSection === 'ai-chat' && <AIChatFullSection />}
        {activeSection === 'nft' && <NFTSection />}
        {activeSection === 'piao-shu' && <PiaoShuAnalysisSection />}
        {activeSection === 'ai-analysis' && <AIAnalysisSection onSectionChange={setActiveSection} />}
        {activeSection === 'technical-analysis' && <TechnicalAnalysisSection />}
        {activeSection === 'sentiment' && <SentimentSection />}
        {activeSection === 'enhanced-predictions' && <PredictionsSection />}
        {activeSection === 'market-analysis' && <MarketAnalysisSection />}
        {activeSection === 'macro-economics' && <MacroEconomicsSection />}
        {activeSection === 'correlations' && <CorrelationsSection />}
        {activeSection === 'microstructure' && <MicrostructureSection />}
        {activeSection === 'trending' && <TrendingPageSection />}
        {activeSection === 'prediction-accuracy' && <PredictionAccuracySection />}
        {activeSection === 'batch-analysis' && <BatchAnalysisSection />}
      </main>
      <Footer />
    </div>
  );
}

function isValidSection(id: string): id is SectionId {
  const validSections: SectionId[] = [
    'dashboard', 'market', 'portfolio', 'screener', 'ai-chat', 'nft', 'piao-shu',
    'ai-analysis', 'technical-analysis', 'sentiment', 'enhanced-predictions',
    'market-analysis', 'macro-economics', 'correlations', 'microstructure',
    'trending', 'prediction-accuracy', 'batch-analysis',
  ];
  return validSections.includes(id as SectionId);
}

// ---------------------------------------------------------------------------
// Dashboard Section (default home)
// ---------------------------------------------------------------------------

function DashboardSection({ onSectionChange }: { onSectionChange: (s: SectionId) => void }) {
  const { t } = useI18n();

  const quickLinks = [
    { key: 'marketAnalysis', icon: '📊', section: 'market-analysis' as SectionId, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/20' },
    { key: 'predictions', icon: '🔮', section: 'enhanced-predictions' as SectionId, color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/20' },
    { key: 'technical', icon: '📈', section: 'technical-analysis' as SectionId, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20' },
    { key: 'sentiment', icon: '💚', section: 'sentiment' as SectionId, color: 'from-green-500/20 to-emerald-500/20 border-green-500/20' },
    { key: 'aiChat', icon: '🤖', section: 'ai-chat' as SectionId, color: 'from-gold/20 to-yellow-500/20 border-gold/20' },
    { key: 'portfolio', icon: '💼', section: 'portfolio' as SectionId, color: 'from-rose-500/20 to-pink-500/20 border-rose-500/20' },
  ];

  return (
    <>
      <HeroSection />
      <TrendingStrip />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Quick Link Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <button
              key={link.key}
              onClick={() => onSectionChange(link.section)}
              className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${link.color} border hover:scale-[1.03] transition-all duration-200 cursor-pointer`}
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs font-medium text-foreground">{t(`quickLinks.${link.key}`)}</span>
            </button>
          ))}
        </div>

        {/* Market Stats + Fear & Greed + AI Digest */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <MarketTable />
          </div>
          <div className="space-y-6">
            <FearGreedWidget />
            <AIDigestSection />
          </div>
        </div>
        {/* AI Chat */}
        <AIChatSection />
        {/* News Feed */}
        <NewsFeed />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Market Section (enhanced)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Global market data helpers (shared with HeroSection pattern)
// ---------------------------------------------------------------------------

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

  const coins = Array.isArray(data?.coins) ? data.coins : [];
  const btcCoin = coins.find((c) => c.coinId === 'bitcoin');
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

// ---------------------------------------------------------------------------
// Market Section (enhanced with global stats bar)
// ---------------------------------------------------------------------------

function MarketSection() {
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['global-market-data'],
    queryFn: fetchGlobalData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const marketCapChange = data?.marketCapChange24h ?? 0;
  const isMarketTrendingUp = marketCapChange >= 0;

  const stats = data
    ? [
        {
          title: t('hero.totalMarketCap'),
          value: formatLargeNumber(data.totalMarketCap),
          icon: TrendingUp,
          iconBg: 'bg-bullish/10',
          iconColor: 'text-bullish',
          trend: isMarketTrendingUp ? 'up' as const : 'down' as const,
          trendValue: marketCapChange,
          showTrend: true,
        },
        {
          title: t('hero.marketCapChange24h'),
          value: `${marketCapChange >= 0 ? '+' : ''}${marketCapChange.toFixed(2)}%`,
          icon: Percent,
          iconBg: marketCapChange >= 0 ? 'bg-bullish/10' : 'bg-bearish/10',
          iconColor: marketCapChange >= 0 ? 'text-bullish' : 'text-bearish',
          trend: marketCapChange >= 0 ? 'up' as const : 'down' as const,
          trendValue: marketCapChange,
          showTrend: false,
        },
        {
          title: t('hero.volume24h'),
          value: formatLargeNumber(data.totalVolume),
          icon: BarChart3,
          iconBg: 'bg-gold/10',
          iconColor: 'text-gold',
          trend: 'up' as const,
          trendValue: 0,
          showTrend: false,
        },
        {
          title: t('hero.btcDominance'),
          value: `${data.btcDominance.toFixed(1)}%`,
          icon: PieChart,
          iconBg: 'bg-chart-3/10',
          iconColor: 'text-chart-3',
          trend: 'up' as const,
          trendValue: 0,
          showTrend: false,
        },
        {
          title: t('hero.activeCryptos'),
          value: data.activeCryptos.toLocaleString(),
          icon: Activity,
          iconBg: 'bg-sky-500/10',
          iconColor: 'text-sky-500',
          trend: 'up' as const,
          trendValue: 0,
          showTrend: false,
        },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Global Market Stats Bar */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-card border-border/50 hover:border-gold/20 transition-colors duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.title}</span>
                    <div className={`size-7 rounded-md ${stat.iconBg} flex items-center justify-center`}>
                      <Icon className={`size-3.5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{stat.value}</span>
                    {stat.showTrend && (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold ${
                        stat.trend === 'up' ? 'text-bullish' : 'text-bearish'
                      }`}>
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                        {Math.abs(stat.trendValue).toFixed(2)}%
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* TradingView Chart */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4">
          <TradingViewWidget />
        </div>
      </div>
      <MarketTable />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Chat Full Page
// ---------------------------------------------------------------------------

function AIChatFullSection() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AIChatSection />
    </div>
  );
}

// PredictionAccuracySection and BatchAnalysisSection are now imported from their own component files

// ---------------------------------------------------------------------------
// TradingView Widget
// ---------------------------------------------------------------------------

function TradingViewWidget() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT'];

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      const w = window as Record<string, unknown>;
      if (w.TradingView) {
        new (w.TradingView as Record<string, unknown>).widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#12121a',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_chart',
          hide_side_toolbar: false,
          studies: ['MASimple@tv-basicstudies', 'Volume@tv-basicstudies'],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
      if (existing) existing.remove();
    };
  }, [symbol]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {pairs.map((pair) => (
          <button
            key={pair}
            onClick={() => setSymbol(pair)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              symbol === pair
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-white/5 text-muted-foreground border border-transparent hover:bg-white/10 hover:text-foreground'
            }`}
          >
            {pair.replace('USDT', '/USDT')}
          </button>
        ))}
      </div>
      <div id="tradingview_chart" className="w-full h-[500px] rounded-lg overflow-hidden" />
    </div>
  );
}
