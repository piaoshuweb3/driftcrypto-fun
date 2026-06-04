'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BarChart3,
  Newspaper,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FearGreedWidget from '@/components/FearGreedWidget';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockSentiment = {
  overall: 62,
  social: { bullish: 45, bearish: 25, neutral: 30 },
  news: { bullish: 38, bearish: 32, neutral: 30 },
  fearGreed: 55,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSentimentColor(value: number): string {
  if (value >= 60) return '#22c55e'; // bullish – green
  if (value <= 40) return '#ef4444'; // bearish – red
  return '#eab308'; // neutral – yellow
}

function getSentimentLabel(value: number, t: (key: string) => string): string {
  if (value >= 60) return t('sentiment.bullish');
  if (value <= 40) return t('sentiment.bearish');
  return t('sentiment.neutral');
}

// ---------------------------------------------------------------------------
// Circular Gauge
// ---------------------------------------------------------------------------

function CircularGauge({ value }: { value: number }) {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const color = getSentimentColor(value);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {value}
        </motion.span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          / 100
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sentiment Bar
// ---------------------------------------------------------------------------

function SentimentBar({
  label,
  bullish,
  bearish,
  neutral,
  t,
}: {
  label: string;
  bullish: number;
  bearish: number;
  neutral: number;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
      </div>
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
        <motion.div
          className="bg-bullish"
          initial={{ width: 0 }}
          animate={{ width: `${bullish}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="bg-neutral"
          initial={{ width: 0 }}
          animate={{ width: `${neutral}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
        <motion.div
          className="bg-bearish"
          initial={{ width: 0 }}
          animate={{ width: `${bearish}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1">
          <TrendingUp className="size-3 text-bullish" />
          <span className="text-bullish">{bullish}% {t('sentiment.bullish')}</span>
        </span>
        <span className="flex items-center gap-1">
          <Minus className="size-3 text-neutral" />
          <span className="text-neutral">{neutral}% {t('sentiment.neutral')}</span>
        </span>
        <span className="flex items-center gap-1">
          <TrendingDown className="size-3 text-bearish" />
          <span className="text-bearish">{bearish}% {t('sentiment.bearish')}</span>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SentimentSection() {
  const { t, locale } = useI18n();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const sentimentColor = getSentimentColor(mockSentiment.overall);
  const sentimentLabel = getSentimentLabel(mockSentiment.overall, t);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Perform a comprehensive crypto market sentiment analysis. Consider social media trends, news sentiment, fear & greed index (currently ${mockSentiment.fearGreed}), on-chain metrics, and overall market direction. Provide actionable insights.`,
          history: [],
          locale,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setAnalysisResult(data.message || 'Analysis complete.');
    } catch {
      setAnalysisResult(
        locale === 'zh'
          ? '分析暂时不可用，请稍后重试。'
          : 'Analysis temporarily unavailable. Please try again later.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="size-6 text-gold" />
          {t('sentiment.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('sentiment.subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Sentiment Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Activity className="size-4 text-gold" />
                {t('sentiment.overallSentiment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6 flex flex-col items-center gap-3">
              <CircularGauge value={mockSentiment.overall} />
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: sentimentColor }}
              >
                {sentimentLabel}
              </span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fear & Greed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Activity className="size-4 text-gold" />
                {t('sentiment.fearGreed')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <FearGreedWidget />
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Sentiment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <BarChart3 className="size-4 text-gold" />
                {t('sentiment.socialSentiment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <SentimentBar
                label="Twitter / X"
                bullish={mockSentiment.social.bullish}
                bearish={mockSentiment.social.bearish}
                neutral={mockSentiment.social.neutral}
                t={t}
              />
              <div className="mt-4">
                <SentimentBar
                  label="Reddit"
                  bullish={42}
                  bearish={28}
                  neutral={30}
                  t={t}
                />
              </div>
              <div className="mt-4">
                <SentimentBar
                  label="Telegram"
                  bullish={50}
                  bearish={20}
                  neutral={30}
                  t={t}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* News Sentiment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Newspaper className="size-4 text-gold" />
                {t('sentiment.newsSentiment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <SentimentBar
                label="Crypto News"
                bullish={mockSentiment.news.bullish}
                bearish={mockSentiment.news.bearish}
                neutral={mockSentiment.news.neutral}
                t={t}
              />
              <div className="mt-4">
                <SentimentBar
                  label="Mainstream Media"
                  bullish={35}
                  bearish={30}
                  neutral={35}
                  t={t}
                />
              </div>
              <div className="mt-4">
                <SentimentBar
                  label="Press Releases"
                  bullish={55}
                  bearish={15}
                  neutral={30}
                  t={t}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analyze Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card className="bg-card border-border/50">
          <CardContent className="py-6 flex flex-col items-center gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="lg"
              className="bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20 transition-all duration-200 disabled:opacity-50 px-8"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>{t('sentiment.analyze')}</span>
                </>
              )}
            </Button>

            {/* Analysis Result */}
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-2 p-4 rounded-xl bg-background/50 border border-border/50 text-sm text-foreground leading-relaxed whitespace-pre-wrap"
              >
                {analysisResult}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
