'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PredictionEntry {
  id: string;
  coin: string;
  symbol: string;
  predicted: string;
  actual: string;
  accuracy: number;
  date: string;
  status: 'verified' | 'pending' | 'expired';
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PREDICTIONS: PredictionEntry[] = [
  { id: '1', coin: 'Bitcoin', symbol: 'BTC', predicted: '+8.5%', actual: '+8.2%', accuracy: 96, date: '2026-03-01', status: 'verified' },
  { id: '2', coin: 'Ethereum', symbol: 'ETH', predicted: '+5.2%', actual: '+4.8%', accuracy: 92, date: '2026-02-28', status: 'verified' },
  { id: '3', coin: 'Solana', symbol: 'SOL', predicted: '+12.0%', actual: '+10.5%', accuracy: 87, date: '2026-02-27', status: 'verified' },
  { id: '4', coin: 'BNB', symbol: 'BNB', predicted: '+3.1%', actual: '+2.2%', accuracy: 71, date: '2026-02-26', status: 'verified' },
  { id: '5', coin: 'XRP', symbol: 'XRP', predicted: '-2.5%', actual: '-1.8%', accuracy: 72, date: '2026-02-25', status: 'verified' },
  { id: '6', coin: 'Cardano', symbol: 'ADA', predicted: '+6.0%', actual: '+5.5%', accuracy: 91, date: '2026-02-24', status: 'verified' },
  { id: '7', coin: 'Avalanche', symbol: 'AVAX', predicted: '+9.0%', actual: '+4.2%', accuracy: 47, date: '2026-02-23', status: 'verified' },
  { id: '8', coin: 'Dogecoin', symbol: 'DOGE', predicted: '+7.5%', actual: '+6.9%', accuracy: 92, date: '2026-02-22', status: 'pending' },
  { id: '9', coin: 'Polkadot', symbol: 'DOT', predicted: '-4.0%', actual: '-3.1%', accuracy: 78, date: '2026-02-21', status: 'pending' },
  { id: '10', coin: 'Chainlink', symbol: 'LINK', predicted: '+2.0%', actual: '+1.1%', accuracy: 55, date: '2026-02-20', status: 'expired' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccuracyBadgeColor(accuracy: number): string {
  if (accuracy >= 85) return 'bg-bullish/10 border-bullish/30 text-bullish';
  if (accuracy >= 70) return 'bg-gold/10 border-gold/30 text-gold';
  return 'bg-bearish/10 border-bearish/30 text-bearish';
}

function getAccuracyBarColor(accuracy: number): string {
  if (accuracy >= 85) return '#22c55e';
  if (accuracy >= 70) return '#d4a017';
  return '#ef4444';
}

function getStatusBadge(status: PredictionEntry['status'], t: (key: string) => string) {
  switch (status) {
    case 'verified':
      return (
        <Badge variant="outline" className="bg-bullish/10 border-bullish/30 text-bullish text-[10px] px-2">
          <CheckCircle2 className="size-2.5 mr-1" />
          {t('predictionAccuracy.verified')}
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-gold/10 border-gold/30 text-gold text-[10px] px-2">
          <Clock className="size-2.5 mr-1" />
          {t('predictionAccuracy.pending')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className="bg-bearish/10 border-bearish/30 text-bearish text-[10px] px-2">
          <AlertTriangle className="size-2.5 mr-1" />
          {t('predictionAccuracy.expired')}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PredictionAccuracySection() {
  const { t } = useI18n();
  const [timeframe, setTimeframe] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter predictions based on timeframe
  const filteredPredictions = useMemo(() => {
    const now = new Date();
    return MOCK_PREDICTIONS.filter((p) => {
      const predDate = new Date(p.date);
      const diffDays = Math.floor((now.getTime() - predDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (timeframe) {
        case '7d': return diffDays <= 7;
        case '30d': return diffDays <= 30;
        case '90d': return diffDays <= 90;
        default: return true;
      }
    });
  }, [timeframe]);

  // Compute stats from filtered data
  const stats = useMemo(() => {
    if (filteredPredictions.length === 0) {
      return { avgAccuracy: 0, bestPrediction: '—', totalTracked: 0 };
    }
    const avgAccuracy = filteredPredictions.reduce((sum, p) => sum + p.accuracy, 0) / filteredPredictions.length;
    const best = filteredPredictions.reduce((a, b) => (a.accuracy > b.accuracy ? a : b));
    return {
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      bestPrediction: `${best.symbol} ${best.actual}`,
      totalTracked: filteredPredictions.length,
    };
  }, [filteredPredictions]);

  // Compute breakdown categories
  const breakdown = useMemo(() => {
    const excellent = filteredPredictions.filter((p) => p.accuracy >= 95).length;
    const good = filteredPredictions.filter((p) => p.accuracy >= 85 && p.accuracy < 95).length;
    const needsImprovement = filteredPredictions.filter((p) => p.accuracy < 85).length;
    const total = filteredPredictions.length || 1;
    return [
      { label: t('predictionAccuracy.excellent'), count: excellent, percent: Math.round((excellent / total) * 100), color: '#22c55e' },
      { label: t('predictionAccuracy.good'), count: good, percent: Math.round((good / total) * 100), color: '#d4a017' },
      { label: t('predictionAccuracy.needsImprovement'), count: needsImprovement, percent: Math.round((needsImprovement / total) * 100), color: '#ef4444' },
    ];
  }, [filteredPredictions, t]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Target className="size-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('predictionAccuracy.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('predictionAccuracy.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe filter */}
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[160px] border-border/50 text-sm text-muted-foreground hover:border-gold/40">
              <Clock className="size-3.5 mr-1 text-gold" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="all">{t('predictionAccuracy.allTime')}</SelectItem>
              <SelectItem value="7d">{t('predictionAccuracy.last7Days')}</SelectItem>
              <SelectItem value="30d">{t('predictionAccuracy.last30Days')}</SelectItem>
              <SelectItem value="90d">{t('predictionAccuracy.last90Days')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/40"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('predictionAccuracy.refresh')}
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Average Accuracy */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border/50 hover:border-border transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Target className="size-4 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {t('predictionAccuracy.averageAccuracy')}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.avgAccuracy}%</p>
              <div className="mt-2">
                <div className="relative">
                  <Progress value={stats.avgAccuracy} className="h-2 bg-white/5" />
                  <div
                    className="absolute top-0 left-0 h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.avgAccuracy}%`,
                      backgroundColor: stats.avgAccuracy >= 85 ? '#22c55e' : stats.avgAccuracy >= 70 ? '#d4a017' : '#ef4444',
                      boxShadow: `0 0 8px ${stats.avgAccuracy >= 85 ? '#22c55e' : stats.avgAccuracy >= 70 ? '#d4a017' : '#ef4444'}40`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Best Prediction */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border/50 hover:border-border transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-lg bg-bullish/10 flex items-center justify-center">
                  <TrendingUp className="size-4 text-bullish" />
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {t('predictionAccuracy.bestPrediction')}
                </span>
              </div>
              <p className="text-2xl font-bold text-bullish">{stats.bestPrediction}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('predictionAccuracy.highestAccuracy')}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Tracked */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border/50 hover:border-border transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <BarChart3 className="size-4 text-gold" />
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {t('predictionAccuracy.totalTracked')}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalTracked}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('predictionAccuracy.predictionsCounted')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Accuracy Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <BarChart3 className="size-4 text-gold" />
              {t('predictionAccuracy.accuracyBreakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-4">
            {breakdown.map((category, index) => (
              <motion.div
                key={category.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + index * 0.1, ease: 'easeOut' }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium">{category.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{category.count} {t('predictionAccuracy.predictions')}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2"
                      style={{
                        backgroundColor: `${category.color}15`,
                        borderColor: `${category.color}40`,
                        color: category.color,
                      }}
                    >
                      {category.percent}%
                    </Badge>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={category.percent} className="h-3 bg-white/5" />
                  <div
                    className="absolute top-0 left-0 h-3 rounded-full transition-all duration-700"
                    style={{
                      width: `${category.percent}%`,
                      backgroundColor: category.color,
                      boxShadow: `0 0 10px ${category.color}40`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Prediction History Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Clock className="size-4 text-gold" />
              {t('predictionAccuracy.predictionHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-gold text-xs font-semibold">{t('predictionAccuracy.coin')}</TableHead>
                    <TableHead className="text-gold text-xs font-semibold">{t('predictionAccuracy.predicted')}</TableHead>
                    <TableHead className="text-gold text-xs font-semibold">{t('predictionAccuracy.actual')}</TableHead>
                    <TableHead className="text-gold text-xs font-semibold">{t('predictionAccuracy.accuracy')}</TableHead>
                    <TableHead className="text-gold text-xs font-semibold">{t('predictionAccuracy.date')}</TableHead>
                    <TableHead className="text-gold text-xs font-semibold">{t('predictionAccuracy.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredPredictions.map((entry, index) => {
                      const isPositivePredicted = entry.predicted.startsWith('+');
                      const isPositiveActual = entry.actual.startsWith('+');
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
                          className="border-border/20 hover:bg-accent/30 transition-colors"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="size-6 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] text-gold font-bold">
                                  {entry.symbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{entry.coin}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{entry.symbol}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={`text-sm font-medium flex items-center gap-1 ${isPositivePredicted ? 'text-bullish' : 'text-bearish'}`}>
                              {isPositivePredicted ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                              {entry.predicted}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={`text-sm font-medium flex items-center gap-1 ${isPositiveActual ? 'text-bullish' : 'text-bearish'}`}>
                              {isPositiveActual ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                              {entry.actual}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant="outline" className={`text-xs px-2.5 font-semibold ${getAccuracyBadgeColor(entry.accuracy)}`}>
                              {entry.accuracy}%
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            {getStatusBadge(entry.status, t)}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>

              {filteredPredictions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-14 rounded-full bg-gold/5 flex items-center justify-center mb-3">
                    <Target className="size-6 text-gold/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('predictionAccuracy.noPredictions')}</p>
                </div>
              )}
            </div>

            {/* Table footer summary */}
            {filteredPredictions.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-4 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-bullish" />
                    <span className="text-muted-foreground">{t('predictionAccuracy.verified')}:</span>
                    <span className="font-semibold text-bullish">
                      {filteredPredictions.filter((p) => p.status === 'verified').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-gold" />
                    <span className="text-muted-foreground">{t('predictionAccuracy.pending')}:</span>
                    <span className="font-semibold text-gold">
                      {filteredPredictions.filter((p) => p.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-bearish" />
                    <span className="text-muted-foreground">{t('predictionAccuracy.expired')}:</span>
                    <span className="font-semibold text-bearish">
                      {filteredPredictions.filter((p) => p.status === 'expired').length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-1 justify-center"
      >
        <AlertTriangle className="size-2.5 text-gold/40" />
        <span className="text-[10px] text-muted-foreground/50">
          {t('predictionAccuracy.disclaimer')}
        </span>
      </motion.div>
    </section>
  );
}
