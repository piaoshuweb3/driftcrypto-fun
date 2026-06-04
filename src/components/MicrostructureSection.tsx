'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Microscope,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  AlertTriangle,
  HeartPulse,
  ChevronRight,
  Layers,
  ArrowRightLeft,
  Droplets,
  Zap,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
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

interface DepthLevel {
  price: number;
  buyQty: number;
  sellQty: number;
}

interface MicrostructureData {
  symbol: string;
  name: string;
  coinId: string;
  price: number;
  imageUrl: string | null;
  spreadDollar: number;
  spreadPct: number;
  buyPct: number;
  sellPct: number;
  imbalanceLabel: 'buyDominant' | 'sellDominant' | 'balanced';
  liquidityScore: number;
  liquidityLabel: 'veryLow' | 'low' | 'medium' | 'high';
  volume24h: number;
  marketCap: number;
  volMcapRatio: number;
  volumeProfile: string;
  change24h: number | null;
  depthLevels: DepthLevel[];
  liquiditySparkline: number[];
  spreadBreakdown: { label: string; value: number; pct: number }[];
  orderFlow: { time: string; buyVol: number; sellVol: number; net: number }[];
}

type SortOption = 'liquidity' | 'spread' | 'volume' | 'mcap';

// ---------------------------------------------------------------------------
// Deterministic hash for consistent mock data per symbol
// ---------------------------------------------------------------------------

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ---------------------------------------------------------------------------
// Volume profile descriptions
// ---------------------------------------------------------------------------

const VOLUME_PROFILES = [
  'Concentrated at current levels',
  'Distributed across price range',
  'High volume at support',
  'High volume at resistance',
  'Evenly distributed',
  'Clustered near VWAP',
  'Thin above current price',
  'Thin below current price',
  'Ascending volume profile',
  'Descending volume profile',
  'POC near current price',
  'Volume void above',
  'Volume void below',
  'Strong buying pressure at lows',
  'Strong selling pressure at highs',
  'Balanced bell curve shape',
  'Left-skewed distribution',
  'Right-skewed distribution',
  'High activity at open/close',
  'Low activity mid-range',
];

// ---------------------------------------------------------------------------
// Generate mock microstructure data
// ---------------------------------------------------------------------------

function generateMicrostructure(
  symbol: string,
  name: string,
  coinId: string,
  price: number,
  volume: number,
  marketCap: number,
  imageUrl: string | null,
  change24h: number | null,
): MicrostructureData {
  const seed = hashCode(symbol.toUpperCase());
  const rng = seededRandom(seed);

  // Spread
  const mcapB = (marketCap ?? 0) / 1e9;
  const spreadBase = mcapB > 100 ? 0.01 : mcapB > 10 ? 0.05 : mcapB > 1 ? 0.2 : 0.5;
  const spreadPct = spreadBase + rng() * Math.min(spreadBase * 3, 1.5);
  const spreadDollar = price * (spreadPct / 100);

  // Order book imbalance
  const buyPct = Math.round(30 + rng() * 40);
  const sellPct = 100 - buyPct;

  let imbalanceLabel: MicrostructureData['imbalanceLabel'];
  if (buyPct > 58) imbalanceLabel = 'buyDominant';
  else if (sellPct > 58) imbalanceLabel = 'sellDominant';
  else imbalanceLabel = 'balanced';

  // Liquidity score
  const liquidityBase = mcapB > 100 ? 75 : mcapB > 10 ? 55 : mcapB > 1 ? 35 : 15;
  const liquidityScore = Math.round(
    Math.max(0, Math.min(100, liquidityBase + (rng() - 0.3) * 30)),
  );

  let liquidityLabel: MicrostructureData['liquidityLabel'];
  if (liquidityScore < 25) liquidityLabel = 'veryLow';
  else if (liquidityScore < 50) liquidityLabel = 'low';
  else if (liquidityScore < 75) liquidityLabel = 'medium';
  else liquidityLabel = 'high';

  const volMcapRatio = marketCap > 0 ? ((volume ?? 0) / marketCap) * 100 : 0;
  const profileIdx = seed % VOLUME_PROFILES.length;

  // Generate depth levels (10 levels on each side)
  const depthLevels: DepthLevel[] = [];
  const step = price * (spreadPct / 100) * 0.5;
  for (let i = 0; i < 10; i++) {
    const distFromMid = i + 1;
    const buyDecay = Math.exp(-distFromMid * 0.3) * (0.6 + rng() * 0.8);
    const sellDecay = Math.exp(-distFromMid * 0.3) * (0.6 + rng() * 0.8);
    const baseQty = (volume ?? 1e6) / 1e4;
    depthLevels.push({
      price: price + step * distFromMid,
      buyQty: baseQty * buyDecay,
      sellQty: baseQty * sellDecay,
    });
  }

  // Generate liquidity sparkline (24 data points)
  const liquiditySparkline: number[] = [];
  let sparkVal = liquidityScore;
  for (let i = 0; i < 24; i++) {
    sparkVal = Math.max(0, Math.min(100, sparkVal + (rng() - 0.5) * 12));
    liquiditySparkline.push(Math.round(sparkVal));
  }

  // Spread breakdown
  const makerPct = Math.round(40 + rng() * 20);
  const takerPct = 100 - makerPct;
  const visiblePct = Math.round(30 + rng() * 30);
  const hiddenPct = 100 - visiblePct;
  const spreadBreakdown = [
    { label: 'Maker', value: spreadPct * (makerPct / 100), pct: makerPct },
    { label: 'Taker', value: spreadPct * (takerPct / 100), pct: takerPct },
    { label: 'Visible', value: spreadPct * (visiblePct / 100), pct: visiblePct },
    { label: 'Hidden', value: spreadPct * (hiddenPct / 100), pct: hiddenPct },
  ];

  // Order flow analysis (8 time windows)
  const orderFlow: MicrostructureData['orderFlow'] = [];
  const hours = ['04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
  for (let i = 0; i < 8; i++) {
    const bv = Math.round(30 + rng() * 70);
    const sv = Math.round(30 + rng() * 70);
    orderFlow.push({
      time: hours[i],
      buyVol: bv,
      sellVol: sv,
      net: bv - sv,
    });
  }

  return {
    symbol: symbol.toUpperCase(),
    name,
    coinId,
    price,
    imageUrl,
    spreadDollar,
    spreadPct,
    buyPct,
    sellPct,
    imbalanceLabel,
    liquidityScore,
    liquidityLabel,
    volume24h: volume ?? 0,
    marketCap: marketCap ?? 0,
    volMcapRatio,
    volumeProfile: VOLUME_PROFILES[profileIdx],
    change24h,
    depthLevels,
    liquiditySparkline,
    spreadBreakdown,
    orderFlow,
  };
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function getLiquidityColor(label: MicrostructureData['liquidityLabel']): string {
  switch (label) {
    case 'veryLow': return 'text-red-500';
    case 'low': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-bullish';
  }
}

function getLiquidityBgColor(label: MicrostructureData['liquidityLabel']): string {
  switch (label) {
    case 'veryLow': return 'bg-red-500';
    case 'low': return 'bg-orange-400';
    case 'medium': return 'bg-yellow-400';
    case 'high': return 'bg-bullish';
  }
}

function getLiquidityBorderBadge(label: MicrostructureData['liquidityLabel']): string {
  switch (label) {
    case 'veryLow': return 'border-red-500/30 text-red-500 bg-red-500/5';
    case 'low': return 'border-orange-400/30 text-orange-400 bg-orange-400/5';
    case 'medium': return 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5';
    case 'high': return 'border-bullish/30 text-bullish bg-bullish/5';
  }
}

function getImbalanceBadgeStyle(label: MicrostructureData['imbalanceLabel']): string {
  switch (label) {
    case 'buyDominant': return 'border-bullish/30 text-bullish bg-bullish/5';
    case 'sellDominant': return 'border-bearish/30 text-bearish bg-bearish/5';
    case 'balanced': return 'border-neutral/30 text-neutral bg-neutral/5';
  }
}

// ---------------------------------------------------------------------------
// Animated Number component
// ---------------------------------------------------------------------------

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

// ---------------------------------------------------------------------------
// Mini Sparkline (for liquidity score inline)
// ---------------------------------------------------------------------------

function MiniSparkline({
  data,
  color,
  width = 48,
  height = 16,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Depth Chart (SVG mountain/histogram) for coin card
// ---------------------------------------------------------------------------

function DepthChartMini({ data, price }: { data: DepthLevel[]; price: number }) {
  const width = 280;
  const height = 60;
  const padding = 4;

  if (data.length === 0) return null;

  const maxBuy = Math.max(...data.map((d) => d.buyQty), 1);
  const maxSell = Math.max(...data.map((d) => d.sellQty), 1);
  const maxQty = Math.max(maxBuy, maxSell);

  const halfW = (width - padding * 2) / 2;
  const barW = halfW / data.length;

  // Build buy side (left, from center outward)
  const buyBars = data.map((d, i) => {
    const barH = (d.buyQty / maxQty) * (height - padding * 2);
    const x = padding + halfW - (i + 1) * barW;
    const y = height - padding - barH;
    return { x, y, w: Math.max(barW - 1, 1), h: barH };
  });

  // Build sell side (right, from center outward)
  const sellBars = data.map((d, i) => {
    const barH = (d.sellQty / maxQty) * (height - padding * 2);
    const x = padding + halfW + i * barW;
    const y = height - padding - barH;
    return { x, y, w: Math.max(barW - 1, 1), h: barH };
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Buy side (green, left) */}
      {buyBars.map((b, i) => (
        <rect
          key={`b${i}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="#22c55e"
          opacity={0.6 - i * 0.04}
          rx={1}
        />
      ))}
      {/* Sell side (red, right) */}
      {sellBars.map((b, i) => (
        <rect
          key={`s${i}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="#ef4444"
          opacity={0.6 - i * 0.04}
          rx={1}
        />
      ))}
      {/* Center line (current price) */}
      <line
        x1={padding + halfW}
        y1={padding}
        x2={padding + halfW}
        y2={height - padding}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
        strokeDasharray="2,2"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Large Depth Chart (for detail drawer)
// ---------------------------------------------------------------------------

function DepthChartLarge({ data, price }: { data: DepthLevel[]; price: number }) {
  const width = 500;
  const height = 200;
  const paddingX = 30;
  const paddingY = 20;

  if (data.length === 0) return null;

  const maxBuy = Math.max(...data.map((d) => d.buyQty), 1);
  const maxSell = Math.max(...data.map((d) => d.sellQty), 1);
  const maxQty = Math.max(maxBuy, maxSell);

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;
  const halfW = chartW / 2;
  const barW = halfW / data.length;

  // Build smooth buy side polygon
  const buyPoints: string[] = [];
  buyPoints.push(`${paddingX},${height - paddingY}`); // bottom-left
  for (let i = 0; i < data.length; i++) {
    const x = paddingX + halfW - (i + 1) * barW + barW / 2;
    const y = height - paddingY - (data[i].buyQty / maxQty) * chartH;
    buyPoints.push(`${x},${y}`);
  }
  buyPoints.push(`${paddingX + halfW},${height - paddingY}`); // bottom-center

  // Build smooth sell side polygon
  const sellPoints: string[] = [];
  sellPoints.push(`${paddingX + halfW},${height - paddingY}`); // bottom-center
  for (let i = 0; i < data.length; i++) {
    const x = paddingX + halfW + i * barW + barW / 2;
    const y = height - paddingY - (data[i].sellQty / maxQty) * chartH;
    sellPoints.push(`${x},${y}`);
  }
  sellPoints.push(`${paddingX + chartW},${height - paddingY}`); // bottom-right

  // Price labels
  const midX = paddingX + halfW;
  const step = price * 0.002;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((pct) => (
        <line
          key={pct}
          x1={paddingX}
          y1={height - paddingY - chartH * pct}
          x2={width - paddingX}
          y2={height - paddingY - chartH * pct}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Buy side mountain */}
      <polygon
        points={buyPoints.join(' ')}
        fill="url(#buyGrad)"
        stroke="#22c55e"
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Sell side mountain */}
      <polygon
        points={sellPoints.join(' ')}
        fill="url(#sellGrad)"
        stroke="#ef4444"
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Center line (mid price) */}
      <line
        x1={midX}
        y1={paddingY}
        x2={midX}
        y2={height - paddingY}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
        strokeDasharray="4,4"
      />

      {/* Price label center */}
      <text
        x={midX}
        y={height - 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize={9}
        fontFamily="monospace"
      >
        {formatPrice(price)}
      </text>

      {/* Buy side label */}
      <text
        x={paddingX + halfW * 0.3}
        y={paddingY + 10}
        textAnchor="middle"
        fill="#22c55e"
        fontSize={10}
        fontWeight="bold"
      >
        BID
      </text>

      {/* Sell side label */}
      <text
        x={paddingX + halfW + halfW * 0.7}
        y={paddingY + 10}
        textAnchor="middle"
        fill="#ef4444"
        fontSize={10}
        fontWeight="bold"
      >
        ASK
      </text>

      {/* Gradients */}
      <defs>
        <linearGradient id="buyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="sellGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sparkline (larger, for detail drawer)
// ---------------------------------------------------------------------------

function SparklineChart({
  data,
  color,
  height = 60,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const width = 400;
  const padding = 8;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + chartH - ((v - min) / range) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  // Area fill
  const areaPoints = [
    `${padding},${padding + chartH}`,
    ...data.map((v, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + chartH - ((v - min) / range) * chartH;
      return `${x},${y}`;
    }),
    `${padding + chartW},${padding + chartH}`,
  ].join(' ');

  const gradId = `sparkGrad-${color.replace(/[^a-zA-Z]/g, '')}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      {data.length > 0 && (() => {
        const lastX = padding + chartW;
        const lastY = padding + chartH - ((data[data.length - 1] - min) / range) * chartH;
        return (
          <circle cx={lastX} cy={lastY} r={3} fill={color} />
        );
      })()}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Order Flow Bar (for detail drawer)
// ---------------------------------------------------------------------------

function OrderFlowChart({ data }: { data: MicrostructureData['orderFlow'] }) {
  const maxVol = Math.max(...data.map((d) => Math.max(d.buyVol, d.sellVol)), 1);

  return (
    <div className="space-y-1.5">
      {data.map((d, i) => {
        const buyW = (d.buyVol / maxVol) * 100;
        const sellW = (d.sellVol / maxVol) * 100;
        return (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="w-10 text-muted-foreground font-mono shrink-0">{d.time}</span>
            <div className="flex-1 flex items-center gap-1">
              {/* Buy bar (right-aligned) */}
              <div className="flex-1 flex justify-end">
                <div
                  className="h-3 rounded-l bg-bullish/60"
                  style={{ width: `${buyW}%` }}
                />
              </div>
              {/* Sell bar (left-aligned) */}
              <div className="flex-1">
                <div
                  className="h-3 rounded-r bg-bearish/60"
                  style={{ width: `${sellW}%` }}
                />
              </div>
            </div>
            <span
              className={`w-10 text-right font-mono shrink-0 ${
                d.net >= 0 ? 'text-bullish' : 'text-bearish'
              }`}
            >
              {d.net >= 0 ? '+' : ''}{d.net}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Market Health Indicator
// ---------------------------------------------------------------------------

function MarketHealthBadge({
  avgLiquidity,
  avgSpread,
  t,
}: {
  avgLiquidity: number;
  avgSpread: number;
  t: (key: string) => string;
}) {
  // Determine health: Healthy (high liq, low spread), Caution, Stressed
  let health: 'healthy' | 'caution' | 'stressed';
  if (avgLiquidity >= 55 && avgSpread < 0.5) {
    health = 'healthy';
  } else if (avgLiquidity >= 35 && avgSpread < 1.5) {
    health = 'caution';
  } else {
    health = 'stressed';
  }

  const config = {
    healthy: {
      label: t('microstructure.healthyLabel'),
      icon: <HeartPulse className="size-3.5" />,
      className: 'border-bullish/30 text-bullish bg-bullish/10',
      pulseColor: 'bg-bullish',
    },
    caution: {
      label: t('microstructure.cautionLabel'),
      icon: <AlertTriangle className="size-3.5" />,
      className: 'border-yellow-400/30 text-yellow-400 bg-yellow-400/10',
      pulseColor: 'bg-yellow-400',
    },
    stressed: {
      label: t('microstructure.stressedLabel'),
      icon: <AlertTriangle className="size-3.5" />,
      className: 'border-bearish/30 text-bearish bg-bearish/10',
      pulseColor: 'bg-bearish',
    },
  };

  const c = config[health];

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-muted-foreground">{t('microstructure.marketHealth')}:</span>
      <Badge variant="outline" className={`text-xs px-2.5 py-1 gap-1.5 ${c.className}`}>
        <span className={`size-1.5 rounded-full ${c.pulseColor} animate-pulse`} />
        {c.icon}
        {c.label}
      </Badge>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coin Detail Drawer Content
// ---------------------------------------------------------------------------

function CoinDetailDrawer({
  data,
  open,
  onOpenChange,
  t,
}: {
  data: MicrostructureData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string) => string;
}) {
  if (!data) return null;

  const liquidityColor = getLiquidityColor(data.liquidityLabel);
  const liquidityBg = getLiquidityBgColor(data.liquidityLabel);
  const liquidityBadge = getLiquidityBorderBadge(data.liquidityLabel);
  const imbalanceBadge = getImbalanceBadgeStyle(data.imbalanceLabel);

  const imbalanceLabel = t(`microstructure.${data.imbalanceLabel}`);
  const liquidityLabel = t(`microstructure.${data.liquidityLabel}`);

  // Determine sparkline color based on trend
  const sparkTrend = data.liquiditySparkline.length > 1
    ? data.liquiditySparkline[data.liquiditySparkline.length - 1] - data.liquiditySparkline[0]
    : 0;
  const sparkColor = sparkTrend >= 0 ? '#22c55e' : '#ef4444';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-background border-border/50 w-full sm:max-w-lg md:max-w-xl overflow-y-auto"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2.5">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className="size-7 rounded-full" />
            ) : (
              <div className="size-7 rounded-full bg-gold/10 flex items-center justify-center">
                <span className="text-xs font-bold text-gold">{data.symbol.slice(0, 2)}</span>
              </div>
            )}
            <span>{data.name}</span>
            <span className="text-muted-foreground text-sm font-normal uppercase">
              {data.symbol}
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('microstructure.detailTitle')} - {data.name}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-8 space-y-6">
          {/* Price header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(data.price)}
              </div>
              {data.change24h !== null && (
                <span
                  className={`text-sm font-mono ${
                    data.change24h >= 0 ? 'text-bullish' : 'text-bearish'
                  }`}
                >
                  {data.change24h >= 0 ? '+' : ''}
                  <AnimatedNumber value={data.change24h} decimals={2} />%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] px-1.5 ${imbalanceBadge}`}>
                {data.imbalanceLabel === 'buyDominant' && <TrendingUp className="size-2.5 mr-0.5" />}
                {data.imbalanceLabel === 'sellDominant' && <TrendingDown className="size-2.5 mr-0.5" />}
                {imbalanceLabel}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 ${liquidityBadge}`}>
                {liquidityLabel}
              </Badge>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Order Book Depth (Large Chart) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-gold" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('microstructure.orderBookDepth')}
              </h3>
              <Badge variant="outline" className="text-[9px] px-1 ml-auto border-gold/20 text-gold">
                {data.depthLevels.length} {t('microstructure.depthLevels')}
              </Badge>
            </div>
            <Card className="bg-card/50 border-border/30">
              <CardContent className="p-3">
                <DepthChartLarge data={data.depthLevels} price={data.price} />
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span className="text-bullish/80">Buy Side (Bids)</span>
                  <span>{formatPrice(data.price)}</span>
                  <span className="text-bearish/80">Sell Side (Asks)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spread Analysis */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="size-3.5 text-gold" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('microstructure.spreadAnalysis')}
              </h3>
            </div>
            <Card className="bg-card/50 border-border/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t('microstructure.bidAskSpread')}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {data.spreadDollar < 0.01
                      ? '<$0.01'
                      : `$${data.spreadDollar.toFixed(data.spreadDollar < 1 ? 4 : 2)}`}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({data.spreadPct.toFixed(3)}%)
                    </span>
                  </span>
                </div>

                {/* Spread bar */}
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      data.spreadPct < 0.1
                        ? 'bg-bullish'
                        : data.spreadPct < 0.5
                          ? 'bg-yellow-400'
                          : 'bg-bearish'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((data.spreadPct / 2) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Spread breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {data.spreadBreakdown.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{item.label}</span>
                        <span className="text-[10px] font-mono text-foreground">
                          {item.pct}%
                        </span>
                      </div>
                      <Progress value={item.pct} className="h-1 bg-white/5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liquidity Analysis */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Droplets className="size-3.5 text-gold" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('microstructure.liquidityAnalysis')}
              </h3>
            </div>
            <Card className="bg-card/50 border-border/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t('microstructure.liquidityScore')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${liquidityColor}`}>
                      <AnimatedNumber value={data.liquidityScore} decimals={0} />
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 ${liquidityBadge}`}>
                      {liquidityLabel}
                    </Badge>
                  </div>
                </div>

                {/* Liquidity bar */}
                <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${liquidityBg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${data.liquidityScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Liquidity sparkline */}
                <div className="pt-1">
                  <span className="text-[10px] text-muted-foreground block mb-1">24h Trend</span>
                  <SparklineChart data={data.liquiditySparkline} color={sparkColor} height={50} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Flow Analysis */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-gold" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('microstructure.orderFlowAnalysis')}
              </h3>
            </div>
            <Card className="bg-card/50 border-border/30">
              <CardContent className="p-4 space-y-3">
                {/* Imbalance bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('microstructure.orderBookImbalance')}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 ${imbalanceBadge}`}>
                      {imbalanceLabel}
                    </Badge>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                    <motion.div
                      className="bg-bullish/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${data.buyPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="bg-bearish/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${data.sellPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-bullish font-mono">
                      {t('microstructure.buyPressure')} <AnimatedNumber value={data.buyPct} decimals={0} />%
                    </span>
                    <span className="text-bearish font-mono">
                      {t('microstructure.sellPressure')} <AnimatedNumber value={data.sellPct} decimals={0} />%
                    </span>
                  </div>
                </div>

                <Separator className="bg-border/20" />

                {/* Order flow bars */}
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-2">Intraday Flow</span>
                  <OrderFlowChart data={data.orderFlow} />
                </div>

                <Separator className="bg-border/20" />

                {/* Volume profile */}
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    {t('microstructure.volumeProfile')}
                  </span>
                  <span className="text-xs text-foreground">{data.volumeProfile}</span>
                </div>

                {/* Volume & Market Cap */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      {t('microstructure.volume24h')}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(data.volume24h)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      {t('microstructure.volMcapRatio')}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      <AnimatedNumber value={data.volMcapRatio} decimals={2} />%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Coin Card sub-component
// ---------------------------------------------------------------------------

function CoinMicrostructureCard({
  data,
  index,
  t,
  onClick,
}: {
  data: MicrostructureData;
  index: number;
  t: (key: string) => string;
  onClick: () => void;
}) {
  const liquidityColor = getLiquidityColor(data.liquidityLabel);
  const liquidityBg = getLiquidityBgColor(data.liquidityLabel);
  const liquidityBadge = getLiquidityBorderBadge(data.liquidityLabel);
  const imbalanceBadge = getImbalanceBadgeStyle(data.imbalanceLabel);

  const imbalanceLabel = t(`microstructure.${data.imbalanceLabel}`);
  const liquidityLabel = t(`microstructure.${data.liquidityLabel}`);

  // Determine sparkline color
  const sparkTrend = data.liquiditySparkline.length > 1
    ? data.liquiditySparkline[data.liquiditySparkline.length - 1] - data.liquiditySparkline[0]
    : 0;
  const sparkColor = sparkTrend >= 0 ? '#22c55e' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * Math.min(index, 10) + 0.15, duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        className="bg-card border-border/50 hover:border-gold/20 transition-all duration-200 h-full cursor-pointer group"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {data.imageUrl ? (
                <img
                  src={data.imageUrl}
                  alt={data.name}
                  className="size-8 rounded-full shrink-0"
                />
              ) : (
                <div className="size-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gold">
                    {data.symbol.slice(0, 2)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold text-foreground truncate">
                  {data.name}
                </CardTitle>
                <span className="text-[11px] text-muted-foreground uppercase">
                  {data.symbol}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-foreground">
                {formatPrice(data.price)}
              </div>
              {data.change24h !== null && (
                <span
                  className={`text-[11px] font-mono ${
                    data.change24h >= 0 ? 'text-bullish' : 'text-bearish'
                  }`}
                >
                  {data.change24h >= 0 ? '+' : ''}
                  <AnimatedNumber value={data.change24h} decimals={2} />%
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-5 space-y-4">
          {/* Order Book Depth Mini Chart */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Layers className="size-2.5" />
                {t('microstructure.orderBookDepth')}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {data.depthLevels.length} {t('microstructure.depthLevels')}
              </span>
            </div>
            <DepthChartMini data={data.depthLevels} price={data.price} />
          </div>

          {/* Bid-Ask Spread */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {t('microstructure.bidAskSpread')}
              </span>
              <span className="text-[11px] font-mono text-foreground">
                {data.spreadDollar < 0.01
                  ? `<$0.01`
                  : `$${data.spreadDollar.toFixed(data.spreadDollar < 1 ? 4 : 2)}`}
                <span className="text-muted-foreground ml-1">
                  ({data.spreadPct.toFixed(3)}%)
                </span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  data.spreadPct < 0.1
                    ? 'bg-bullish'
                    : data.spreadPct < 0.5
                      ? 'bg-yellow-400'
                      : 'bg-bearish'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((data.spreadPct / 2) * 100, 100)}%` }}
                transition={{ delay: 0.3 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Order Book Imbalance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {t('microstructure.orderBookImbalance')}
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 ${imbalanceBadge}`}>
                {data.imbalanceLabel === 'buyDominant' && (
                  <TrendingUp className="size-2.5 mr-0.5" />
                )}
                {data.imbalanceLabel === 'sellDominant' && (
                  <TrendingDown className="size-2.5 mr-0.5" />
                )}
                {imbalanceLabel}
              </Badge>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
              <motion.div
                className="bg-bullish/80"
                initial={{ width: 0 }}
                animate={{ width: `${data.buyPct}%` }}
                transition={{ delay: 0.35 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
              />
              <motion.div
                className="bg-bearish/80"
                initial={{ width: 0 }}
                animate={{ width: `${data.sellPct}%` }}
                transition={{ delay: 0.35 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-bullish font-mono">
                {t('microstructure.buyPressure')} {data.buyPct}%
              </span>
              <span className="text-bearish font-mono">
                {t('microstructure.sellPressure')} {data.sellPct}%
              </span>
            </div>
          </div>

          {/* Liquidity Score with Sparkline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {t('microstructure.liquidityScore')}
              </span>
              <div className="flex items-center gap-1.5">
                <MiniSparkline
                  data={data.liquiditySparkline}
                  color={sparkColor}
                  width={36}
                  height={12}
                />
                <span className={`text-xs font-bold ${liquidityColor}`}>
                  {data.liquidityScore}
                </span>
                <Badge variant="outline" className={`text-[10px] px-1.5 ${liquidityBadge}`}>
                  {liquidityLabel}
                </Badge>
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${liquidityBg}`}
                initial={{ width: 0 }}
                animate={{ width: `${data.liquidityScore}%` }}
                transition={{ delay: 0.4 + index * 0.03, duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Bottom Stats + Click hint */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-muted-foreground block">
                {t('microstructure.volume24h')}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {formatCurrency(data.volume24h)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">
                {t('microstructure.volMcapRatio')}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {data.volMcapRatio.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* View Detail hint */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground group-hover:text-gold transition-colors pt-1">
            <CircleDot className="size-2.5" />
            <span>View Details</span>
            <ChevronRight className="size-2.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MicrostructureSection() {
  const { t } = useI18n();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('mcap');
  const [selectedCoin, setSelectedCoin] = useState<MicrostructureData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch prices from API
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices');
        if (!res.ok) throw new Error('Failed to fetch prices');
        const data = await res.json();
        setCoins((data.coins ?? []).slice(0, 20));
      } catch {
        setCoins([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, []);

  // Generate microstructure data for each coin
  const microstructureData = useMemo<MicrostructureData[]>(() => {
    return coins.map((coin) =>
      generateMicrostructure(
        coin.symbol,
        coin.name,
        coin.coinId,
        coin.usdPrice,
        coin.volume24h ?? 0,
        coin.marketCap ?? 0,
        coin.imageUrl,
        coin.change24h,
      ),
    );
  }, [coins]);

  // Sort data
  const sortedData = useMemo<MicrostructureData[]>(() => {
    const sorted = [...microstructureData];
    switch (sortBy) {
      case 'liquidity':
        sorted.sort((a, b) => b.liquidityScore - a.liquidityScore);
        break;
      case 'spread':
        sorted.sort((a, b) => a.spreadPct - b.spreadPct);
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'mcap':
      default:
        sorted.sort((a, b) => b.marketCap - a.marketCap);
        break;
    }
    return sorted;
  }, [microstructureData, sortBy]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (microstructureData.length === 0) {
      return { total: 0, avgLiquidity: 0, avgSpread: 0, highLiquidityCount: 0 };
    }
    const total = microstructureData.length;
    const avgLiquidity = Math.round(
      microstructureData.reduce((sum, d) => sum + d.liquidityScore, 0) / total,
    );
    const avgSpread =
      microstructureData.reduce((sum, d) => sum + d.spreadPct, 0) / total;
    const highLiquidityCount = microstructureData.filter(
      (d) => d.liquidityScore >= 75,
    ).length;
    return { total, avgLiquidity, avgSpread, highLiquidityCount };
  }, [microstructureData]);

  // Handle card click
  const handleCardClick = useCallback((data: MicrostructureData) => {
    setSelectedCoin(data);
    setDrawerOpen(true);
  }, []);

  // Sort options
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'mcap', label: t('microstructure.sortMarketCap') },
    { value: 'liquidity', label: t('microstructure.sortLiquidity') },
    { value: 'spread', label: t('microstructure.sortSpread') },
    { value: 'volume', label: t('microstructure.sortVolume') },
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
          <Microscope className="size-6 text-gold" />
          {t('microstructure.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('microstructure.subtitle')}</p>
      </motion.div>

      {/* Summary Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <Card className="bg-card border-border/50">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="size-4 text-gold" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.totalCoins')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    <AnimatedNumber value={summaryStats.total} decimals={0} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-bullish/10 flex items-center justify-center shrink-0">
                  <Activity className="size-4 text-bullish" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.avgLiquidity')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    <AnimatedNumber value={summaryStats.avgLiquidity} decimals={0} />
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-4 text-yellow-400" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.avgSpread')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    <AnimatedNumber value={summaryStats.avgSpread} decimals={3} />%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-bullish/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="size-4 text-bullish" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('microstructure.highLiquidity')}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    <AnimatedNumber value={summaryStats.highLiquidityCount} decimals={0} />
                    <span className="text-xs text-muted-foreground">
                      {' '}{t('microstructure.coinsAnalyzed')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Health Indicator */}
            <div className="mt-4 pt-3 border-t border-border/30">
              <MarketHealthBadge
                avgLiquidity={summaryStats.avgLiquidity}
                avgSpread={summaryStats.avgSpread}
                t={t}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sort Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex items-center gap-3"
      >
        <span className="text-sm text-muted-foreground">{t('microstructure.sortBy')}:</span>
        <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
          <SelectTrigger className="w-[180px] bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedData.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Microscope className="size-10 text-gold/30" />
            <span className="text-sm text-muted-foreground">{t('common.noData')}</span>
          </div>
        </div>
      )}

      {/* Coin Cards Grid */}
      {!loading && sortedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedData.map((data, index) => (
            <CoinMicrostructureCard
              key={data.coinId}
              data={data}
              index={index}
              t={t}
              onClick={() => handleCardClick(data)}
            />
          ))}
        </div>
      )}

      {/* Coin Detail Drawer */}
      <CoinDetailDrawer
        data={selectedCoin}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        t={t}
      />
    </div>
  );
}
