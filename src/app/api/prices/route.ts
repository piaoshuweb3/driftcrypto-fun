import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const COINS_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h';
const GLOBAL_URL = 'https://api.coingecko.com/api/v3/global';

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

interface GlobalData {
  totalMarketCap: number;
  totalVolume: number;
  activeCryptos: number;
  marketCapChange24h: number;
}

interface PricesResponse {
  coins: CoinData[];
  global: GlobalData;
}

/** Build mock / fallback data so the UI always has something to render */
function buildMockData(): PricesResponse {
  const mockCoins: CoinData[] = [
    { coinId: 'bitcoin', symbol: 'btc', name: 'Bitcoin', usdPrice: 67000, change24h: 1.2, volume24h: 28_000_000_000, marketCap: 1_320_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    { coinId: 'ethereum', symbol: 'eth', name: 'Ethereum', usdPrice: 3500, change24h: -0.8, volume24h: 14_000_000_000, marketCap: 420_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { coinId: 'tether', symbol: 'usdt', name: 'Tether', usdPrice: 1.0, change24h: 0.01, volume24h: 50_000_000_000, marketCap: 95_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { coinId: 'bnb', symbol: 'bnb', name: 'BNB', usdPrice: 580, change24h: 0.5, volume24h: 1_800_000_000, marketCap: 89_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
    { coinId: 'solana', symbol: 'sol', name: 'Solana', usdPrice: 170, change24h: 3.1, volume24h: 3_500_000_000, marketCap: 75_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    { coinId: 'xrp', symbol: 'xrp', name: 'XRP', usdPrice: 0.62, change24h: -1.3, volume24h: 1_500_000_000, marketCap: 34_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
    { coinId: 'usdc', symbol: 'usdc', name: 'USD Coin', usdPrice: 1.0, change24h: 0.0, volume24h: 6_000_000_000, marketCap: 33_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
    { coinId: 'cardano', symbol: 'ada', name: 'Cardano', usdPrice: 0.45, change24h: 2.4, volume24h: 500_000_000, marketCap: 16_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
    { coinId: 'dogecoin', symbol: 'doge', name: 'Dogecoin', usdPrice: 0.15, change24h: 4.2, volume24h: 1_200_000_000, marketCap: 21_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
    { coinId: 'avalanche', symbol: 'avax', name: 'Avalanche', usdPrice: 35, change24h: -0.6, volume24h: 600_000_000, marketCap: 13_000_000_000, imageUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  ];

  const mockGlobal: GlobalData = {
    totalMarketCap: 2_600_000_000_000,
    totalVolume: 120_000_000_000,
    activeCryptos: 13_000,
    marketCapChange24h: 1.5,
  };

  return { coins: mockCoins, global: mockGlobal };
}

/** Parse CoinGecko coin-market response into our CoinData shape */
function parseCoinGeckoCoins(raw: Record<string, unknown>[]): CoinData[] {
  return raw.map((coin) => ({
    coinId: String(coin.id ?? ''),
    symbol: String(coin.symbol ?? '').toLowerCase(),
    name: String(coin.name ?? ''),
    usdPrice: Number(coin.current_price ?? 0),
    change24h: coin.price_change_percentage_24h != null ? Number(coin.price_change_percentage_24h) : null,
    volume24h: coin.total_volume != null ? Number(coin.total_volume) : null,
    marketCap: coin.market_cap != null ? Number(coin.market_cap) : null,
    imageUrl: coin.image ? String(coin.image) : null,
  }));
}

/** Parse CoinGecko global response into our GlobalData shape */
function parseCoinGeckoGlobal(raw: Record<string, unknown>): GlobalData {
  const data = (raw.data ?? {}) as Record<string, unknown>;
  const totalMarketCapObj = data.total_market_cap as Record<string, number> | undefined;
  const totalVolumeObj = data.total_volume as Record<string, number> | undefined;
  const marketCapChange = data.market_cap_change_percentage_24h_usd as number | undefined;

  return {
    totalMarketCap: totalMarketCapObj?.usd ?? 0,
    totalVolume: totalVolumeObj?.usd ?? 0,
    activeCryptos: Number(data.active_cryptocurrencies ?? 0),
    marketCapChange24h: marketCapChange ?? 0,
  };
}

/** Persist coin data into the Price table, cleaning up stale entries first */
async function cacheCoins(coins: CoinData[]): Promise<void> {
  try {
    // Delete stale records older than the cache TTL before inserting fresh ones
    const cutoff = new Date(Date.now() - CACHE_TTL_MS);
    await db.price.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });

    // Insert fresh records in a transaction
    await db.$transaction(
      coins.map((coin) =>
        db.price.create({
          data: {
            coinId: coin.coinId,
            symbol: coin.symbol,
            name: coin.name,
            usdPrice: coin.usdPrice,
            change24h: coin.change24h,
            volume24h: coin.volume24h,
            marketCap: coin.marketCap,
            imageUrl: coin.imageUrl,
          },
        }),
      ),
    );
  } catch (error) {
    console.error('[/api/prices] Failed to cache coins in DB:', error);
  }
}

/**
 * Load the most recent cached coins from the DB.
 * Returns null if no records exist or the cache is older than CACHE_TTL_MS.
 */
async function loadCachedCoins(): Promise<{ coins: CoinData[]; age: number } | null> {
  try {
    const latest = await db.price.findFirst({
      orderBy: { recordedAt: 'desc' },
      select: { recordedAt: true },
    });

    if (!latest) return null;

    const age = Date.now() - latest.recordedAt.getTime();
    if (age > CACHE_TTL_MS) return null; // Cache is stale

    // Fetch all coins recorded at roughly the same time (within 10s of latest)
    const windowStart = new Date(latest.recordedAt.getTime() - 10_000);
    const records = await db.price.findMany({
      where: {
        recordedAt: {
          gte: windowStart,
          lte: latest.recordedAt,
        },
      },
      orderBy: { marketCap: 'desc' },
    });

    const coins: CoinData[] = records.map((r) => ({
      coinId: r.coinId,
      symbol: r.symbol,
      name: r.name,
      usdPrice: r.usdPrice,
      change24h: r.change24h,
      volume24h: r.volume24h,
      marketCap: r.marketCap,
      imageUrl: r.imageUrl,
    }));

    return { coins, age };
  } catch (error) {
    console.error('[/api/prices] Failed to load cached coins:', error);
    return null;
  }
}

/**
 * Load all coins from DB regardless of TTL (fallback for when API is down).
 */
async function loadStaleCoins(): Promise<CoinData[]> {
  try {
    const records = await db.price.findMany({
      orderBy: { recordedAt: 'desc' },
    });

    // Deduplicate by coinId — keep only the most recent entry per coin
    const seen = new Set<string>();
    const coins: CoinData[] = [];

    for (const r of records) {
      if (seen.has(r.coinId)) continue;
      seen.add(r.coinId);
      coins.push({
        coinId: r.coinId,
        symbol: r.symbol,
        name: r.name,
        usdPrice: r.usdPrice,
        change24h: r.change24h,
        volume24h: r.volume24h,
        marketCap: r.marketCap,
        imageUrl: r.imageUrl,
      });
    }

    return coins;
  } catch (error) {
    console.error('[/api/prices] Failed to load stale coins:', error);
    return [];
  }
}

/** Fetch with timeout and error handling */
async function safeFetch(url: string, timeoutMs = 10_000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.error(`[/api/prices] Fetch ${url} returned status ${response.status}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error(
      `[/api/prices] Fetch ${url} failed:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function GET(_request: Request) {
  // 1. Check cache first — return immediately if fresh
  const cached = await loadCachedCoins();

  if (cached) {
    // Even with cached coins, try to fetch fresh global data
    let global: GlobalData = buildMockData().global;

    const globalRes = await safeFetch(GLOBAL_URL);
    if (globalRes) {
      try {
        const globalJson = await globalRes.json();
        global = parseCoinGeckoGlobal(globalJson as Record<string, unknown>);
      } catch {
        // keep mock global data
      }
    }

    return NextResponse.json<PricesResponse>({
      coins: cached.coins,
      global,
    });
  }

  // 2. Cache is stale or empty — fetch fresh data from CoinGecko
  let coins: CoinData[] = [];
  let global: GlobalData = buildMockData().global;
  let coinsFetchSucceeded = false;

  // Fetch coins and global in parallel for speed
  const [coinsRes, globalRes] = await Promise.all([
    safeFetch(COINS_URL, 15_000),
    safeFetch(GLOBAL_URL, 10_000),
  ]);

  if (coinsRes) {
    try {
      const coinsJson = await coinsRes.json();
      if (Array.isArray(coinsJson)) {
        coins = parseCoinGeckoCoins(coinsJson as Record<string, unknown>[]);
        coinsFetchSucceeded = true;
      }
    } catch (error) {
      console.error('[/api/prices] Failed to parse coins response:', error);
    }
  }

  if (globalRes) {
    try {
      const globalJson = await globalRes.json();
      global = parseCoinGeckoGlobal(globalJson as Record<string, unknown>);
    } catch (error) {
      console.error('[/api/prices] Failed to parse global response:', error);
    }
  }

  // 3. If CoinGecko fetch failed, attempt to return stale cached data from DB
  if (!coinsFetchSucceeded) {
    const staleCoins = await loadStaleCoins();
    if (staleCoins.length > 0) {
      return NextResponse.json<PricesResponse>({
        coins: staleCoins,
        global,
      });
    }

    // No data at all — return mock data as last resort
    console.warn('[/api/prices] CoinGecko unavailable and no cache — returning mock data');
    return NextResponse.json<PricesResponse>(buildMockData());
  }

  // 4. Persist fresh coins to DB (fire-and-forget style, errors logged internally)
  await cacheCoins(coins);

  return NextResponse.json<PricesResponse>({ coins, global });
}
