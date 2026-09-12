import { NextRequest, NextResponse } from "next/server";
import { isSearchConfigured, webSearch } from "@/lib/ai/provider";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Sentiment classification – simple keyword rules
// ---------------------------------------------------------------------------

const BULLISH_KEYWORDS = [
  "rally", "surge", "bull", "gain", "pump", "moon",
  "breakout", "soar", "positive", "growth", "upgrade",
  // Chinese keywords
  "上涨", "飙升", "突破", "增长", "利好", "新高", "反弹", "牛市",
] as const;

const BEARISH_KEYWORDS = [
  "crash", "dump", "bear", "decline", "drop", "fall",
  "hack", "exploit", "ban", "risk", "warning", "fear",
  // Chinese keywords
  "下跌", "暴跌", "崩盘", "损失", "风险", "打击", "漏洞", "熊市", "紧张",
] as const;

function classifySentiment(text: string): "bullish" | "bearish" | "neutral" {
  const lower = text.toLowerCase();

  const bullishScore = BULLISH_KEYWORDS.reduce(
    (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
    0,
  );
  const bearishScore = BEARISH_KEYWORDS.reduce(
    (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
    0,
  );

  if (bullishScore > bearishScore) return "bullish";
  if (bearishScore > bullishScore) return "bearish";
  return "neutral";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NewsItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral";
  publishedAt: string;
  favicon: string;
}

interface SearchHit {
  title?: string;
  url?: string;
  snippet?: string;
  source?: string;
  publishedAt?: string;
  favicon?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildContentHash(url: string, title: string): string {
  // Simple deterministic hash for dedup / cache lookup
  let hash = 0;
  const combined = `${url}::${title}`;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash).toString(36);
}

function normaliseSearchHit(hit: SearchHit, queryTag: string): NewsItem | null {
  const title = hit.title ?? "";
  const url = hit.url ?? "";
  if (!title || !url) return null;

  const sentiment = classifySentiment(`${title} ${hit.snippet ?? ""}`);

  return {
    id: buildContentHash(url, title),
    title,
    url,
    snippet: hit.snippet ?? "",
    source: hit.source ?? queryTag,
    sentiment,
    publishedAt: hit.publishedAt ?? new Date().toISOString(),
    favicon: hit.favicon ?? "",
  };
}

// ---------------------------------------------------------------------------
// GET /api/news
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q") ?? "cryptocurrency AI blockchain";
  const num = Math.min(Math.max(Number(searchParams.get("num")) || 20, 1), 50);
  const recencyDays = Math.min(
    Math.max(Number(searchParams.get("recency_days")) || 7, 1),
    30,
  );

  const locale = searchParams.get("locale") ?? "en";

  // Fallback mock data when search API is unavailable
  const MOCK_NEWS: NewsItem[] = [
    { id: "mock1", title: "Bitcoin Surges Past $65K as Institutional Demand Grows", url: "https://www.coindesk.com/markets/2026/06/04/bitcoin-surges/", snippet: "Bitcoin rallied above $65,000 driven by strong institutional inflows and growing ETF adoption. Analysts see potential for new all-time highs.", source: "coindesk.com", sentiment: "bullish", publishedAt: new Date(Date.now() - 3600000).toISOString(), favicon: "" },
    { id: "mock2", title: "SEC Approves New Crypto Regulatory Framework", url: "https://www.theblock.co/post/sec-crypto-framework", snippet: "The SEC has approved a comprehensive regulatory framework for digital assets, providing clarity for the industry.", source: "theblock.co", sentiment: "bullish", publishedAt: new Date(Date.now() - 7200000).toISOString(), favicon: "" },
    { id: "mock3", title: "Ethereum Layer 2 Solutions See Record Transaction Volume", url: "https://cointelegraph.com/news/ethereum-l2-volume", snippet: "Ethereum Layer 2 networks have processed a record number of transactions, signaling growing adoption of scaling solutions.", source: "cointelegraph.com", sentiment: "bullish", publishedAt: new Date(Date.now() - 10800000).toISOString(), favicon: "" },
    { id: "mock4", title: "Major Crypto Exchange Suffers Security Breach", url: "https://decrypt.co/security-breach", snippet: "A major cryptocurrency exchange reported a security breach resulting in the loss of digital assets worth millions.", source: "decrypt.co", sentiment: "bearish", publishedAt: new Date(Date.now() - 14400000).toISOString(), favicon: "" },
    { id: "mock5", title: "AI-Powered Trading Bots Gain Popularity in Crypto Markets", url: "https://www.coindesk.com/tech/ai-trading-bots", snippet: "AI-driven trading algorithms are becoming increasingly popular among crypto traders seeking edge in volatile markets.", source: "coindesk.com", sentiment: "neutral", publishedAt: new Date(Date.now() - 18000000).toISOString(), favicon: "" },
    { id: "mock6", title: "Solana DeFi TVL Reaches New All-Time High", url: "https://www.theblock.co/post/solana-defi-tvl", snippet: "Total value locked in Solana DeFi protocols has reached a new record, driven by liquid staking and meme coin activity.", source: "theblock.co", sentiment: "bullish", publishedAt: new Date(Date.now() - 21600000).toISOString(), favicon: "" },
    { id: "mock7", title: "China Cracks Down on Crypto Mining Operations", url: "https://reuters.com/china-crypto-mining", snippet: "Chinese authorities have intensified crackdown on cryptocurrency mining operations in several provinces.", source: "reuters.com", sentiment: "bearish", publishedAt: new Date(Date.now() - 25200000).toISOString(), favicon: "" },
    { id: "mock8", title: "DeFi Protocol Launches Cross-Chain Bridge Solution", url: "https://cointelegraph.com/news/cross-chain-bridge", snippet: "A new DeFi protocol has launched a cross-chain bridge enabling seamless asset transfers between major blockchains.", source: "cointelegraph.com", sentiment: "neutral", publishedAt: new Date(Date.now() - 28800000).toISOString(), favicon: "" },
    { id: "mock9", title: "MicroStrategy Adds Another 1,000 BTC to Treasury", url: "https://www.coindesk.com/business/microstrategy-btc", snippet: "MicroStrategy has purchased an additional 1,000 BTC, bringing its total holdings to over 200,000 bitcoins.", source: "coindesk.com", sentiment: "bullish", publishedAt: new Date(Date.now() - 32400000).toISOString(), favicon: "" },
    { id: "mock10", title: "Central Bank Digital Currency Pilots Expand in Asia", url: "https://www.theblock.co/post/cbdc-asia-pilots", snippet: "Several Asian countries are expanding their CBDC pilot programs, with commercial launches expected within the next two years.", source: "theblock.co", sentiment: "neutral", publishedAt: new Date(Date.now() - 36000000).toISOString(), favicon: "" },
    { id: "mock11", title: "Crypto Market Faces Increased Volatility Amid Geopolitical Tensions", url: "https://decrypt.co/crypto-volatility", snippet: "Cryptocurrency markets experienced significant volatility as geopolitical tensions escalate, with BTC dropping 5% in 24 hours.", source: "decrypt.co", sentiment: "bearish", publishedAt: new Date(Date.now() - 39600000).toISOString(), favicon: "" },
    { id: "mock12", title: "New AI Agent Framework Enables Autonomous DeFi Trading", url: "https://cointelegraph.com/news/ai-agent-defi", snippet: "A new AI agent framework allows autonomous trading on DeFi protocols, raising questions about market manipulation risks.", source: "cointelegraph.com", sentiment: "neutral", publishedAt: new Date(Date.now() - 43200000).toISOString(), favicon: "" },
  ];

  const ZH_MOCK_NEWS: NewsItem[] = [
    { id: "zmock1", title: "比特币突破6.5万美元，机构需求持续增长", url: "https://www.coindesk.com/markets/2026/06/04/bitcoin-surges/", snippet: "受机构资金强劲流入和ETF采用增长推动，比特币飙升至65,000美元以上。分析师认为可能创下新的历史新高。", source: "coindesk.com", sentiment: "bullish", publishedAt: new Date(Date.now() - 3600000).toISOString(), favicon: "" },
    { id: "zmock2", title: "美国SEC批准新加密货币监管框架", url: "https://www.theblock.co/post/sec-crypto-framework", snippet: "美国证券交易委员会已批准一项全面的数字资产监管框架，为行业提供了更清晰的合规指引。", source: "theblock.co", sentiment: "bullish", publishedAt: new Date(Date.now() - 7200000).toISOString(), favicon: "" },
    { id: "zmock3", title: "以太坊Layer 2解决方案交易量创历史新高", url: "https://cointelegraph.com/news/ethereum-l2-volume", snippet: "以太坊Layer 2网络已处理了创纪录数量的交易，标志着扩容解决方案的广泛采用。", source: "cointelegraph.com", sentiment: "bullish", publishedAt: new Date(Date.now() - 10800000).toISOString(), favicon: "" },
    { id: "zmock4", title: "大型加密货币交易所遭遇安全漏洞", url: "https://decrypt.co/security-breach", snippet: "一家大型加密货币交易所报告了安全漏洞，导致价值数百万美元的数字资产损失。", source: "decrypt.co", sentiment: "bearish", publishedAt: new Date(Date.now() - 14400000).toISOString(), favicon: "" },
    { id: "zmock5", title: "AI驱动的交易机器人在加密市场日益流行", url: "https://www.coindesk.com/tech/ai-trading-bots", snippet: "AI驱动的交易算法在加密货币交易者中越来越受欢迎，他们寻求在波动市场中获得优势。", source: "coindesk.com", sentiment: "neutral", publishedAt: new Date(Date.now() - 18000000).toISOString(), favicon: "" },
    { id: "zmock6", title: "Solana DeFi总锁仓量创历史新高", url: "https://www.theblock.co/post/solana-defi-tvl", snippet: "Solana DeFi协议中的总锁仓量已达到新纪录，由流动性质押和meme币活动推动。", source: "theblock.co", sentiment: "bullish", publishedAt: new Date(Date.now() - 21600000).toISOString(), favicon: "" },
    { id: "zmock7", title: "中国加大打击加密货币挖矿业务", url: "https://reuters.com/china-crypto-mining", snippet: "中国当局已在多个省份加大了对加密货币挖矿业务的打击力度。", source: "reuters.com", sentiment: "bearish", publishedAt: new Date(Date.now() - 25200000).toISOString(), favicon: "" },
    { id: "zmock8", title: "DeFi协议推出跨链桥接解决方案", url: "https://cointelegraph.com/news/cross-chain-bridge", snippet: "一个新的DeFi协议推出了跨链桥，实现主要区块链之间的无缝资产转移。", source: "cointelegraph.com", sentiment: "neutral", publishedAt: new Date(Date.now() - 28800000).toISOString(), favicon: "" },
    { id: "zmock9", title: "MicroStrategy再购入1,000枚BTC", url: "https://www.coindesk.com/business/microstrategy-btc", snippet: "MicroStrategy已购买额外1,000枚BTC，其总持有量超过200,000枚比特币。", source: "coindesk.com", sentiment: "bullish", publishedAt: new Date(Date.now() - 32400000).toISOString(), favicon: "" },
    { id: "zmock10", title: "亚洲央行数字货币试点扩大", url: "https://www.theblock.co/post/cbdc-asia-pilots", snippet: "多个亚洲国家正在扩大央行数字货币试点项目，预计未来两年内推出商用版本。", source: "theblock.co", sentiment: "neutral", publishedAt: new Date(Date.now() - 36000000).toISOString(), favicon: "" },
    { id: "zmock11", title: "地缘政治紧张局势加剧，加密市场面临剧烈波动", url: "https://decrypt.co/crypto-volatility", snippet: "随着地缘政治紧张局势升级，加密货币市场经历了大幅波动，BTC在24小时内下跌5%。", source: "decrypt.co", sentiment: "bearish", publishedAt: new Date(Date.now() - 39600000).toISOString(), favicon: "" },
    { id: "zmock12", title: "新型AI代理框架实现自主DeFi交易", url: "https://cointelegraph.com/news/ai-agent-defi", snippet: "一种新型AI代理框架允许在DeFi协议上进行自主交易，引发了对市场操纵风险的讨论。", source: "cointelegraph.com", sentiment: "neutral", publishedAt: new Date(Date.now() - 43200000).toISOString(), favicon: "" },
  ];

  const fallbackNews = locale === 'zh' ? ZH_MOCK_NEWS : MOCK_NEWS;

  try {
    // ----- 1. Parallel search across multiple queries -----------------------

    const queries = [
      "cryptocurrency news",
      "AI blockchain news",
      "crypto market analysis",
    ];

    // If the caller provided a custom query, include it too
    if (!queries.includes(q)) {
      queries.push(q);
    }

    const perQueryNum = Math.ceil(num / queries.length);

    // No search provider configured means there is nothing to query, so go
    // straight to the curated fallback rather than faking a failed request.
    if (!isSearchConfigured()) {
      console.warn("[news] no search provider configured, returning fallback data");
      const items = fallbackNews.slice(0, num);
      return NextResponse.json({ items, total: fallbackNews.length, hasMore: fallbackNews.length > num });
    }

    const searchResults = await Promise.all(
      queries.map((query) =>
        webSearch(query, { num: perQueryNum, recencyDays }).catch((err: unknown) => {
          console.error(`[news] search failed for "${query}":`, err);
          return [] as SearchHit[];
        }),
      ),
    );

    // ----- 2. Normalise + deduplicate by URL -------------------------------

    const seenUrls = new Set<string>();
    const deduped: NewsItem[] = [];

    for (let i = 0; i < searchResults.length; i++) {
      const hits: SearchHit[] = Array.isArray(searchResults[i])
        ? searchResults[i]
        : [];

      for (const hit of hits) {
        const item = normaliseSearchHit(hit, queries[i]);
        if (!item) continue;

        const normalisedUrl = item.url.replace(/\/+$/, "").toLowerCase();
        if (seenUrls.has(normalisedUrl)) continue;
        seenUrls.add(normalisedUrl);

        deduped.push(item);
      }
    }

    // ----- 3. Cache in DB (upsert by contentHash) -------------------------

    const upsertPromises = deduped.map((item) =>
      db.news
        .upsert({
          where: { contentHash: item.id },
          update: {
            title: item.title,
            url: item.url,
            summary: item.snippet,
            sentiment: item.sentiment,
            sourceId: item.source,
            imageUrl: item.favicon || undefined,
            scrapedAt: new Date(),
          },
          create: {
            contentHash: item.id,
            title: item.title,
            url: item.url,
            summary: item.snippet,
            sentiment: item.sentiment,
            sourceId: item.source,
            imageUrl: item.favicon || undefined,
            externalId: item.id,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
          },
        })
        .catch((err: unknown) => {
          console.error(`[news] upsert failed for "${item.url}":`, err);
        }),
    );

    await Promise.all(upsertPromises);

    // ----- 4. Sort by publishedAt descending -------------------------------

    deduped.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    // ----- 5. Fallback to mock data if no results --------------------------

    if (deduped.length === 0) {
      console.warn("[news] No search results, returning mock data");
      const items = fallbackNews.slice(0, num);
      return NextResponse.json({ items, total: fallbackNews.length, hasMore: fallbackNews.length > num });
    }

    // ----- 6. Paginate -----------------------------------------------------

    const total = deduped.length;
    const items = deduped.slice(0, num);
    const hasMore = total > num;

    return NextResponse.json({ items, total, hasMore });
  } catch (error: unknown) {
    console.error("[news] Unexpected error:", error);

    // Return mock data instead of error
    const items = fallbackNews.slice(0, num);
    return NextResponse.json({ items, total: fallbackNews.length, hasMore: fallbackNews.length > num });
  }
}
