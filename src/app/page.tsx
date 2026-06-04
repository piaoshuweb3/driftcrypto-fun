'use client';

import { useState, useEffect } from 'react';
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
import TechnicalAnalysisSection from '@/components/TechnicalAnalysisSection';
import SentimentSection from '@/components/SentimentSection';
import CorrelationsSection from '@/components/CorrelationsSection';
import MacroEconomicsSection from '@/components/MacroEconomicsSection';
import TrendingPageSection from '@/components/TrendingPageSection';
import PredictionsSection from '@/components/PredictionsSection';
import Footer from '@/components/Footer';
import { useI18n } from '@/lib/i18n';

export type SectionId =
  | 'dashboard'
  | 'market'
  | 'portfolio'
  | 'screener'
  | 'ai-chat'
  | 'nft'
  | 'ai-analysis'
  | 'technical-analysis'
  | 'sentiment'
  | 'enhanced-predictions'
  | 'market-analysis'
  | 'macro-economics'
  | 'correlations'
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
        {activeSection === 'ai-analysis' && <AIAnalysisSection onSectionChange={setActiveSection} />}
        {activeSection === 'technical-analysis' && <TechnicalAnalysisSection />}
        {activeSection === 'sentiment' && <SentimentSection />}
        {activeSection === 'enhanced-predictions' && <PredictionsSection />}
        {activeSection === 'market-analysis' && <AIAnalysisSection onSectionChange={setActiveSection} />}
        {activeSection === 'macro-economics' && <MacroEconomicsSection />}
        {activeSection === 'correlations' && <CorrelationsSection />}
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
    'dashboard', 'market', 'portfolio', 'screener', 'ai-chat', 'nft',
    'ai-analysis', 'technical-analysis', 'sentiment', 'enhanced-predictions',
    'market-analysis', 'macro-economics', 'correlations', 'trending',
    'prediction-accuracy', 'batch-analysis',
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

function MarketSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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

// ---------------------------------------------------------------------------
// Simple placeholder sections for less common features
// ---------------------------------------------------------------------------

function PredictionAccuracySection() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('predictionAccuracy.title')}</h1>
      <p className="text-muted-foreground mb-8">{t('predictionAccuracy.subtitle')}</p>
      <div className="text-center py-16 rounded-xl border border-border bg-card">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-muted-foreground">{t('predictionAccuracy.noPredictions')}</p>
        <div className="flex justify-center gap-4 mt-6">
          <span className="px-3 py-1.5 rounded-full text-xs bg-bullish/10 text-bullish border border-bullish/20">{t('predictionAccuracy.excellent')}</span>
          <span className="px-3 py-1.5 rounded-full text-xs bg-gold/10 text-gold border border-gold/20">{t('predictionAccuracy.good')}</span>
          <span className="px-3 py-1.5 rounded-full text-xs bg-bearish/10 text-bearish border border-bearish/20">{t('predictionAccuracy.needsImprovement')}</span>
        </div>
      </div>
    </div>
  );
}

function BatchAnalysisSection() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('batchAnalysis.title')}</h1>
      <p className="text-muted-foreground mb-8">{t('batchAnalysis.subtitle')}</p>
      <div className="text-center py-16 rounded-xl border border-border bg-card">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-muted-foreground">{t('batchAnalysis.noResults')}</p>
      </div>
    </div>
  );
}

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
