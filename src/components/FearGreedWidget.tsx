'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FearGreedData {
  value: number;
  label: string;
  updatedAt: string;
  history: Array<{
    value: number;
    label: string;
    recordedAt: string;
  }>;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await fetch('/api/fear-greed');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

// ---------------------------------------------------------------------------
// Gauge Helpers
// ---------------------------------------------------------------------------

function getGaugeColor(value: number): string {
  if (value <= 25) return '#ef4444'; // Extreme Fear – red
  if (value <= 45) return '#f97316'; // Fear – orange
  if (value <= 55) return '#eab308'; // Neutral – yellow
  if (value <= 75) return '#84cc16'; // Greed – light green
  return '#22c55e'; // Extreme Greed – green
}

function getGaugeLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}

function getGlowColor(value: number): string {
  if (value <= 25) return 'rgba(239, 68, 68, 0.25)';
  if (value <= 45) return 'rgba(249, 115, 22, 0.2)';
  if (value <= 55) return 'rgba(234, 179, 8, 0.2)';
  if (value <= 75) return 'rgba(132, 204, 22, 0.2)';
  return 'rgba(34, 197, 94, 0.25)';
}

// ---------------------------------------------------------------------------
// Semi-circular Gauge SVG
// ---------------------------------------------------------------------------

function GaugeChart({ value }: { value: number }) {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const startAngle = Math.PI; // 180° (left)
  const endAngle = 0; // 0° (right)

  // Needle angle: 0 -> PI (left), 100 -> 0 (right)
  const needleAngle = Math.PI - (value / 100) * Math.PI;
  const needleLength = radius - 10;
  const needleX = center + needleLength * Math.cos(needleAngle);
  const needleY = center - needleLength * Math.sin(needleAngle);

  // Arc background segments for gradient effect
  const gradientStops = [
    { offset: '0%', color: '#ef4444' },
    { offset: '25%', color: '#f97316' },
    { offset: '50%', color: '#eab308' },
    { offset: '75%', color: '#84cc16' },
    { offset: '100%', color: '#22c55e' },
  ];

  // Background arc
  const bgArcStart = { x: center + radius * Math.cos(startAngle), y: center - radius * Math.sin(startAngle) };
  const bgArcEnd = { x: center + radius * Math.cos(endAngle), y: center - radius * Math.sin(endAngle) };

  // Active arc (up to value)
  const valueAngle = startAngle - (value / 100) * Math.PI;
  const activeArcEnd = {
    x: center + radius * Math.cos(valueAngle),
    y: center - radius * Math.sin(valueAngle),
  };

  const arcLargeFlag = value > 50 ? 1 : 0;

  const color = getGaugeColor(value);
  const glowColor = getGlowColor(value);

  return (
    <svg
      width={size}
      height={size / 2 + 20}
      viewBox={`0 0 ${size} ${size / 2 + 20}`}
      className="mx-auto"
      role="img"
      aria-label={`Fear & Greed Index gauge showing ${value}`}
    >
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {gradientStops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <filter id="needleGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="arcGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background arc (full semi-circle) */}
      <path
        d={`M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 0 1 ${bgArcEnd.x} ${bgArcEnd.y}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Gradient track (subtle) */}
      <path
        d={`M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 0 1 ${bgArcEnd.x} ${bgArcEnd.y}`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.15}
      />

      {/* Active value arc */}
      {value > 0 && (
        <>
          {/* Glow layer */}
          <path
            d={`M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 ${arcLargeFlag} 1 ${activeArcEnd.x} ${activeArcEnd.y}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            opacity={0.2}
            filter="url(#arcGlow)"
          />
          {/* Solid layer */}
          <path
            d={`M ${bgArcStart.x} ${bgArcStart.y} A ${radius} ${radius} 0 ${arcLargeFlag} 1 ${activeArcEnd.x} ${activeArcEnd.y}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </>
      )}

      {/* Tick marks */}
      {Array.from({ length: 11 }).map((_, i) => {
        const tickAngle = Math.PI - (i / 10) * Math.PI;
        const innerR = radius - strokeWidth / 2 - 4;
        const outerR = radius + strokeWidth / 2 + 4;
        const x1 = center + innerR * Math.cos(tickAngle);
        const y1 = center - innerR * Math.sin(tickAngle);
        const x2 = center + outerR * Math.cos(tickAngle);
        const y2 = center - outerR * Math.sin(tickAngle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
          />
        );
      })}

      {/* Needle */}
      <line
        x1={center}
        y1={center}
        x2={needleX}
        y2={needleY}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        filter="url(#needleGlow)"
      />

      {/* Needle center dot */}
      <circle cx={center} cy={center} r={5} fill={color} />
      <circle cx={center} cy={center} r={2.5} fill="#0a0a0f" />

      {/* Value text */}
      <text
        x={center}
        y={center + 28}
        textAnchor="middle"
        fill={color}
        fontSize="32"
        fontWeight="bold"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        {value}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function GaugeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Skeleton className="h-[120px] w-[200px] rounded-full" />
      <Skeleton className="h-8 w-16 rounded" />
      <Skeleton className="h-4 w-24 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FearGreedWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: fetchFearGreed,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const value = data?.value ?? 50;
  const label = data?.label ?? getGaugeLabel(value);
  const color = getGaugeColor(value);
  const glowColor = getGlowColor(value);

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Activity className="size-4 text-gold" />
          Fear &amp; Greed Index
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading && <GaugeSkeleton />}

        {isError && !data && (
          <div className="text-center py-8">
            <p className="text-bearish text-xs">Failed to load data</p>
          </div>
        )}

        {!isLoading && data && (
          <div className="flex flex-col items-center">
            {/* Gauge */}
            <div
              className="relative"
              style={{
                filter: `drop-shadow(0 0 20px ${glowColor})`,
              }}
            >
              <GaugeChart value={value} />
            </div>

            {/* Label */}
            <span
              className="text-sm font-semibold mt-1 tracking-wide uppercase"
              style={{ color }}
            >
              {label}
            </span>

            {/* Updated time */}
            {data.updatedAt && (
              <span className="text-[10px] text-muted-foreground mt-1">
                Updated{' '}
                {new Date(data.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
