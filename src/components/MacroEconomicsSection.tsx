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
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Gauge,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
// Correlation data
// ---------------------------------------------------------------------------

const correlations = [
  { pair: 'corrDxyBtc', value: -0.67, icon: DollarSign },
  { pair: 'corrGoldBtc', value: 0.42, icon: TrendingUp },
  { pair: 'corrSp500Btc', value: 0.58, icon: BarChart3 },
  { pair: 'corrVixBtc', value: -0.73, icon: ShieldAlert },
  { pair: 'corrFedRateBtc', value: -0.51, icon: Landmark },
  { pair: 'corrCpiBtc', value: 0.35, icon: Percent },
] as const;

// ---------------------------------------------------------------------------
// Risk data
// ---------------------------------------------------------------------------

const riskScore = 62;
const riskTrend: 'improving' | 'stable' | 'deteriorating' = 'stable';

const riskBreakdown = [
  { key: 'riskEquity', value: 55, color: 'bg-amber-500' },
  { key: 'riskCredit', value: 40, color: 'bg-emerald-500' },
  { key: 'riskLiquidity', value: 35, color: 'bg-sky-500' },
  { key: 'riskVolatility', value: 70, color: 'bg-rose-500' },
] as const;

// ---------------------------------------------------------------------------
// Calendar data
// ---------------------------------------------------------------------------

type Importance = 'high' | 'medium' | 'low';

interface CalendarEvent {
  daysFromNow: number;
  event: string;
  country: string;
  countryCode: string;
  importance: Importance;
  forecast: string;
  previous: string;
}

const calendarEvents: CalendarEvent[] = [
  { daysFromNow: 1, event: 'FOMC Rate Decision', country: 'United States', countryCode: 'US', importance: 'high', forecast: '5.25%', previous: '5.25%' },
  { daysFromNow: 3, event: 'CPI Release (YoY)', country: 'United States', countryCode: 'US', importance: 'high', forecast: '3.2%', previous: '3.4%' },
  { daysFromNow: 5, event: 'Non-Farm Payrolls', country: 'United States', countryCode: 'US', importance: 'high', forecast: '180K', previous: '216K' },
  { daysFromNow: 2, event: 'GDP Growth Rate (QoQ)', country: 'United States', countryCode: 'US', importance: 'high', forecast: '2.0%', previous: '1.6%' },
  { daysFromNow: 7, event: 'ECB Rate Decision', country: 'Eurozone', countryCode: 'EU', importance: 'high', forecast: '4.00%', previous: '4.00%' },
  { daysFromNow: 4, event: 'PPI Release (MoM)', country: 'United States', countryCode: 'US', importance: 'medium', forecast: '0.2%', previous: '0.1%' },
  { daysFromNow: 6, event: 'Retail Sales (MoM)', country: 'United States', countryCode: 'US', importance: 'medium', forecast: '0.3%', previous: '0.6%' },
  { daysFromNow: 8, event: 'Unemployment Claims', country: 'United States', countryCode: 'US', importance: 'medium', forecast: '215K', previous: '210K' },
  { daysFromNow: 10, event: 'PMI Manufacturing', country: 'China', countryCode: 'CN', importance: 'medium', forecast: '50.5', previous: '50.4' },
  { daysFromNow: 12, event: 'Consumer Confidence', country: 'United States', countryCode: 'US', importance: 'low', forecast: '98.0', previous: '97.0' },
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
// Correlation Card
// ---------------------------------------------------------------------------

function CorrelationCard({
  corr,
  index,
  t,
}: {
  corr: (typeof correlations)[0];
  index: number;
  t: (key: string) => string;
}) {
  const Icon = corr.icon;
  const absValue = Math.abs(corr.value);
  const isPositive = corr.value >= 0;

  const getStrengthLabel = () => {
    if (absValue >= 0.6) return isPositive ? t('macro.correlationPositive') : t('macro.correlationNegative');
    if (absValue >= 0.3) return t('macro.correlationWeak');
    return t('macro.correlationWeak');
  };

  const barColor = isPositive ? 'bg-emerald-500' : 'bg-rose-500';
  const textColor = isPositive ? 'text-emerald-500' : 'text-rose-500';
  const bgColor = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card className="bg-card border-border/50 hover:border-gold/20 transition-colors duration-200 h-full">
        <CardContent className="py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`size-9 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
              <Icon className={`size-4 ${textColor}`} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {t(`macro.${corr.pair}`)}
              </div>
              <div className="text-[10px] text-muted-foreground">{getStrengthLabel()}</div>
            </div>
            <div className={`ml-auto text-xl font-bold font-mono ${textColor} shrink-0`}>
              {corr.value >= 0 ? '+' : ''}{corr.value.toFixed(2)}
            </div>
          </div>

          {/* Correlation bar */}
          <div className="mb-3">
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden relative">
              <div className="absolute inset-0 flex">
                {/* Negative side */}
                <div className="w-1/2 flex justify-end">
                  {corr.value < 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${absValue * 100}%` }}
                      transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
                      className={`h-full rounded-l-full ${barColor}`}
                    />
                  )}
                </div>
                {/* Center divider */}
                <div className="w-px bg-border shrink-0" />
                {/* Positive side */}
                <div className="w-1/2 flex justify-start">
                  {corr.value >= 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${absValue * 100}%` }}
                      transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
                      className={`h-full rounded-r-full ${barColor}`}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/50 font-mono">
              <span>-1.0</span>
              <span>0</span>
              <span>+1.0</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(`macro.${corr.pair}Desc`)}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Risk Gauge
// ---------------------------------------------------------------------------

function RiskGauge({ score, t }: { score: number; t: (key: string) => string }) {
  const getLabel = () => {
    if (score >= 80) return t('macro.riskVeryHigh');
    if (score >= 60) return t('macro.riskHigh');
    if (score >= 40) return t('macro.riskModerate');
    if (score >= 20) return t('macro.riskLow');
    return t('macro.riskVeryLow');
  };

  const getColor = () => {
    if (score >= 80) return 'text-rose-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-gold';
    if (score >= 20) return 'text-emerald-500';
    return 'text-sky-500';
  };

  const getStrokeColor = () => {
    if (score >= 80) return '#f43f5e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#d4a843';
    if (score >= 20) return '#10b981';
    return '#0ea5e9';
  };

  // SVG gauge: semicircle from left to right
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;
  const strokeColor = getStrokeColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="200" height="110" viewBox="0 0 200 110">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            className="text-muted/30"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`text-3xl font-bold font-mono ${getColor()}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <div className={`mt-2 text-sm font-semibold ${getColor()}`}>{getLabel()}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Bar
// ---------------------------------------------------------------------------

function RiskBar({
  item,
  index,
  t,
}: {
  item: (typeof riskBreakdown)[0];
  index: number;
  t: (key: string) => string;
}) {
  const getColor = () => {
    if (item.value >= 70) return 'bg-rose-500';
    if (item.value >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getIndicatorColor = () => {
    if (item.value >= 70) return 'text-rose-500';
    if (item.value >= 50) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">{t(`macro.${item.key}`)}</span>
        <span className={`text-sm font-bold font-mono ${getIndicatorColor()}`}>{item.value}/100</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.value}%` }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
          className={`h-full rounded-full ${getColor()}`}
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Calendar Row
// ---------------------------------------------------------------------------

function CalendarRow({
  event,
  index,
  t,
}: {
  event: CalendarEvent;
  index: number;
  t: (key: string) => string;
}) {
  const getRelativeDate = () => {
    if (event.daysFromNow === 0) return t('macro.today');
    if (event.daysFromNow === 1) return t('macro.tomorrow');
    return t('macro.inDays').replace('{n}', String(event.daysFromNow));
  };

  const importanceConfig: Record<Importance, { label: string; className: string }> = {
    high: {
      label: t('macro.importanceHigh'),
      className: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    },
    medium: {
      label: t('macro.importanceMedium'),
      className: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    },
    low: {
      label: t('macro.importanceLow'),
      className: 'bg-muted/30 text-muted-foreground border-border/50',
    },
  };

  const imp = importanceConfig[event.importance];

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
    >
      <td className="py-3 px-3">
        <div className="text-xs text-muted-foreground whitespace-nowrap">{getRelativeDate()}</div>
      </td>
      <td className="py-3 px-3">
        <div className="text-sm font-medium text-foreground">{event.event}</div>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1.5">
          <Flag className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{event.country}</span>
        </div>
      </td>
      <td className="py-3 px-3">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${imp.className}`}>
          {imp.label}
        </Badge>
      </td>
      <td className="py-3 px-3">
        <span className="text-xs font-mono text-foreground">{event.forecast}</span>
      </td>
      <td className="py-3 px-3">
        <span className="text-xs font-mono text-muted-foreground">{event.previous}</span>
      </td>
    </motion.tr>
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header card */}
            <Card className="bg-card border-border/50 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <BarChart3 className="size-4 text-gold" />
                  {t('macro.correlationTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground">{t('macro.correlationSubtitle')}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Correlation grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {correlations.map((corr, idx) => (
              <CorrelationCard key={corr.pair} corr={corr} index={idx} t={t} />
            ))}
          </div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <Card className="bg-card border-border/50">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-emerald-500" />
                    <span>{t('macro.correlationPositive')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-rose-500" />
                    <span>{t('macro.correlationNegative')}</span>
                  </div>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{t('macro.correlationWeak')}: |r| &lt; 0.3</span>
                  <span>•</span>
                  <span>{t('macro.correlationPositive')}/Negative: |r| ≥ 0.3</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Risk Sentiment Tab */}
        <TabsContent value="risk">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Gauge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Gauge className="size-4 text-gold" />
                    {t('macro.riskScore')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex flex-col items-center py-4">
                    <RiskGauge score={riskScore} t={t} />
                  </div>
                  {/* Trend indicator */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">{t('macro.riskTrend')}:</span>
                    <div className="flex items-center gap-1">
                      {riskTrend === 'improving' && (
                        <>
                          <ArrowUpRight className="size-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-500">{t('macro.riskImproving')}</span>
                        </>
                      )}
                      {riskTrend === 'stable' && (
                        <>
                          <ArrowRight className="size-3.5 text-amber-500" />
                          <span className="text-xs font-medium text-amber-500">{t('macro.riskStable')}</span>
                        </>
                      )}
                      {riskTrend === 'deteriorating' && (
                        <>
                          <ArrowDownRight className="size-3.5 text-rose-500" />
                          <span className="text-xs font-medium text-rose-500">{t('macro.riskDeteriorating')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Risk Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <Card className="bg-card border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <AlertTriangle className="size-4 text-gold" />
                    {t('macro.riskBreakdown')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="space-y-5">
                    {riskBreakdown.map((item, idx) => (
                      <RiskBar key={item.key} item={item} index={idx} t={t} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Risk Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card className="bg-card border-border/50">
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="size-4 text-gold" />
                  <span className="text-sm font-semibold text-foreground">{t('macro.riskSummary')}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('macro.riskSummaryText')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header card */}
            <Card className="bg-card border-border/50 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="size-4 text-gold" />
                  {t('macro.calendarTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground">{t('macro.calendarSubtitle')}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Events table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Card className="bg-card border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="py-3 px-3 text-left text-xs font-medium text-muted-foreground">{t('macro.calDate')}</th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-muted-foreground">{t('macro.calEvent')}</th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-muted-foreground">{t('macro.calCountry')}</th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-muted-foreground">{t('macro.calImportance')}</th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-muted-foreground">{t('macro.calForecast')}</th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-muted-foreground">{t('macro.calPrevious')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarEvents.map((event, idx) => (
                        <CalendarRow key={idx} event={event} index={idx} t={t} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Importance legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Card className="bg-card border-border/50">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/70">{t('macro.calImportance')}:</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-500/15 text-rose-500 border-rose-500/30">
                      {t('macro.importanceHigh')}
                    </Badge>
                    <span>— {t('macro.importanceHigh')} impact</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-500 border-amber-500/30">
                      {t('macro.importanceMedium')}
                    </Badge>
                    <span>— {t('macro.importanceMedium')} impact</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/30 text-muted-foreground border-border/50">
                      {t('macro.importanceLow')}
                    </Badge>
                    <span>— {t('macro.importanceLow')} impact</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
