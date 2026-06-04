'use client';

import { motion } from 'framer-motion';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  Calendar,
  DollarSign,
  ShieldAlert,
  Landmark,
  Percent,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Mock indicator data
// ---------------------------------------------------------------------------

const indicators = [
  { name: 'DXY', value: '104.32', change: '+0.15%', positive: true, key: 'dxy', icon: DollarSign },
  { name: 'CPI', value: '3.4%', change: '-0.1%', positive: true, key: 'cpi', icon: Percent },
  { name: 'Gold', value: '$2,345', change: '+0.82%', positive: true, key: 'gold', icon: TrendingUp },
  { name: 'S&P 500', value: '5,234', change: '+0.45%', positive: true, key: 'sp500', icon: BarChart3 },
  { name: 'VIX', value: '14.5', change: '-2.3%', positive: true, key: 'vix', icon: ShieldAlert },
  { name: 'Fed Rate', value: '5.25%', change: '0%', positive: true, key: 'fedRate', icon: Landmark },
  { name: '10Y Treasury', value: '4.35%', change: '+0.05%', positive: false, key: 'treasury10y', icon: Clock },
];

// ---------------------------------------------------------------------------
// Indicator Card
// ---------------------------------------------------------------------------

function IndicatorCard({
  indicator,
  index,
  t,
}: {
  indicator: (typeof indicators)[0];
  index: number;
  t: (key: string) => string;
}) {
  const Icon = indicator.icon;
  const isPositive = indicator.positive;
  const changeIsZero = indicator.change === '0%';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Card className="bg-card border-border/50 hover:border-gold/20 transition-colors duration-200 h-full">
        <CardContent className="py-5">
          <div className="flex items-start justify-between mb-3">
            <div className="size-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <Icon className="size-4 text-gold" />
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-1.5 ${
                changeIsZero
                  ? 'border-neutral/30 text-neutral'
                  : isPositive
                    ? 'border-bullish/30 text-bullish bg-bullish/5'
                    : 'border-bearish/30 text-bearish bg-bearish/5'
              }`}
            >
              {changeIsZero ? (
                <Minus className="size-2.5 mr-0.5" />
              ) : isPositive ? (
                <TrendingUp className="size-2.5 mr-0.5" />
              ) : (
                <TrendingDown className="size-2.5 mr-0.5" />
              )}
              {indicator.change}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mb-1">
            {t(`macro.${indicator.key}`)}
          </div>
          <div className="text-xl font-bold text-foreground">{indicator.value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Coming Soon Card
// ---------------------------------------------------------------------------

function ComingSoonCard({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Icon className="size-4 text-gold" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-16 rounded-full bg-gold/5 flex items-center justify-center mb-4">
            <Clock className="size-7 text-gold/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            Coming Soon
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            This feature is under development
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MacroEconomicsSection() {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe className="size-6 text-gold" />
          {t('macro.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('macro.subtitle')}</p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="indicators" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/30">
          <TabsTrigger
            value="indicators"
            className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold"
          >
            <Activity className="size-3.5 mr-1.5" />
            {t('macro.indicators')}
          </TabsTrigger>
          <TabsTrigger
            value="correlations"
            className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold"
          >
            <BarChart3 className="size-3.5 mr-1.5" />
            {t('macro.correlations')}
          </TabsTrigger>
          <TabsTrigger
            value="risk"
            className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold"
          >
            <ShieldAlert className="size-3.5 mr-1.5" />
            {t('macro.riskSentiment')}
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold"
          >
            <Calendar className="size-3.5 mr-1.5" />
            {t('macro.calendar')}
          </TabsTrigger>
        </TabsList>

        {/* Indicators Tab */}
        <TabsContent value="indicators">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {indicators.map((indicator, idx) => (
              <IndicatorCard key={indicator.key} indicator={indicator} index={idx} t={t} />
            ))}
          </div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card className="bg-card border-border/50">
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="size-4 text-gold" />
                  <span className="text-sm font-semibold text-foreground">Macro Summary</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The current macro environment shows a strong US Dollar (DXY above 104) with cooling
                  inflation (CPI trending down). The Fed maintains a hawkish stance at 5.25%, while
                  the VIX remains low at 14.5, indicating complacent equity markets. Gold continues
                  to rally, suggesting some safe-haven demand despite equity strength. The 10Y Treasury
                  yield uptick signals potential bond market stress.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations">
          <ComingSoonCard title={t('macro.correlations')} icon={BarChart3} />
        </TabsContent>

        {/* Risk Sentiment Tab */}
        <TabsContent value="risk">
          <ComingSoonCard title={t('macro.riskSentiment')} icon={ShieldAlert} />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <ComingSoonCard title={t('macro.calendar')} icon={Calendar} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
