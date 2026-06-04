import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import TrendingStrip from '@/components/TrendingStrip';
import NewsFeed from '@/components/NewsFeed';
import MarketTable from '@/components/MarketTable';
import FearGreedWidget from '@/components/FearGreedWidget';
import AIDigestSection from '@/components/AIDigestSection';
import AIChatSection from '@/components/AIChatSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background grid-pattern">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrendingStrip />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
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
      </main>
      <Footer />
    </div>
  );
}
