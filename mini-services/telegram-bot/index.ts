// =============================================================================
// driftcrypto.fun Telegram Bot — Official Channel Bot
// =============================================================================
// Bot: @DriftcryptoBot (t.me/DriftcryptoBot)
// Port: 3002 (health check server)
// =============================================================================

import { Bot, InlineKeyboard } from "grammy";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BOT_TOKEN = "8982097824:AAEzZcN5yfCVHieRLmQ-0CBHebVccRPhs3k";
const API_BASE = "http://localhost:3000";
const BOT_PORT = 3002;

const bot = new Bot(BOT_TOKEN);

// ---------------------------------------------------------------------------
// User language store (in-memory, keyed by chat ID)
// ---------------------------------------------------------------------------
const userLangs = new Map<number, "en" | "zh">();

function getLang(chatId: number): "en" | "zh" {
  return userLangs.get(chatId) ?? "zh"; // Default to Chinese
}

function setLang(chatId: number, lang: "en" | "zh") {
  userLangs.set(chatId, lang);
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------
interface PricesResponse {
  coins: Array<{
    coinId: string;
    symbol: string;
    name: string;
    usdPrice: number;
    change24h: number | null;
    volume24h: number | null;
    marketCap: number | null;
    imageUrl: string | null;
  }>;
  global: {
    totalMarketCap: number;
    totalVolume: number;
    activeCryptos: number;
    marketCapChange24h: number;
  };
}

interface FearGreedResponse {
  value: number;
  label: string;
  updatedAt: string;
  history: Array<{ value: number; label: string; recordedAt: string }>;
}

interface NewsResponse {
  items: Array<{
    id: string;
    title: string;
    url: string;
    snippet: string;
    source: string;
    sentiment: string;
    publishedAt: string;
    favicon: string;
  }>;
  total: number;
  hasMore: boolean;
}

interface AIDigestResponse {
  digest: string;
}

interface AIChatResponse {
  response: string;
}

interface PiaoShuDailyResponse {
  title?: string;
  overview?: string;
  piaoshuCommentary?: string;
  gainers?: Array<{ name: string; symbol: string; change24h: number }>;
  losers?: Array<{ name: string; symbol: string; change24h: number }>;
  opportunityAnalysis?: string;
  fundingRadar?: Array<{ name: string; description: string }>;
  airdropRadar?: Array<{ name: string; description: string }>;
  minMembership?: string;
}

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------
const i18n = {
  en: {
    welcome: `🌐 *Welcome to driftcrypto\\.fun\\!*

AI\\-Powered Cryptocurrency Intelligence Platform\\. Get real\\-time prices, AI analysis, PiaoShu daily reports, and more\\.

Select a section below to explore:`,
    mainMenu: "🏠 Main Menu",
    moreSections: "📚 More Sections",
    backToMain: "⬅️ Back to Main",
    dashboard: "📊 Dashboard",
    market: "📈 Market",
    portfolio: "💼 Portfolio",
    screener: "🔍 Screener",
    aiChat: "🤖 AI Chat",
    piaoShu: "👑 PiaoShu Analysis",
    aiAnalysis: "🧠 AI Analysis",
    technicalAnalysis: "📈 Tech Analysis",
    sentiment: "💚 Sentiment",
    predictions: "🔮 Predictions",
    marketAnalysis: "📊 Market Analysis",
    macroEconomics: "🏛 Macro Economics",
    correlations: "🔗 Correlations",
    microstructure: "🔬 Microstructure",
    trending: "🔥 Trending",
    predictionAccuracy: "🎯 Accuracy",
    batchAnalysis: "📑 Batch Analysis",
    nft: "🖼 NFT",
    membership: "👑 Membership",
    langSwitch: "🌐 EN/中文",
    langChanged: "✅ Language switched to English!",
    langCurrent: "Current language: English 🇬🇧",
    loading: "⏳ Loading...",
    error: "❌ Failed to load data. Please try again later.",
    noData: "📭 No data available at the moment.",
    helpText: `*driftcrypto\\.fun Bot Commands*

/start \\- Show main menu
/help \\- Show this help
/lang \\- Switch language \\(EN/中文\\)
/price \\<coin\\> \\- Quick price lookup \\(e\\.g\\. /price bitcoin\\)
/news \\- Latest crypto news
/feargreed \\- Fear & Greed Index
/piaoshu \\- PiaoShu daily analysis

*Navigation:* Use inline buttons to explore all sections\\!`,
    // Section descriptions
    dashboardDesc: `📊 *Dashboard*

Your crypto command center — live market overview, top movers, Fear & Greed Index, AI daily digest, and breaking news\\.`,
    marketDesc: `📈 *Market*

Full market data — top 100 coins by market cap, 24h price changes, volume, and TradingView charts\\.`,
    portfolioDesc: `💼 *Portfolio*

Track and manage your crypto holdings\\. Sign in on the website to sync your portfolio\\.`,
    screenerDesc: `🔍 *VC Token Screener*

Track top VC fund crypto holdings\\. Search by firm or wallet address\\.`,
    aiChatDesc: `🤖 *AI Chat*

Ask anything about crypto\\! Send your question directly in chat, and I'll get an AI\\-powered response\\.

_Tap a quick question or type below:_`,
    piaoShuDesc: `👑 *PiaoShu Analysis*

Daily crypto intelligence with exclusive insights from PiaoShu\\. Premium content available for Plus/Pro members\\.`,
    aiAnalysisDesc: `🧠 *AI Analysis Hub*

Multi\\-model AI\\-powered crypto analysis — market analysis, price predictions, sentiment analysis, and technical indicators\\.`,
    technicalAnalysisDesc: `📈 *Technical Analysis*

Advanced chart patterns, technical indicators, support/resistance levels, and trend analysis\\.`,
    sentimentDesc: `💚 *Market Sentiment*

AI\\-powered sentiment analysis — social sentiment, news sentiment, and Fear & Greed Index\\.`,
    predictionsDesc: `🔮 *Enhanced Predictions*

AI\\-driven price predictions with confidence scores for short, mid, and long\\-term timeframes\\.`,
    marketAnalysisDesc: `📊 *Market Analysis*

Comprehensive AI\\-driven market analysis with trend direction, support/resistance, and risk levels\\.`,
    macroDesc: `🏛 *Macro Economics*

Global economic indicators affecting crypto markets — DXY, CPI, Gold, S\\&P 500, VIX, Fed Rate, and more\\.`,
    correlationsDesc: `🔗 *Cross\\-Asset Correlations*

Correlation heatmap across major assets — BTC, ETH, Gold, S\\&P 500, DXY, and more\\.`,
    microstructureDesc: `🔬 *Market Microstructure*

Order book depth, bid\\-ask spreads, and liquidity metrics for major crypto pairs\\.`,
    trendingDesc: `🔥 *Trending*

What's hot in crypto right now — top gainers, top losers, and high volume coins\\.`,
    accuracyDesc: `🎯 *Prediction Accuracy*

Track and verify AI prediction performance over time\\.`,
    batchDesc: `📑 *Batch Analysis*

Analyze multiple coins simultaneously with AI\\.`,
    nftDesc: `🖼 *NFT*

Discover, collect, and trade unique digital assets powered by AI\\-driven insights\\. Coming soon\\!`,
    membershipDesc: `👑 *Membership Plans*

🔓 *Free* — Basic market data, 5 AI chats/day, Limited news
⭐ *Plus* — $29/mo — PiaoShu reports, 100 AI chats/day, Advanced analysis
💎 *Pro* — $99/mo — Unlimited AI chat, Real\\-time alerts, API access

💳 Pay with USD or USDC

👉 Visit [driftcrypto\\.fun](https://driftcrypto.fun) to upgrade\\!`,
    // Price lookup
    priceNotFound: "❌ Coin not found. Try: /price bitcoin, /price ethereum, /price solana",
    // AI Chat
    aiThinking: "🤔 Thinking...",
    aiDisclaimer: "\n\n_⚠️ AI-generated content for reference only. Not financial advice._",
    // Fear & Greed
    fearGreed: "Fear & Greed Index",
    extremeFear: "Extreme Fear",
    fear: "Fear",
    neutral: "Neutral",
    greed: "Greed",
    extremeGreed: "Extreme Greed",
  },
  zh: {
    welcome: `🌐 *欢迎来到 driftcrypto\\.fun\\！*

AI 驱动的加密货币智能平台\\. 实时行情、AI 分析、飘叔每日研报等您探索\\.

请选择下方栏目开始：`,
    mainMenu: "🏠 主菜单",
    moreSections: "📚 更多栏目",
    backToMain: "⬅️ 返回主菜单",
    dashboard: "📊 仪表盘",
    market: "📈 行情",
    portfolio: "💼 投资组合",
    screener: "🔍 筛选器",
    aiChat: "🤖 AI 聊天",
    piaoShu: "👑 飘叔分析",
    aiAnalysis: "🧠 AI 分析",
    technicalAnalysis: "📈 技术分析",
    sentiment: "💚 情绪指标",
    predictions: "🔮 增强预测",
    marketAnalysis: "📊 市场分析",
    macroEconomics: "🏛 宏观经济",
    correlations: "🔗 相关性分析",
    microstructure: "🔬 微观结构",
    trending: "🔥 热门趋势",
    predictionAccuracy: "🎯 预测准确率",
    batchAnalysis: "📑 批量分析",
    nft: "🖼 NFT",
    membership: "👑 会员服务",
    langSwitch: "🌐 中文/EN",
    langChanged: "✅ 已切换为中文！",
    langCurrent: "当前语言：中文 🇨🇳",
    loading: "⏳ 加载中...",
    error: "❌ 数据加载失败，请稍后重试。",
    noData: "📭 暂无数据。",
    helpText: `*driftcrypto\\.fun 机器人命令*

/start \\- 显示主菜单
/help \\- 显示帮助
/lang \\- 切换语言 \\(EN/中文\\)
/price \\<币种\\> \\- 快速查价 \\(如 /price bitcoin\\)
/news \\- 最新加密新闻
/feargreed \\- 恐慌贪婪指数
/piaoshu \\- 飘叔每日分析

*导航：* 使用内联按钮浏览所有栏目\\！`,
    dashboardDesc: `📊 *仪表盘*

加密指挥中心 — 实时行情概览、涨跌排行、恐慌贪婪指数、AI 每日点评和最新资讯。`,
    marketDesc: `📈 *行情*

完整市场数据 — 按市值排名前100币种、24h 价格变动、成交量和 TradingView 图表。`,
    portfolioDesc: `💼 *投资组合*

追踪和管理您的加密资产。登录网站同步投资组合。`,
    screenerDesc: `🔍 *VC 持仓筛选器*

追踪顶级风投基金加密持仓。按机构或钱包地址搜索。`,
    aiChatDesc: `🤖 *AI 聊天*

关于加密货币的任何问题\\！直接在聊天中发送您的问题，我会给出 AI 驱动的回答\\.

_点击快捷问题或在下方输入：_`,
    piaoShuDesc: `👑 *飘叔分析*

每日加密情报，飘叔独家洞察。进阶/专业会员可查看完整内容。`,
    aiAnalysisDesc: `🧠 *AI 分析中心*

多模型 AI 驱动的加密分析 — 市场分析、价格预测、情绪分析和技术指标。`,
    technicalAnalysisDesc: `📈 *技术分析*

高级图表模式、技术指标、支撑/阻力位和趋势分析。`,
    sentimentDesc: `💚 *市场情绪*

AI 驱动的情绪分析 — 社交情绪、新闻情绪和恐慌贪婪指数。`,
    predictionsDesc: `🔮 *增强预测*

AI 驱动的价格预测，带置信度评分，涵盖短、中、长期时间范围。`,
    marketAnalysisDesc: `📊 *市场分析*

综合 AI 驱动的市场分析，趋势方向、支撑/阻力和风险级别。`,
    macroDesc: `🏛 *宏观经济*

影响加密市场的全球经济指标 — DXY、CPI、黄金、标普500、VIX、联邦利率等。`,
    correlationsDesc: `🔗 *跨资产相关性*

主要资产相关性热力图 — BTC、ETH、黄金、标普500、DXY 等。`,
    microstructureDesc: `🔬 *市场微观结构*

订单簿深度、买卖价差和主要交易对的流动性指标。`,
    trendingDesc: `🔥 *热门趋势*

当前加密市场热门 — 涨幅榜、跌幅榜、高成交量币种。`,
    accuracyDesc: `🎯 *预测准确率*

追踪和验证 AI 预测表现。`,
    batchDesc: `📑 *批量分析*

同时分析多个币种。`,
    nftDesc: `🖼 *NFT*

发现、收藏和交易 AI 驱动的独特数字资产。即将上线！`,
    membershipDesc: `👑 *会员方案*

🔓 *免费* — 基础行情数据, 每天5次AI对话, 有限新闻
⭐ *进阶* — $29/月 — 飘叔研报, 每天100次AI对话, 高级分析
💎 *专业* — $99/月 — 无限AI对话, 实时提醒, API访问

💳 支持 USD 或 USDC 支付

👉 访问 [driftcrypto\\.fun](https://driftcrypto.fun) 升级！`,
    priceNotFound: "❌ 未找到该币种。试试：/price bitcoin, /price ethereum, /price solana",
    aiThinking: "🤔 思考中...",
    aiDisclaimer: "\n\n_⚠️ AI 生成内容仅供参考，不构成投资建议_",
    fearGreed: "恐慌贪婪指数",
    extremeFear: "极度恐慌",
    fear: "恐慌",
    neutral: "中性",
    greed: "贪婪",
    extremeGreed: "极度贪婪",
  },
} as const;

type LangKey = "en" | "zh";

// ---------------------------------------------------------------------------
// Helper: fetch from Next.js API
// ---------------------------------------------------------------------------
async function fetchAPI<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: format numbers
// ---------------------------------------------------------------------------
function fmtUSD(n: number): string {
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(8)}`;
}

function fmtLargeNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtChange(c: number | null): string {
  if (c === null) return "—";
  const sign = c >= 0 ? "+" : "";
  return `${sign}${c.toFixed(2)}%`;
}

function changeEmoji(c: number | null): string {
  if (c === null) return "➖";
  return c >= 0 ? "🟢" : "🔴";
}

function fgEmoji(val: number): string {
  if (val <= 20) return "😱";
  if (val <= 40) return "😰";
  if (val <= 60) return "😐";
  if (val <= 80) return "🤑";
  return "🚀";
}

function fgLabel(label: string, lang: LangKey): string {
  const t = i18n[lang];
  const map: Record<string, string> = {
    "Extreme Fear": t.extremeFear,
    "Fear": t.fear,
    "Neutral": t.neutral,
    "Greed": t.greed,
    "Extreme Greed": t.extremeGreed,
  };
  return map[label] ?? label;
}

// ---------------------------------------------------------------------------
// Escape MarkdownV2 special characters
// ---------------------------------------------------------------------------
function escapeMD(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\./g, "\\.")
    .replace(/\-/g, "\\-")
    .replace(/\+/g, "\\+")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\~/g, "\\~")
    .replace(/\`/g, "\\`")
    .replace(/\>/g, "\\>")
    .replace(/\#/g, "\\#")
    .replace(/\!/g, "\\!")
    .replace(/\|/g, "\\|");
}

// ---------------------------------------------------------------------------
// Keyboards
// ---------------------------------------------------------------------------
function mainKeyboard(lang: LangKey): InlineKeyboard {
  const t = i18n[lang];
  return new InlineKeyboard()
    .text(t.dashboard, "nav:dashboard").text(t.market, "nav:market")
    .row()
    .text(t.portfolio, "nav:portfolio").text(t.screener, "nav:screener")
    .row()
    .text(t.aiChat, "nav:ai-chat").text(t.piaoShu, "nav:piao-shu")
    .row()
    .text(t.moreSections, "nav:more")
    .row()
    .text(t.langSwitch, "nav:lang");
}

function moreKeyboard(lang: LangKey): InlineKeyboard {
  const t = i18n[lang];
  return new InlineKeyboard()
    .text(t.aiAnalysis, "nav:ai-analysis").text(t.technicalAnalysis, "nav:technical-analysis")
    .row()
    .text(t.sentiment, "nav:sentiment").text(t.predictions, "nav:predictions")
    .row()
    .text(t.marketAnalysis, "nav:market-analysis").text(t.macroEconomics, "nav:macro-economics")
    .row()
    .text(t.correlations, "nav:correlations").text(t.microstructure, "nav:microstructure")
    .row()
    .text(t.trending, "nav:trending").text(t.predictionAccuracy, "nav:prediction-accuracy")
    .row()
    .text(t.batchAnalysis, "nav:batch-analysis").text(t.nft, "nav:nft")
    .row()
    .text(t.membership, "nav:membership")
    .row()
    .text(t.backToMain, "nav:back");
}

// ---------------------------------------------------------------------------
// /start command
// ---------------------------------------------------------------------------
bot.command("start", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  await ctx.reply(i18n[lang].welcome, {
    parse_mode: "MarkdownV2",
    reply_markup: mainKeyboard(lang),
    disable_web_page_preview: true,
  });
});

// ---------------------------------------------------------------------------
// /help command
// ---------------------------------------------------------------------------
bot.command("help", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  await ctx.reply(i18n[lang].helpText, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
  });
});

// ---------------------------------------------------------------------------
// /lang command
// ---------------------------------------------------------------------------
bot.command("lang", async (ctx) => {
  const current = getLang(ctx.chat.id);
  const newLang: LangKey = current === "en" ? "zh" : "en";
  setLang(ctx.chat.id, newLang);
  await ctx.reply(i18n[newLang].langChanged, {
    parse_mode: "MarkdownV2",
    reply_markup: mainKeyboard(newLang),
  });
});

// ---------------------------------------------------------------------------
// /price command — quick price lookup
// ---------------------------------------------------------------------------
bot.command("price", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  const coin = ctx.match?.trim().toLowerCase();
  if (!coin) {
    await ctx.reply(lang === "zh"
      ? "用法：/price <币种名>  (如 /price bitcoin, /price eth)"
      : "Usage: /price <coin>  (e.g. /price bitcoin, /price eth)");
    return;
  }

  const msg = await ctx.reply(i18n[lang].loading);
  const data = await fetchAPI<PricesResponse>("/api/prices");

  if (!data?.coins) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, i18n[lang].error);
    return;
  }

  const found = data.coins.find(
    (c) => c.coinId === coin || c.symbol.toLowerCase() === coin || c.name.toLowerCase() === coin
  );

  if (!found) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, i18n[lang].priceNotFound);
    return;
  }

  const text = lang === "zh"
    ? `💰 *${escapeMD(found.name)}* \\(${found.symbol.toUpperCase()}\\)\n\n📈 价格：${fmtUSD(found.usdPrice).replace("$", "\\$")}\n📊 24h涨跌：${changeEmoji(found.change24h)} ${fmtChange(found.change24h)}\n💵 24h成交量：${fmtLargeNum(found.volume24h ?? 0).replace("$", "\\$")}\n🏦 市值：${fmtLargeNum(found.marketCap ?? 0).replace("$", "\\$")}\n\n👉 [在 driftcrypto\\.fun 查看](https://driftcrypto.fun#market)`
    : `💰 *${escapeMD(found.name)}* \\(${found.symbol.toUpperCase()}\\)\n\n📈 Price: ${fmtUSD(found.usdPrice).replace("$", "\\$")}\n📊 24h Change: ${changeEmoji(found.change24h)} ${fmtChange(found.change24h)}\n💵 24h Volume: ${fmtLargeNum(found.volume24h ?? 0).replace("$", "\\$")}\n🏦 Market Cap: ${fmtLargeNum(found.marketCap ?? 0).replace("$", "\\$")}\n\n👉 [View on driftcrypto\\.fun](https://driftcrypto.fun#market)`;

  await ctx.api.editMessageText(ctx.chat.id, msg.message_id, text, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: mainKeyboard(lang),
  });
});

// ---------------------------------------------------------------------------
// /news command
// ---------------------------------------------------------------------------
bot.command("news", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  const msg = await ctx.reply(i18n[lang].loading);

  const data = await fetchAPI<NewsResponse>("/api/news?num=8");

  if (!data?.items?.length) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, i18n[lang].noData);
    return;
  }

  const sentimentEmoji: Record<string, string> = {
    bullish: "🟢",
    bearish: "🔴",
    neutral: "⚪",
  };

  let text = lang === "zh" ? "📰 *最新加密新闻*\n\n" : "📰 *Latest Crypto News*\n\n";

  for (const article of data.items.slice(0, 8)) {
    const emoji = sentimentEmoji[article.sentiment] ?? "📰";
    const title = escapeMD(article.title);
    text += `${emoji} [${title}](${article.url})\n`;
  }

  text += lang === "zh"
    ? "\n👉 [更多新闻](https://driftcrypto\\.fun#dashboard)"
    : "\n👉 [More News](https://driftcrypto.fun#dashboard)";

  await ctx.api.editMessageText(ctx.chat.id, msg.message_id, text, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: mainKeyboard(lang),
  });
});

// ---------------------------------------------------------------------------
// /feargreed command
// ---------------------------------------------------------------------------
bot.command("feargreed", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  const msg = await ctx.reply(i18n[lang].loading);

  const data = await fetchAPI<FearGreedResponse>("/api/fear-greed");

  if (!data || data.value === undefined) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, i18n[lang].error);
    return;
  }

  const t = i18n[lang];
  const val = data.value;
  const emoji = fgEmoji(val);
  const label = fgLabel(data.label, lang);

  let text = lang === "zh"
    ? `${emoji} *${t.fearGreed}*\n\n📊 当前指数：*${val}* / 100\n📝 状态：*${label}*\n`
    : `${emoji} *${t.fearGreed}*\n\n📊 Current: *${val}* / 100\n📝 Status: *${label}*\n`;

  if (data.history?.length > 0) {
    text += lang === "zh" ? "\n📅 近期走势：" : "\n📅 Recent trend:";
    for (const h of data.history.slice(0, 7)) {
      const hLabel = fgLabel(h.label, lang);
      const date = h.recordedAt?.slice(5, 10) ?? "—";
      text += `\n  ${date}: ${h.value} (${hLabel})`;
    }
  }

  text += lang === "zh"
    ? "\n\n👉 [在 driftcrypto\\.fun 查看](https://driftcrypto\\.fun#dashboard)"
    : "\n\n👉 [View on driftcrypto\\.fun](https://driftcrypto.fun#dashboard)";

  await ctx.api.editMessageText(ctx.chat.id, msg.message_id, text, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: mainKeyboard(lang),
  });
});

// ---------------------------------------------------------------------------
// /piaoshu command
// ---------------------------------------------------------------------------
bot.command("piaoshu", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  const msg = await ctx.reply(i18n[lang].loading);

  const data = await fetchAPI<PiaoShuDailyResponse>("/api/piao-shu/daily?membership=free");

  if (!data) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, i18n[lang].error);
    return;
  }

  let text = lang === "zh" ? "👑 *飘叔每日分析*\n\n" : "👑 *PiaoShu Daily Analysis*\n\n";

  if (data.title) text += `📅 ${escapeMD(data.title)}\n\n`;
  if (data.overview) {
    text += `📊 ${escapeMD(data.overview.slice(0, 500))}${data.overview.length > 500 ? "..." : ""}\n\n`;
  }
  if (data.gainers?.length) {
    text += lang === "zh" ? "🟢 涨幅榜：\n" : "🟢 Top Gainers:\n";
    for (const g of data.gainers.slice(0, 5)) {
      text += `  ${g.symbol.toUpperCase()}: ${fmtChange(g.change24h)}\n`;
    }
    text += "\n";
  }
  if (data.losers?.length) {
    text += lang === "zh" ? "🔴 跌幅榜：\n" : "🔴 Top Losers:\n";
    for (const l of data.losers.slice(0, 5)) {
      text += `  ${l.symbol.toUpperCase()}: ${fmtChange(l.change24h)}\n`;
    }
    text += "\n";
  }
  if (data.minMembership && data.minMembership !== "free") {
    text += lang === "zh"
      ? "🔒 完整飘叔分析内容需进阶或专业会员\n\n👉 [升级会员](https://driftcrypto\\.fun#membership)"
      : "🔒 Full PiaoShu analysis requires Plus or Pro membership\n\n👉 [Upgrade](https://driftcrypto.fun#membership)";
  }

  await ctx.api.editMessageText(ctx.chat.id, msg.message_id, text, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
    reply_markup: mainKeyboard(lang),
  });
});

// ---------------------------------------------------------------------------
// Callback query handler — navigation
// ---------------------------------------------------------------------------
bot.callbackQuery(/^nav:(.+)$/, async (ctx) => {
  const section = ctx.match![1];
  const lang = getLang(ctx.chat.id);
  const t = i18n[lang];

  // Handle special navigation
  if (section === "more") {
    await ctx.editMessageText(
      lang === "zh"
        ? "📚 *更多栏目*\n\n选择一个栏目查看详情："
        : "📚 *More Sections*\n\nSelect a section to explore:",
      { parse_mode: "MarkdownV2", reply_markup: moreKeyboard(lang), disable_web_page_preview: true }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  if (section === "back") {
    await ctx.editMessageText(t.welcome, {
      parse_mode: "MarkdownV2",
      reply_markup: mainKeyboard(lang),
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (section === "lang") {
    const newLang: LangKey = lang === "en" ? "zh" : "en";
    setLang(ctx.chat.id, newLang);
    await ctx.editMessageText(i18n[newLang].langChanged, {
      parse_mode: "MarkdownV2",
      reply_markup: mainKeyboard(newLang),
    });
    await ctx.answerCallbackQuery();
    return;
  }

  // Section data fetching
  await handleSectionCallback(ctx, section, lang);
});

// ---------------------------------------------------------------------------
// Handle section callbacks with data
// ---------------------------------------------------------------------------
async function handleSectionCallback(ctx: any, section: string, lang: LangKey) {
  const t = i18n[lang];

  // ── Dashboard ────────────────────────────────────────────────────────
  if (section === "dashboard") {
    await ctx.answerCallbackQuery({ text: t.loading });
    const [pricesData, fearData, digestData] = await Promise.all([
      fetchAPI<PricesResponse>("/api/prices"),
      fetchAPI<FearGreedResponse>("/api/fear-greed"),
      fetchAPI<AIDigestResponse>("/api/ai/digest"),
    ]);

    let text = t.dashboardDesc + "\n\n";

    if (pricesData?.global) {
      const g = pricesData.global;
      text += lang === "zh"
        ? `🌐 总市值：${fmtLargeNum(g.totalMarketCap).replace("$", "\\$")}\n📊 24h变化：${fmtChange(g.marketCapChange24h)}\n💵 24h成交量：${fmtLargeNum(g.totalVolume).replace("$", "\\$")}\n🔢 活跃币种：${g.activeCryptos}\n\n`
        : `🌐 Total MCap: ${fmtLargeNum(g.totalMarketCap).replace("$", "\\$")}\n📊 24h Change: ${fmtChange(g.marketCapChange24h)}\n💵 24h Volume: ${fmtLargeNum(g.totalVolume).replace("$", "\\$")}\n🔢 Active Cryptos: ${g.activeCryptos}\n\n`;
    }

    if (pricesData?.coins?.length) {
      const top5 = pricesData.coins.slice(0, 5);
      text += lang === "zh" ? "🏆 市值前5：\n" : "🏆 Top 5 by MCap:\n";
      for (const c of top5) {
        text += `  ${changeEmoji(c.change24h)} ${c.symbol.toUpperCase()}: ${fmtUSD(c.usdPrice).replace("$", "\\$")} (${fmtChange(c.change24h)})\n`;
      }
      text += "\n";
    }

    if (fearData && fearData.value !== undefined) {
      text += `${fgEmoji(fearData.value)} ${t.fearGreed}: ${fearData.value}/100 (${fgLabel(fearData.label, lang)})\n\n`;
    }

    if (digestData?.digest) {
      const preview = digestData.digest.slice(0, 400);
      text += `📝 ${lang === "zh" ? "AI 每日点评" : "AI Daily Digest"}:\n${escapeMD(preview)}${digestData.digest.length > 400 ? "..." : ""}\n`;
    }

    text += lang === "zh"
      ? "\n👉 [在 driftcrypto\\.fun 查看完整仪表盘](https://driftcrypto\\.fun#dashboard)"
      : "\n👉 [View full dashboard](https://driftcrypto.fun#dashboard)";

    try {
      await ctx.editMessageText(text, {
        parse_mode: "MarkdownV2",
        reply_markup: mainKeyboard(lang),
        disable_web_page_preview: true,
      });
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  // ── Market ────────────────────────────────────────────────────────────
  if (section === "market") {
    await ctx.answerCallbackQuery({ text: t.loading });
    const data = await fetchAPI<PricesResponse>("/api/prices");

    let text = t.marketDesc + "\n\n";

    if (data?.global) {
      const g = data.global;
      text += lang === "zh"
        ? `🌐 总市值：${fmtLargeNum(g.totalMarketCap).replace("$", "\\$")} (${fmtChange(g.marketCapChange24h)})\n💵 24h成交量：${fmtLargeNum(g.totalVolume).replace("$", "\\$")}\n\n`
        : `🌐 Total MCap: ${fmtLargeNum(g.totalMarketCap).replace("$", "\\$")} (${fmtChange(g.marketCapChange24h)})\n💵 24h Volume: ${fmtLargeNum(g.totalVolume).replace("$", "\\$")}\n\n`;
    }

    if (data?.coins?.length) {
      text += lang === "zh" ? "🏆 市值前15：\n" : "🏆 Top 15 by MCap:\n";
      for (const c of data.coins.slice(0, 15)) {
        text += `${changeEmoji(c.change24h)} ${c.symbol.toUpperCase().padEnd(7)} ${fmtUSD(c.usdPrice).replace("$", "\\$")} (${fmtChange(c.change24h)})\n`;
      }
    }

    text += lang === "zh"
      ? "\n👉 [在 driftcrypto\\.fun 查看完整行情](https://driftcrypto\\.fun#market)"
      : "\n👉 [View full market](https://driftcrypto.fun#market)";

    try {
      await ctx.editMessageText(text, {
        parse_mode: "MarkdownV2",
        reply_markup: mainKeyboard(lang),
        disable_web_page_preview: true,
      });
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  // ── AI Chat ────────────────────────────────────────────────────────────
  if (section === "ai-chat") {
    await ctx.editMessageText(t.aiChatDesc, {
      parse_mode: "MarkdownV2",
      reply_markup: new InlineKeyboard()
        .text(lang === "zh" ? "💡 BTC前景" : "💡 BTC outlook?", "quick:btc")
        .text(lang === "zh" ? "📊 市场趋势" : "📊 Market trend", "quick:market")
        .row()
        .text(lang === "zh" ? "🔥 山寨币" : "🔥 Top altcoins", "quick:altcoins")
        .text(lang === "zh" ? "💚 市场情绪" : "💚 Sentiment", "quick:sentiment")
        .row()
        .text(t.mainMenu, "nav:back"),
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  // ── PiaoShu ────────────────────────────────────────────────────────────
  if (section === "piao-shu") {
    await ctx.answerCallbackQuery({ text: t.loading });
    const data = await fetchAPI<PiaoShuDailyResponse>("/api/piao-shu/daily?membership=free");

    let text = t.piaoShuDesc + "\n\n";

    if (data?.title) text += `📅 ${escapeMD(data.title)}\n\n`;
    if (data?.overview) {
      text += `📊 ${escapeMD(data.overview.slice(0, 400))}${data.overview.length > 400 ? "..." : ""}\n\n`;
    }
    if (data?.gainers?.length) {
      text += lang === "zh" ? "🟢 涨幅榜：\n" : "🟢 Top Gainers:\n";
      for (const g of data.gainers.slice(0, 5)) {
        text += `  ${g.symbol.toUpperCase()}: ${fmtChange(g.change24h)}\n`;
      }
      text += "\n";
    }
    if (data?.losers?.length) {
      text += lang === "zh" ? "🔴 跌幅榜：\n" : "🔴 Top Losers:\n";
      for (const l of data.losers.slice(0, 5)) {
        text += `  ${l.symbol.toUpperCase()}: ${fmtChange(l.change24h)}\n`;
      }
      text += "\n";
    }
    if (data?.minMembership && data.minMembership !== "free") {
      text += lang === "zh"
        ? "🔒 完整内容需升级会员\n\n"
        : "🔒 Full content requires membership upgrade\n\n";
    }
    text += lang === "zh"
      ? "👉 [查看完整飘叔分析](https://driftcrypto\\.fun#piao\\-shu)"
      : "👉 [View full PiaoShu analysis](https://driftcrypto.fun#piao-shu)";

    try {
      await ctx.editMessageText(text, {
        parse_mode: "MarkdownV2",
        reply_markup: mainKeyboard(lang),
        disable_web_page_preview: true,
      });
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  // ── Sentiment ──────────────────────────────────────────────────────────
  if (section === "sentiment") {
    await ctx.answerCallbackQuery({ text: t.loading });
    const fearData = await fetchAPI<FearGreedResponse>("/api/fear-greed");

    let text = t.sentimentDesc + "\n\n";

    if (fearData && fearData.value !== undefined) {
      text += `${fgEmoji(fearData.value)} ${t.fearGreed}: ${fearData.value}/100 (${fgLabel(fearData.label, lang)})\n\n`;
    }

    text += lang === "zh"
      ? "📱 社交情绪：查看 Twitter/Reddit 实时讨论\n📰 新闻情绪：AI 分析新闻多空倾向\n\n👉 [在 driftcrypto\\.fun 查看完整情绪分析](https://driftcrypto\\.fun#sentiment)"
      : "📱 Social: Real\\-time Twitter/Reddit discussion\n📰 News: AI\\-powered sentiment analysis\n\n👉 [View full sentiment](https://driftcrypto.fun#sentiment)";

    try {
      await ctx.editMessageText(text, {
        parse_mode: "MarkdownV2",
        reply_markup: moreKeyboard(lang),
        disable_web_page_preview: true,
      });
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  // ── Macro Economics ────────────────────────────────────────────────────
  if (section === "macro-economics") {
    await ctx.answerCallbackQuery({ text: t.loading });
    let text = t.macroDesc + "\n\n";

    text += lang === "zh"
      ? `💵 美元指数 \\(DXY\\): 104\\.2\n📈 通胀率 \\(CPI\\): 3\\.4%\n🥇 黄金: $2,340\n📊 标普500: 5,320\n😱 VIX: 13\\.8\n🏦 联邦利率: 5\\.25%\n📜 10年期国债: 4\\.45%\n\n👉 [在 driftcrypto\\.fun 查看宏观数据](https://driftcrypto\\.fun#macro\\-economics)`
      : `💵 DXY: 104\\.2\n📈 CPI: 3\\.4%\n🥇 Gold: $2,340\n📊 S\\&P 500: 5,320\n😱 VIX: 13\\.8\n🏦 Fed Rate: 5\\.25%\n📜 10Y Treasury: 4\\.45%\n\n👉 [View macro data](https://driftcrypto.fun#macro-economics)`;

    try {
      await ctx.editMessageText(text, {
        parse_mode: "MarkdownV2",
        reply_markup: moreKeyboard(lang),
        disable_web_page_preview: true,
      });
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  // ── Membership ──────────────────────────────────────────────────────────
  if (section === "membership") {
    let text = t.membershipDesc;

    try {
      await ctx.editMessageText(text, {
        parse_mode: "MarkdownV2",
        reply_markup: moreKeyboard(lang),
        disable_web_page_preview: true,
      });
    } catch {}
    await ctx.answerCallbackQuery();
    return;
  }

  // ── Generic sections (descriptions only) ───────────────────────────────
  const sectionDescMap: Record<string, string> = {
    "portfolio": t.portfolioDesc,
    "screener": t.screenerDesc,
    "ai-analysis": t.aiAnalysisDesc,
    "technical-analysis": t.technicalAnalysisDesc,
    "predictions": t.predictionsDesc,
    "market-analysis": t.marketAnalysisDesc,
    "correlations": t.correlationsDesc,
    "microstructure": t.microstructureDesc,
    "trending": t.trendingDesc,
    "prediction-accuracy": t.accuracyDesc,
    "batch-analysis": t.batchDesc,
    "nft": t.nftDesc,
  };

  const desc = sectionDescMap[section];
  if (desc) {
    const link = lang === "zh"
      ? `\n\n👉 [在 driftcrypto\\.fun 查看](https://driftcrypto\\.fun#${section})`
      : `\n\n👉 [View on driftcrypto\\.fun](https://driftcrypto.fun#${section})`;

    try {
      await ctx.editMessageText(desc + link, {
        parse_mode: "MarkdownV2",
        reply_markup: moreKeyboard(lang),
        disable_web_page_preview: true,
      });
    } catch {}
  }

  await ctx.answerCallbackQuery();
}

// ---------------------------------------------------------------------------
// Quick AI chat callback queries
// ---------------------------------------------------------------------------
bot.callbackQuery(/^quick:(.+)$/, async (ctx) => {
  const topic = ctx.match![1];
  const lang = getLang(ctx.chat.id);
  const t = i18n[lang];

  const queries: Record<string, string> = {
    btc: lang === "zh" ? "比特币前景如何？" : "What's the Bitcoin outlook?",
    market: lang === "zh" ? "分析当前市场趋势" : "Analyze the current market trend",
    altcoins: lang === "zh" ? "值得关注的山寨币" : "Top altcoins to watch",
    sentiment: lang === "zh" ? "今天的市场情绪如何？" : "What is market sentiment today?",
  };

  const query = queries[topic] ?? queries.btc;

  await ctx.answerCallbackQuery({ text: t.aiThinking });

  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query, history: [], locale: lang }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error("API error");
    const data = await res.json() as AIChatResponse;

    const answer = data.response?.slice(0, 3500) ?? t.error;
    const text = `🤖 *AI ${lang === "zh" ? "回答" : "Response"}*\n\n${escapeMD(answer)}${t.aiDisclaimer}\n\n👉 [在 driftcrypto\\.fun 继续聊天](https://driftcrypto\\.fun#ai\\-chat)`;

    try {
      await ctx.editMessageText(text, {
        parse_mode: "MarkdownV2",
        reply_markup: new InlineKeyboard()
          .text(lang === "zh" ? "💡 再问一个" : "💡 Ask another", "nav:ai-chat")
          .text(t.mainMenu, "nav:back"),
        disable_web_page_preview: true,
      });
    } catch {}
  } catch {
    try {
      await ctx.editMessageText(t.error, {
        parse_mode: "MarkdownV2",
        reply_markup: mainKeyboard(lang),
      });
    } catch {}
  }
});

// ---------------------------------------------------------------------------
// Free-form AI chat (non-command messages)
// ---------------------------------------------------------------------------
bot.on("message:text", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  const t = i18n[lang];
  const text = ctx.message.text;

  // Ignore very short messages or commands
  if (text.length < 2 || text.startsWith("/")) return;

  const msg = await ctx.reply(t.aiThinking);

  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: [], locale: lang }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error("API error");
    const data = await res.json() as AIChatResponse;

    const answer = data.response?.slice(0, 3500) ?? t.error;
    const replyText = `🤖 ${escapeMD(answer)}${t.aiDisclaimer}`;

    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, replyText, {
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
      reply_markup: mainKeyboard(lang),
    });
  } catch {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, t.error, {
      reply_markup: mainKeyboard(lang),
    });
  }
});

// ---------------------------------------------------------------------------
// Health check HTTP server (port 3002)
// ---------------------------------------------------------------------------
const server = Bun.serve({
  port: BOT_PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return Response.json({
        status: "ok",
        service: "driftcrypto-telegram-bot",
        bot: "@DriftcryptoBot",
        url: "https://t.me/DriftcryptoBot",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🏥 Health check server running on port ${BOT_PORT}`);

// ---------------------------------------------------------------------------
// Error handling — prevent crashes
// ---------------------------------------------------------------------------
bot.catch((err) => {
  console.error("❌ Bot error:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled rejection:", reason);
});

// Keepalive timer — prevent bun from exiting when event loop appears empty
setInterval(() => {
  // This keeps the bun process alive between polling cycles
}, 30000);

// ---------------------------------------------------------------------------
// Start bot
// ---------------------------------------------------------------------------
console.log("🚀 driftcrypto.fun Telegram Bot starting...");

bot.start({
  onStart: (info) => {
    console.log(`🤖 Bot @${info.username} started successfully!`);
    console.log(`🔗 t.me/${info.username}`);
    console.log(`📡 Polling for updates...`);
  },
});
