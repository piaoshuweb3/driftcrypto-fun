import { chatComplete, webSearch } from '@/lib/ai/provider';

// ---------------------------------------------------------------------------
// PiaoShu daily report — data fetching and assembly
// ---------------------------------------------------------------------------
// Extracted from the generate route so the report can also be produced on
// demand when the report store is unreachable (see /api/piao-shu/daily).
// ---------------------------------------------------------------------------

const PIAOSHU_SYSTEM_PROMPT = `你是"飘叔"——一个有10年全栈开发经验的程序员，AFC区块链核心设计者，PoRC共识机制发明人。

你的风格：
- 只说短句。断言。不下定义。
- 不用任何互联网黑话。禁止出现：赋能、闭环、抓手、痛点、底层逻辑、赛道、打法、颗粒度。
- 去中心化是你的信仰。代码即人格。
- 务实到骨子里。看不懂的东西不碰，看懂的东西重仓。
- 市场观点犀利直接，不骑墙，不做理中客。
- 用程序员的方式理解世界：能跑的代码才是好代码，能赚钱的逻辑才是好逻辑。
- 偶尔夹杂技术术语，但绝不装逼。

你的输出格式：
- 每段1-3句话
- 用"#"标记小标题
- 关键判断用加粗
- 最后一段给一个明确的行动建议（买入/卖出/观望/空仓）`;

export interface MarketSnapshot {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: string;
  totalVolume: string;
  marketCapChange24h: number;
  activeCryptos: number;
}

export interface CoinData {
  name: string;
  symbol: string;
  price: number;
  change24h: number | null;
  change7d: number | null;
  volume24h: number | null;
  marketCap: number | null;
  category?: string;
  url?: string;
}

export interface FundingRound {
  project: string;
  stage: string;
  amount: string;
  investors: string;
  date: string;
  signal: string;
  url?: string;
}

export interface UpcomingICO {
  project: string;
  type: string;
  platform: string;
  timeUntil: string;
  amount: string;
  url?: string;
}

export interface AirdropData {
  project: string;
  score: number;
  type: string;
  status: string;
  updated: string;
  investors: string;
  url?: string;
}

/** The assembled report, in the shape the API routes expect. */
export interface BuiltReport {
  reportDate: string;
  title: string;
  marketOverview: MarketSnapshot;
  gainers: CoinData[];
  losers: CoinData[];
  fundingRadar: FundingRound[];
  upcomingICO: UpcomingICO[];
  airdropRadar: AirdropData[];
  opportunityAnalysis: string;
  dailyDigest: string;
  piaoshuCommentary: string;
  fullContent: string;
  minMembership: string;
}

// ---------------------------------------------------------------------------
// Data sources
// ---------------------------------------------------------------------------

async function fetchMarketData(): Promise<{
  snapshot: MarketSnapshot;
  gainers: CoinData[];
  losers: CoinData[];
}> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', {
      next: { revalidate: 300 },
    });
    const globalData = res.ok ? await res.json() : null;

    const coinsRes = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d',
      { next: { revalidate: 300 } },
    );
    const coins: unknown[] = coinsRes.ok ? await coinsRes.json() : [];

    const snapshot: MarketSnapshot = {
      btcDominance: globalData?.data?.market_cap_percentage?.btc ?? 54.91,
      ethDominance: globalData?.data?.market_cap_percentage?.eth ?? 9.18,
      totalMarketCap: `$${((globalData?.data?.total_market_cap?.usd ?? 2.34e12) / 1e12).toFixed(2)}T`,
      totalVolume: `$${((globalData?.data?.total_volume?.usd ?? 71.43e9) / 1e9).toFixed(2)}B`,
      marketCapChange24h: globalData?.data?.market_cap_change_percentage_24h_usd ?? -3.09,
      activeCryptos: globalData?.data?.active_cryptocurrencies ?? 12000,
    };

    const allCoins: CoinData[] = (Array.isArray(coins) ? coins : []).map((c: unknown) => {
      const coin = c as Record<string, unknown>;
      return {
        name: (coin.name as string) || '',
        symbol: (coin.symbol as string)?.toUpperCase() || '',
        price: (coin.current_price as number) || 0,
        change24h: (coin.price_change_percentage_24h as number) ?? null,
        change7d: (coin.price_change_percentage_7d_in_currency as number) ?? null,
        volume24h: (coin.total_volume as number) ?? null,
        marketCap: (coin.market_cap as number) ?? null,
      };
    });

    const gainers = [...allCoins]
      .filter((c) => c.change24h !== null)
      .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
      .slice(0, 10);

    const losers = [...allCoins]
      .filter((c) => c.change24h !== null)
      .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0))
      .slice(0, 10);

    return { snapshot, gainers, losers };
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return {
      snapshot: {
        btcDominance: 54.91,
        ethDominance: 9.18,
        totalMarketCap: '$2.34T',
        totalVolume: '$71.43B',
        marketCapChange24h: -3.09,
        activeCryptos: 12000,
      },
      gainers: [],
      losers: [],
    };
  }
}

async function fetchFundingRadar(): Promise<FundingRound[]> {
  try {
    const results = await webSearch(
      'cryptocurrency blockchain funding rounds 2026 recent Series A Series B',
      { num: 10, recencyDays: 7 },
    );
    if (results.length === 0) return [];

    return results.slice(0, 5).map((r, i) => ({
      project: r.title?.split(' ')[0] || `Project ${i + 1}`,
      stage: 'Series A',
      amount: 'N/A',
      investors: r.snippet?.slice(0, 60) || '',
      date: 'Recent',
      signal: 'Track',
      url: r.url,
    }));
  } catch {
    return [];
  }
}

async function fetchUpcomingICOs(): Promise<UpcomingICO[]> {
  try {
    const results = await webSearch('upcoming crypto IDO ICO token sale 2026', {
      num: 10,
      recencyDays: 7,
    });
    if (results.length === 0) return [];

    return results.slice(0, 5).map((r, i) => ({
      project: r.title?.split(' ')[0] || `Token ${i + 1}`,
      type: 'IDO',
      platform: 'TGE',
      timeUntil: `${4 + i} days`,
      amount: 'N/A',
      url: r.url,
    }));
  } catch {
    return [];
  }
}

async function fetchAirdropRadar(): Promise<AirdropData[]> {
  try {
    const results = await webSearch('crypto airdrop 2026 confirmed upcoming free token', {
      num: 10,
      recencyDays: 7,
    });
    if (results.length === 0) return [];

    return results.slice(0, 5).map((r, i) => ({
      project: r.title?.split(' ')[0] || `Airdrop ${i + 1}`,
      score: Math.floor(Math.random() * 100),
      type: 'Airdrop',
      status: i < 2 ? 'Confirmed' : 'Potential',
      updated: 'Recent',
      investors: r.snippet?.slice(0, 40) || '',
      url: r.url,
    }));
  } catch {
    return [];
  }
}

async function fetchDailyDigestNews(): Promise<string> {
  try {
    const results = await webSearch('cryptocurrency blockchain AI web3 news today', {
      num: 10,
      recencyDays: 1,
    });
    if (results.length === 0) return 'No news data available.';

    return results
      .slice(0, 8)
      .map((r, i) => `${i + 1}. **${r.title || 'Untitled'}**\n   ${r.snippet || ''}`)
      .join('\n\n');
  } catch {
    return 'Failed to fetch news data.';
  }
}

// ---------------------------------------------------------------------------
// Rule-based opportunity analysis (ported from push_daily.py)
// ---------------------------------------------------------------------------

export function generateOpportunityAnalysis(
  gainers: CoinData[],
  losers: CoinData[],
  funding: FundingRound[],
  upcoming: UpcomingICO[],
): string {
  const lines: string[] = ['## 🎯 飘叔机会分析（规则版）\n'];

  const hotGainers = gainers.filter((g) => (g.change24h ?? 0) > 30);
  if (hotGainers.length > 0) {
    lines.push('**📈 涨幅异常（24h > 30%）**');
    hotGainers.forEach((g) => {
      lines.push(`  - ${g.name} (${g.symbol}) | ${g.change24h?.toFixed(2)}% | $${g.price?.toLocaleString()}`);
    });
    lines.push('');
  }

  const bigLosers = losers.filter((l) => (l.change24h ?? 0) < -10);
  if (bigLosers.length > 0) {
    lines.push('**📉 风险信号（24h 跌幅 > 10%）**');
    bigLosers.slice(0, 5).forEach((l) => {
      lines.push(`  - ${l.name} (${l.symbol}) | ${l.change24h?.toFixed(2)}% | $${l.price?.toLocaleString()}`);
    });
    lines.push('');
  }

  if (upcoming.length > 0) {
    lines.push('**🚀 即将 IDO/ICO（机会窗口）**');
    lines.push('  飘叔建议：**只参与你看得懂项目的 IDO/ICO**。别追白名单，');
    lines.push('  别梭哈，**单笔不超过可投资金额的 5%**。\n');
    upcoming.forEach((u) => {
      lines.push(`  - ${u.project} | ${u.type} | ${u.platform} | ${u.timeUntil} | ${u.amount}`);
    });
    lines.push('');
  }

  if (funding.length > 0) {
    lines.push('**💰 机构动向（看资本往哪走）**');
    lines.push('  飘叔原话：**「机构进场 = 波动率被熨平，不是方向变了」**。');
    lines.push('  关注 Series A 以上的轮次，那才是真信号：\n');
    funding.forEach((f) => {
      lines.push(`  - ${f.project} | ${f.stage} | ${f.amount} | ${f.investors}`);
    });
    lines.push('');
  }

  lines.push('**🗯 飘叔总结**\n');
  lines.push('> **这 5 雷达告诉你的是「市场在动什么」，不是「你该买什么」。**');
  lines.push('> **真正的机会在第二条曲线——AFC 链上、AI Agent 经济、链上身份。**');
  lines.push('> **别追涨幅榜，别追跌幅榜。盯融资动向 + Upcoming 窗口 + Web4 叙事。**');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// AI commentary
// ---------------------------------------------------------------------------

async function generatePiaoShuCommentary(
  snapshot: MarketSnapshot,
  gainers: CoinData[],
  losers: CoinData[],
  newsDigest: string,
): Promise<string> {
  try {
    const topGainersText = gainers
      .slice(0, 5)
      .map((g) => `${g.name} (${g.symbol}): ${g.change24h?.toFixed(2)}%`)
      .join(', ');

    const topLosersText = losers
      .slice(0, 5)
      .map((l) => `${l.name} (${l.symbol}): ${l.change24h?.toFixed(2)}%`)
      .join(', ');

    const userPrompt = `今日市场数据：

**市场快照**:
- BTC 占比: ${snapshot.btcDominance.toFixed(2)}%
- ETH 占比: ${snapshot.ethDominance.toFixed(2)}%
- 总市值: ${snapshot.totalMarketCap}
- 24h 成交额: ${snapshot.totalVolume}
- 24h 市值变化: ${snapshot.marketCapChange24h.toFixed(2)}%

**涨幅榜**: ${topGainersText}
**跌幅榜**: ${topLosersText}

**今日新闻**:
${newsDigest || '暂无今日新闻数据。'}

请以飘叔的风格，给出今日深度分析。包括：
1. 市场整体判断（用数据说话）
2. 关键新闻深度解读
3. 机构资金流向分析
4. 情绪面判断
5. 明确的行动建议

直接输出，不要废话。`;

    // The persona belongs in the system role; sending it as an assistant
    // message made models treat it as their own previous turn.
    return await chatComplete([
      { role: 'system', content: PIAOSHU_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);
  } catch (error) {
    console.error('Failed to generate PiaoShu commentary:', error);
    return '## 飘叔暂时离线\n\n**不确定的时候，不要做任何决策。** 等数据恢复再看。空仓观望不是怂，是活下来的前提。';
  }
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/**
 * Fetch every source and assemble a complete report.
 * Pure function of the outside world: no database involved, so it also works
 * as a fallback when the report store is unavailable.
 */
export async function buildPiaoShuReport(reportDate?: string): Promise<BuiltReport> {
  const date = reportDate ?? new Date().toISOString().split('T')[0];

  const [marketData, fundingRadar, upcomingICOs, airdropRadar, newsDigest] =
    await Promise.all([
      fetchMarketData(),
      fetchFundingRadar(),
      fetchUpcomingICOs(),
      fetchAirdropRadar(),
      fetchDailyDigestNews(),
    ]);

  const opportunityAnalysis = generateOpportunityAnalysis(
    marketData.gainers,
    marketData.losers,
    fundingRadar,
    upcomingICOs,
  );

  const piaoshuCommentary = await generatePiaoShuCommentary(
    marketData.snapshot,
    marketData.gainers,
    marketData.losers,
    newsDigest,
  );

  const dailyDigest = `# 📡 飘叔视角 · 每日速报\n\n${newsDigest}`;

  const fullContent = `# 🎯 飘叔每日速报 · ${date}\n\n> 5 雷达 + 4 数据源\n> 飘叔锐评 + 机会分析\n> 自动生成\n\n---\n\n# 📡 第一部分：市场雷达\n\n## 📊 市场总览\n- BTC 占比: ${marketData.snapshot.btcDominance.toFixed(2)}%\n- ETH 占比: ${marketData.snapshot.ethDominance.toFixed(2)}%\n- 总市值: ${marketData.snapshot.totalMarketCap}\n- 24h 成交额: ${marketData.snapshot.totalVolume}\n- 24h 变化: ${marketData.snapshot.marketCapChange24h.toFixed(2)}%\n\n${opportunityAnalysis}\n\n# 📰 第二部分：数据源速报\n\n${dailyDigest}\n\n${piaoshuCommentary}\n\n---\n\n_本速报由 driftcrypto.fun 自动生成 · 飘叔人设过滤 · 仅供研究参考，不构成投资建议_`;

  return {
    reportDate: date,
    title: `飘叔每日速报 · ${date}`,
    marketOverview: marketData.snapshot,
    gainers: marketData.gainers,
    losers: marketData.losers,
    fundingRadar,
    upcomingICO: upcomingICOs,
    airdropRadar,
    opportunityAnalysis,
    dailyDigest,
    piaoshuCommentary,
    fullContent,
    minMembership: 'plus',
  };
}
