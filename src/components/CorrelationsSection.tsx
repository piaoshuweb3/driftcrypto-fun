'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Grid3X3,
  Clock,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const assets = ['BTC', 'ETH', 'SOL', 'DXY', 'Gold', 'VIX', 'S&P500'];

const correlationMatrix: number[][] = [
  [1.00, 0.85, 0.78, -0.32, 0.15, -0.45, 0.55],
  [0.85, 1.00, 0.82, -0.28, 0.12, -0.40, 0.50],
  [0.78, 0.82, 1.00, -0.25, 0.08, -0.35, 0.42],
  [-0.32, -0.28, -0.25, 1.00, -0.15, 0.65, -0.55],
  [0.15, 0.12, 0.08, -0.15, 1.00, -0.20, 0.30],
  [-0.45, -0.40, -0.35, 0.65, -0.20, 1.00, -0.68],
  [0.55, 0.50, 0.42, -0.55, 0.30, -0.68, 1.00],
];

// Slightly vary data per timeframe for realism
function getMatrixForTimeframe(tf: string): number[][] {
  const factor = tf === '7d' ? 1.0 : tf === '30d' ? 0.95 : 0.88;
  return correlationMatrix.map((row) =>
    row.map((v) => {
      if (Math.abs(v) < 0.01) return 0;
      const adjusted = v * factor + (Math.random() - 0.5) * 0.05;
      return Math.round(Math.max(-1, Math.min(1, adjusted)) * 100) / 100;
    })
  );
}

// ---------------------------------------------------------------------------
// Heatmap cell helpers
// ---------------------------------------------------------------------------

function getCorrelationColor(value: number): string {
  if (Math.abs(value) < 0.05) return 'rgba(255,255,255,0.04)';
  if (value > 0) {
    const intensity = Math.min(value, 1);
    const r = Math.round(34 + (1 - intensity) * 20);
    const g = Math.round(197 - (1 - intensity) * 60);
    const b = Math.round(94 - (1 - intensity) * 30);
    return `rgba(${r},${g},${b},${0.3 + intensity * 0.5})`;
  }
  const intensity = Math.min(Math.abs(value), 1);
  const r = Math.round(239 - (1 - intensity) * 20);
  const g = Math.round(68 + (1 - intensity) * 40);
  const b = Math.round(68 + (1 - intensity) * 30);
  return `rgba(${r},${g},${b},${0.3 + intensity * 0.5})`;
}

function getCorrelationTextColor(value: number): string {
  if (Math.abs(value) < 0.05) return '#737373';
  return value > 0 ? '#22c55e' : '#ef4444';
}

// ---------------------------------------------------------------------------
// Heatmap Cell
// ---------------------------------------------------------------------------

function HeatmapCell({ value, row, col }: { value: number; row: number; col: number }) {
  const isDiagonal = row === col;
  const bgColor = isDiagonal ? 'rgba(245,158,11,0.15)' : getCorrelationColor(value);
  const textColor = isDiagonal ? '#f59e0b' : getCorrelationTextColor(value);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (row * 7 + col) * 0.015, duration: 0.3 }}
            className="flex items-center justify-center rounded-md aspect-square text-xs font-mono font-semibold cursor-default transition-transform hover:scale-110"
            style={{
              backgroundColor: bgColor,
              color: textColor,
            }}
          >
            {value.toFixed(2)}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-popover border-border text-foreground text-xs"
        >
          <span>
            {assets[row]} ↔ {assets[col]}: {value.toFixed(2)}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CorrelationsSection() {
  const { t } = useI18n();
  const [timeframe, setTimeframe] = useState('7d');
  const [matrix, setMatrix] = useState<number[][]>(correlationMatrix);

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    setMatrix(getMatrixForTimeframe(tf));
  };

  const timeframes = [
    { value: '7d', label: `7 ${t('correlations.days')}` },
    { value: '30d', label: `30 ${t('correlations.days')}` },
    { value: '90d', label: `90 ${t('correlations.days')}` },
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
          <Grid3X3 className="size-6 text-gold" />
          {t('correlations.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('correlations.subtitle')}</p>
      </motion.div>

      {/* Timeframe selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-card border-border/50">
          <CardContent className="py-4 flex items-center gap-3 flex-wrap">
            <Clock className="size-4 text-gold shrink-0" />
            <span className="text-sm text-muted-foreground">{t('correlations.timeframe')}:</span>
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={timeframe === tf.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeframeChange(tf.value)}
                  className={
                    timeframe === tf.value
                      ? 'bg-gold hover:bg-gold/90 text-primary-foreground shadow-md shadow-gold/20'
                      : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/30'
                  }
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Correlation Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Grid3X3 className="size-4 text-gold" />
              {t('correlations.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                {/* Column headers */}
                <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
                  <div />
                  {assets.map((asset) => (
                    <div
                      key={asset}
                      className="flex items-center justify-center text-[11px] font-semibold text-gold py-1"
                    >
                      {asset}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {matrix.map((row, rowIdx) => (
                  <div
                    key={assets[rowIdx]}
                    className="grid gap-1 mb-1"
                    style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}
                  >
                    {/* Row label */}
                    <div className="flex items-center justify-end pr-2 text-[11px] font-semibold text-gold">
                      {assets[rowIdx]}
                    </div>
                    {/* Cells */}
                    {row.map((value, colIdx) => (
                      <HeatmapCell
                        key={`${rowIdx}-${colIdx}`}
                        value={value}
                        row={rowIdx}
                        col={colIdx}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Color legend */}
            <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-bearish/60" />
                Negative Correlation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-white/5" />
                No Correlation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-bullish/60" />
                Positive Correlation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-gold/25" />
                Self (1.00)
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Understanding section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Info className="size-4 text-gold" />
              {t('correlations.understanding')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('correlations.understandingDesc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="p-3 rounded-lg bg-bearish/5 border border-bearish/10">
                <div className="text-xs font-semibold text-bearish mb-1">-1.0</div>
                <div className="text-[11px] text-muted-foreground">
                  Perfect negative: assets move in opposite directions
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-border/30">
                <div className="text-xs font-semibold text-neutral mb-1">0.0</div>
                <div className="text-[11px] text-muted-foreground">
                  No correlation: assets move independently
                </div>
              </div>
              <div className="p-3 rounded-lg bg-bullish/5 border border-bullish/10">
                <div className="text-xs font-semibold text-bullish mb-1">+1.0</div>
                <div className="text-[11px] text-muted-foreground">
                  Perfect positive: assets move in the same direction
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
