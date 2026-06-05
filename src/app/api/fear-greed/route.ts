import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const FNG_API_URL = 'https://api.alternative.me/fng/?limit=10';

interface FnGApiResponse {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  }>;
}

async function fetchFromApi(): Promise<FnGApiResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(FNG_API_URL, {
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`Fear & Greed API returned status ${res.status}`);
      return null;
    }

    const data: FnGApiResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch Fear & Greed API:', error);
    return null;
  }
}

async function getCachedEntry() {
  const cached = await db.fearGreedIndex.findFirst({
    orderBy: { recordedAt: 'desc' },
  });

  if (!cached) return null;

  const age = Date.now() - cached.recordedAt.getTime();
  if (age < CACHE_DURATION_MS) {
    return cached;
  }

  return null;
}

async function getCachedHistory() {
  const history = await db.fearGreedIndex.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 10,
  });
  return history;
}

export async function GET() {
  try {
    // Check for fresh cached data
    const cached = await getCachedEntry();
    if (cached) {
      const history = await getCachedHistory();
      return NextResponse.json({
        value: cached.value,
        label: cached.label,
        updatedAt: cached.recordedAt.toISOString(),
        history: history.map((entry) => ({
          value: entry.value,
          label: entry.label,
          recordedAt: entry.recordedAt.toISOString(),
        })),
      });
    }

    // Fetch fresh data from API
    const apiData = await fetchFromApi();

    if (apiData && apiData.data && apiData.data.length > 0) {
      const latest = apiData.data[0];
      const value = parseInt(latest.value, 10);
      const label = latest.value_classification;

      // Save to database
      await db.fearGreedIndex.create({
        data: { value, label },
      });

      // Clean up old entries (keep only last 30)
      const allEntries = await db.fearGreedIndex.findMany({
        orderBy: { recordedAt: 'desc' },
      });

      if (allEntries.length > 30) {
        const idsToDelete = allEntries.slice(30).map((e) => e.id);
        await db.fearGreedIndex.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      const history = await getCachedHistory();

      return NextResponse.json({
        value,
        label,
        updatedAt: new Date().toISOString(),
        history: history.map((entry) => ({
          value: entry.value,
          label: entry.label,
          recordedAt: entry.recordedAt.toISOString(),
        })),
      });
    }

    // API failed - try to return stale cached data
    const staleEntry = await db.fearGreedIndex.findFirst({
      orderBy: { recordedAt: 'desc' },
    });

    if (staleEntry) {
      const history = await getCachedHistory();
      return NextResponse.json({
        value: staleEntry.value,
        label: staleEntry.label,
        updatedAt: staleEntry.recordedAt.toISOString(),
        history: history.map((entry) => ({
          value: entry.value,
          label: entry.label,
          recordedAt: entry.recordedAt.toISOString(),
        })),
      });
    }

    // No cache at all - return mock data
    return NextResponse.json({
      value: 50,
      label: 'Neutral',
      updatedAt: new Date().toISOString(),
      history: [],
    });
  } catch (error) {
    console.error('Fear & Greed endpoint error:', error);

    // Last resort: try to return any cached data
    try {
      const fallback = await db.fearGreedIndex.findFirst({
        orderBy: { recordedAt: 'desc' },
      });

      if (fallback) {
        return NextResponse.json({
          value: fallback.value,
          label: fallback.label,
          updatedAt: fallback.recordedAt.toISOString(),
          history: [],
        });
      }
    } catch {
      // DB also failed
    }

    return NextResponse.json({
      value: 50,
      label: 'Neutral',
      updatedAt: new Date().toISOString(),
      history: [],
    });
  }
}
