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
  return userLangs.get(chatId) ?? "zh";
}

function setLang(chatId: number, lang: "en" | "zh") {
  userLangs.set(chatId, lang);
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------
interface PricesResponse {
  coins: Array<{
    coinId: string; symbol: string; name: string; usdPrice: number;
    change24h: number | null; volume24h: number | null; marketCap: number | null;
    imageUrl: string | null;
  }>;
  global: { totalMarketCap: number; totalVolume: number; activeCryptos: number; marketCapChange24h: number; };
}

interface FearGreedResponse {
  value: number; label: string; updatedAt: string;
  history: Array<{ value: number; label: string; recordedAt: string }>;
}

interface NewsResponse {
  items: Array<{
    id: string; title: string; url: string; snippet: string;
    source: string; sentiment: string; publishedAt: string; favicon: string;
  }>;
  total: number; hasMore: boolean;
}

interface AIDigestResponse { digest: string; generatedAt?: string; }
interface AIChatResponse { message?: string; response?: string; }

interface PiaoShuDailyResponse {
  title?: string; overview?: string; piaoshuCommentary?: string;
  gainers?: Array<{ name: string; symbol: string; change24h: number }>;
  losers?: Array<{ name: string; symbol: string; change24h: number }>;
  opportunityAnalysis?: string;
  fundingRadar?: Array<{ name: string; description: string }>;
  airdropRadar?: Array<{ name: string; description: string }>;
  minMembership?: string; hasReport?: boolean; reportDate?: string;
  marketOverview?: {
    btcDominance: number; ethDominance: number; totalMarketCap: string;
    totalVolume: string; marketCapChange24h: number; activeCryptos: number;
  };
}

// ---------------------------------------------------------------------------
// Escape MarkdownV2 special characters
// ---------------------------------------------------------------------------
function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\-/g, "\\-")
    .replace(/\+/g, "\\+").replace(/\*/g, "\\*").replace(/_/g, "\\_")
    .replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
    .replace(/\~/g, "\\~").replace(/\`/g, "\\`").replace(/\>/g, "\\>")
    .replace(/\#/g, "\\#").replace(/\!/g, "\\!").replace(/\|/g, "\\|");
}

// ---------------------------------------------------------------------------
// Format helpers (all return MarkdownV2-safe strings)
// ---------------------------------------------------------------------------
function fmtUSD(n: number): string {
  if (n >= 1) return esc(`$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (n >= 0.01) return esc(`$${n.toFixed(4)}`);
  if (n >= 0.0001) return esc(`$${n.toFixed(6)}`);
  return esc(`$${n.toFixed(8)}`);
}

function fmtLarge(n: number): string {
  if (n >= 1e12) return esc(`$${(n / 1e12).toFixed(2)}T`);
  if (n >= 1e9) return esc(`$${(n / 1e9).toFixed(2)}B`);
  if (n >= 1e6) return esc(`$${(n / 1e6).toFixed(2)}M`);
  return esc(`$${n.toLocaleString()}`);
}

function fmtChg(c: number | null): string {
  if (c === null) return "—";
  return esc(`${c >= 0 ? "+" : ""}${c.toFixed(2)}%`);
}

// Escape a number for MarkdownV2
function escNum(n: number): string { return esc(String(n)); }

function chgEmoji(c: number | null): string {
  if (c === null) return "➖";
  return c >= 0 ? "🟢" : "🔴";
}

function fgEmoji(v: number): string {
  if (v <= 20) return "😱"; if (v <= 40) return "😰"; if (v <= 60) return "😐";
  if (v <= 80) return "🤑"; return "🚀";
}

// ---------------------------------------------------------------------------
// Safe editMessage — falls back to plain text if MarkdownV2 fails
// ---------------------------------------------------------------------------
async function safeEdit(ctx: any, text: string, kb: InlineKeyboard) {
  try {
    await ctx.editMessageText(text, { parse_mode: "MarkdownV2", reply_markup: kb, disable_web_page_preview: true });
  } catch (e: any) {
    if (e?.description?.includes("parse entities")) {
      const plain = text.replace(/\\([.*_\-+{}[\]()~`>#!|])/g, "$1");
      try { await ctx.editMessageText(plain, { reply_markup: kb, disable_web_page_preview: true }); } catch {}
    } else console.error("editMessage error:", e);
  }
}

async function safeApiEdit(chatId: number, msgId: number, text: string, kb: InlineKeyboard) {
  try {
    await bot.api.editMessageText(chatId, msgId, text, { parse_mode: "MarkdownV2", reply_markup: kb, disable_web_page_preview: true });
  } catch (e: any) {
    if (e?.description?.includes("parse entities")) {
      const plain = text.replace(/\\([.*_\-+{}[\]()~`>#!|])/g, "$1");
      try { await bot.api.editMessageText(chatId, msgId, plain, { reply_markup: kb, disable_web_page_preview: true }); } catch {}
    } else console.error("api editMessage error:", e);
  }
}

// ---------------------------------------------------------------------------
// Translations (pre-escaped for MarkdownV2)
// ---------------------------------------------------------------------------
const t = {
  en: {
    welcome: `🌐 *Welcome to driftcrypto\\.fun\\!*\n\nAI\\-Powered Cryptocurrency Intelligence Platform\\. Get real\\-time prices, AI analysis, PiaoShu daily reports, and more\\.\n\nSelect a section below to explore:`,
    mainMenu: "🏠 Main Menu", more: "📚 More", back: "⬅️ Back",
    dashboard: "📊 Dashboard", market: "📈 Market", portfolio: "💼 Portfolio",
    screener: "🔍 Screener", aiChat: "🤖 AI Chat", piaoShu: "👑 PiaoShu",
    aiAnalysis: "🧠 AI Analysis", techAnalysis: "📈 Tech Analysis",
    sentiment: "💚 Sentiment", predictions: "🔮 Predictions",
    marketAnalysis: "📊 Market Analysis", macro: "🏛 Macro",
    correlations: "🔗 Correlations", microstructure: "🔬 Microstructure",
    trending: "🔥 Trending", accuracy: "🎯 Accuracy",
    batchAnalysis: "📑 Batch", nft: "🖼 NFT", membership: "👑 Membership",
    langSwitch: "🌐 EN/中文", langChanged: "✅ Language switched to English\\!",
    loading: "⏳ Loading...", error: "❌ Failed to load data\\. Please try again later\\.",
    noData: "📭 No data available at the moment\\.",
    helpText: `*driftcrypto\\.fun Bot Commands*\n\n/start \\- Show main menu\n/help \\- Show this help\n/lang \\- Switch language \\(EN/中文\\)\n/price \\<coin\\> \\- Quick price lookup \\(e\\.g\\. /price bitcoin\\)\n/news \\- Latest crypto news\n/feargreed \\- Fear & Greed Index\n/piaoshu \\- PiaoShu daily analysis\n\n*Navigation:* Use inline buttons to explore all sections\\!`,
    dashboardDesc: `📊 *Dashboard*\n\nYour crypto command center — live market overview, top movers, Fear & Greed Index, AI daily digest, and breaking news\\.`,
    marketDesc: `📈 *Market*\n\nFull market data — top 100 coins by market cap, 24h price changes, volume, and TradingView charts\\.`,
    aiChatDesc: `🤖 *AI Chat*\n\nAsk anything about crypto\\! Send your question directly in chat, and I'll get an AI\\-powered response\\.\n\n_Tap a quick question or type below:_`,
    piaoShuDesc: `👑 *PiaoShu Analysis*\n\nDaily crypto intelligence with exclusive insights from PiaoShu\\. Premium content for Plus/Pro members\\.`,
    fearGreed: "Fear & Greed Index", extremeFear: "Extreme Fear", fear: "Fear",
    neutral: "Neutral", greed: "Greed", extremeGreed: "Extreme Greed",
    aiDisclaimer: "\n\n_⚠️ AI\\-generated content for reference only\\. Not financial advice\\._",
    priceNotFound: "❌ Coin not found\\. Try: /price bitcoin, /price ethereum, /price solana",
  },
  zh: {
    welcome: `🌐 *欢迎来到 driftcrypto\\.fun\\！*\n\nAI 驱动的加密货币智能平台\\. 实时行情、AI 分析、飘叔每日研报等您探索\\.\n\n请选择下方栏目开始：`,
    mainMenu: "🏠 主菜单", more: "📚 更多", back: "⬅️ 返回",
    dashboard: "📊 仪表盘", market: "📈 行情", portfolio: "💼 投资组合",
    screener: "🔍 筛选器", aiChat: "🤖 AI 聊天", piaoShu: "👑 飘叔分析",
    aiAnalysis: "🧠 AI 分析", techAnalysis: "📈 技术分析",
    sentiment: "💚 情绪指标", predictions: "🔮 增强预测",
    marketAnalysis: "📊 市场分析", macro: "🏛 宏观经济",
    correlations: "🔗 相关性", microstructure: "🔬 微观结构",
    trending: "🔥 热门", accuracy: "🎯 准确率",
    batchAnalysis: "📑 批量", nft: "🖼 NFT", membership: "👑 会员",
    langSwitch: "🌐 中文/EN", langChanged: "✅ 已切换为中文！",
    loading: "⏳ 加载中...", error: "❌ 数据加载失败，请稍后重试。",
    noData: "📭 暂无数据。",
    helpText: `*driftcrypto\\.fun 机器人命令*\n\n/start \\- 显示主菜单\n/help \\- 显示帮助\n/lang \\- 切换语言 \\(EN/中文\\)\n/price \\<币种\\> \\- 快速查价 \\(如 /price bitcoin\\)\n/news \\- 最新加密新闻\n/feargreed \\- 恐慌贪婪指数\n/piaoshu \\- 飘叔每日分析\n\n*导航：* 使用内联按钮浏览所有栏目\\！`,
    dashboardDesc: `📊 *仪表盘*\n\n加密指挥中心 — 实时行情概览、涨跌排行、恐慌贪婪指数、AI 每日点评和最新资讯。`,
    marketDesc: `📈 *行情*\n\n完整市场数据 — 按市值排名前100币种、24h 价格变动、成交量和 TradingView 图表。`,
    aiChatDesc: `🤖 *AI 聊天*\n\n关于加密货币的任何问题\\！直接在聊天中发送您的问题，我会给出 AI 驱动的回答\\.\n\n_点击快捷问题或在下方输入：_`,
    piaoShuDesc: `👑 *飘叔分析*\n\n每日加密情报，飘叔独家洞察。进阶/专业会员可查看完整内容。`,
    fearGreed: "恐慌贪婪指数", extremeFear: "极度恐慌", fear: "恐慌",
    neutral: "中性", greed: "贪婪", extremeGreed: "极度贪婪",
    aiDisclaimer: "\n\n_⚠️ AI 生成内容仅供参考，不构成投资建议_",
    priceNotFound: "❌ 未找到该币种。试试：/price bitcoin, /price ethereum, /price solana",
  },
} as const;

type L = "en" | "zh";

function fgLabel(label: string, lang: L): string {
  const map: Record<string, string> = {
    "Extreme Fear": t[lang].extremeFear, "Fear": t[lang].fear,
    "Neutral": t[lang].neutral, "Greed": t[lang].greed,
    "Extreme Greed": t[lang].extremeGreed,
  };
  return map[label] ?? label;
}

// ---------------------------------------------------------------------------
// API fetch helper
// ---------------------------------------------------------------------------
async function api<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) { console.error(`API ${path}: ${r.status}`); return null; }
    return await r.json() as T;
  } catch (e) { console.error(`API ${path} error:`, e); return null; }
}

function aiText(d: AIChatResponse): string | null { return d.message ?? d.response ?? null; }

// ---------------------------------------------------------------------------
// Keyboards
// ---------------------------------------------------------------------------
function mainKB(l: L): InlineKeyboard {
  const s = t[l];
  return new InlineKeyboard()
    .text(s.dashboard, "nav:dashboard").text(s.market, "nav:market").row()
    .text(s.portfolio, "nav:portfolio").text(s.screener, "nav:screener").row()
    .text(s.aiChat, "nav:ai-chat").text(s.piaoShu, "nav:piao-shu").row()
    .text(s.more, "nav:more").row()
    .text(s.langSwitch, "nav:lang");
}

function moreKB(l: L): InlineKeyboard {
  const s = t[l];
  return new InlineKeyboard()
    .text(s.aiAnalysis, "nav:ai-analysis").text(s.techAnalysis, "nav:technical-analysis").row()
    .text(s.sentiment, "nav:sentiment").text(s.predictions, "nav:predictions").row()
    .text(s.marketAnalysis, "nav:market-analysis").text(s.macro, "nav:macro-economics").row()
    .text(s.correlations, "nav:correlations").text(s.microstructure, "nav:microstructure").row()
    .text(s.trending, "nav:trending").text(s.accuracy, "nav:prediction-accuracy").row()
    .text(s.batchAnalysis, "nav:batch-analysis").text(s.nft, "nav:nft").row()
    .text(s.membership, "nav:membership").row()
    .text(s.back, "nav:back");
}

// ===========================================================================
// COMMANDS
// ===========================================================================

bot.command("start", async (ctx) => {
  const l = getLang(ctx.chat.id);
  await ctx.reply(t[l].welcome, { parse_mode: "MarkdownV2", reply_markup: mainKB(l), disable_web_page_preview: true });
});

bot.command("help", async (ctx) => {
  const l = getLang(ctx.chat.id);
  await ctx.reply(t[l].helpText, { parse_mode: "MarkdownV2", disable_web_page_preview: true });
});

bot.command("lang", async (ctx) => {
  const cur = getLang(ctx.chat.id);
  const nl: L = cur === "en" ? "zh" : "en";
  setLang(ctx.chat.id, nl);
  await ctx.reply(t[nl].langChanged, { parse_mode: "MarkdownV2", reply_markup: mainKB(nl) });
});

// ---------------------------------------------------------------------------
// /price <coin>
// ---------------------------------------------------------------------------
bot.command("price", async (ctx) => {
  const l = getLang(ctx.chat.id);
  const coin = ctx.match?.trim().toLowerCase();
  if (!coin) {
    await ctx.reply(l === "zh" ? "用法：/price <币种>" : "Usage: /price <coin>");
    return;
  }
  const msg = await ctx.reply(t[l].loading);
  const data = await api<PricesResponse>("/api/prices");
  if (!data?.coins) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, t[l].error, { parse_mode: "MarkdownV2" });
    return;
  }
  const found = data.coins.find(c => c.coinId === coin || c.symbol.toLowerCase() === coin || c.name.toLowerCase() === coin);
  if (!found) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, t[l].priceNotFound, { parse_mode: "MarkdownV2" });
    return;
  }
  const text = l === "zh"
    ? `💰 *${esc(found.name)}* \\(${esc(found.symbol.toUpperCase())}\\)\n\n📈 价格：${fmtUSD(found.usdPrice)}\n📊 24h涨跌：${chgEmoji(found.change24h)} ${fmtChg(found.change24h)}\n💵 24h量：${fmtLarge(found.volume24h ?? 0)}\n🏦 市值：${fmtLarge(found.marketCap ?? 0)}\n\n👉 [在 driftcrypto\\.fun 查看](https://driftcrypto.fun#market)`
    : `💰 *${esc(found.name)}* \\(${esc(found.symbol.toUpperCase())}\\)\n\n📈 Price: ${fmtUSD(found.usdPrice)}\n📊 24h: ${chgEmoji(found.change24h)} ${fmtChg(found.change24h)}\n💵 Vol: ${fmtLarge(found.volume24h ?? 0)}\n🏦 MCap: ${fmtLarge(found.marketCap ?? 0)}\n\n👉 [View on driftcrypto\\.fun](https://driftcrypto.fun#market)`;
  await safeApiEdit(ctx.chat.id, msg.message_id, text, mainKB(l));
});

// ---------------------------------------------------------------------------
// /news
// ---------------------------------------------------------------------------
bot.command("news", async (ctx) => {
  const l = getLang(ctx.chat.id);
  const msg = await ctx.reply(t[l].loading);
  const data = await api<NewsResponse>("/api/news?num=8");
  if (!data?.items?.length) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, t[l].noData, { parse_mode: "MarkdownV2" });
    return;
  }
  const se: Record<string, string> = { bullish: "🟢", bearish: "🔴", neutral: "⚪" };
  let text = l === "zh" ? "📰 *最新加密新闻*\n\n" : "📰 *Latest Crypto News*\n\n";
  for (const a of data.items.slice(0, 8)) {
    text += `${se[a.sentiment] ?? "📰"} [${esc(a.title)}](${a.url})\n`;
  }
  text += l === "zh" ? "\n👉 [更多新闻](https://driftcrypto\\.fun#dashboard)" : "\n👉 [More News](https://driftcrypto.fun#dashboard)";
  await safeApiEdit(ctx.chat.id, msg.message_id, text, mainKB(l));
});

// ---------------------------------------------------------------------------
// /feargreed
// ---------------------------------------------------------------------------
bot.command("feargreed", async (ctx) => {
  const l = getLang(ctx.chat.id);
  const msg = await ctx.reply(t[l].loading);
  const data = await api<FearGreedResponse>("/api/fear-greed");
  if (!data || data.value === undefined) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, t[l].error, { parse_mode: "MarkdownV2" });
    return;
  }
  const s = t[l];
  let text = `${fgEmoji(data.value)} *${s.fearGreed}*\n\n📊 ${l === "zh" ? "当前指数" : "Current"}: *${escNum(data.value)}* / 100\n📝 ${l === "zh" ? "状态" : "Status"}: *${fgLabel(data.label, l)}*\n`;
  if (data.history?.length) {
    text += l === "zh" ? "\n📅 近期走势：" : "\n📅 Recent:";
    for (const h of data.history.slice(0, 7)) {
      text += `\n  ${h.recordedAt?.slice(5, 10) ?? "—"}: ${escNum(h.value)} \\(${fgLabel(h.label, l)}\\)`;
    }
  }
  text += l === "zh" ? "\n\n👉 [查看](https://driftcrypto\\.fun#dashboard)" : "\n\n👉 [View](https://driftcrypto.fun#dashboard)";
  await safeApiEdit(ctx.chat.id, msg.message_id, text, mainKB(l));
});

// ---------------------------------------------------------------------------
// /piaoshu
// ---------------------------------------------------------------------------
bot.command("piaoshu", async (ctx) => {
  const l = getLang(ctx.chat.id);
  const msg = await ctx.reply(t[l].loading);
  const data = await api<PiaoShuDailyResponse>("/api/piao-shu/daily?membership=free");
  if (!data) {
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, t[l].error, { parse_mode: "MarkdownV2" });
    return;
  }
  let text = l === "zh" ? "👑 *飘叔每日分析*\n\n" : "👑 *PiaoShu Daily Analysis*\n\n";
  if (data.title) text += `📅 ${esc(data.title)}\n\n`;
  if (data.overview) text += `📊 ${esc(data.overview.slice(0, 500))}${data.overview.length > 500 ? "\\.\\.\\." : ""}\n\n`;
  if (data.marketOverview) {
    const mo = data.marketOverview;
    text += l === "zh"
      ? `🌐 BTC ${escNum(mo.btcDominance)}% | ETH ${escNum(mo.ethDominance)}%\n📊 总市值 ${esc(mo.totalMarketCap)} | 24h ${fmtChg(mo.marketCapChange24h)}\n\n`
      : `🌐 BTC ${escNum(mo.btcDominance)}% | ETH ${escNum(mo.ethDominance)}%\n📊 MCap ${esc(mo.totalMarketCap)} | 24h ${fmtChg(mo.marketCapChange24h)}\n\n`;
  }
  if (data.gainers?.length) {
    text += l === "zh" ? "🟢 涨幅榜：\n" : "🟢 Top Gainers:\n";
    for (const g of data.gainers.slice(0, 5)) text += `  ${esc(g.symbol)}: ${fmtChg(g.change24h)}\n`;
    text += "\n";
  }
  if (data.losers?.length) {
    text += l === "zh" ? "🔴 跌幅榜：\n" : "🔴 Top Losers:\n";
    for (const lo of data.losers.slice(0, 5)) text += `  ${esc(lo.symbol)}: ${fmtChg(lo.change24h)}\n`;
    text += "\n";
  }
  if (data.minMembership && data.minMembership !== "free") {
    text += l === "zh" ? "🔒 需升级会员\n\n👉 [升级](https://driftcrypto\\.fun#membership)" : "🔒 Requires membership\n\n👉 [Upgrade](https://driftcrypto.fun#membership)";
  }
  await safeApiEdit(ctx.chat.id, msg.message_id, text, mainKB(l));
});

// ===========================================================================
// CALLBACK QUERIES — Navigation
// ===========================================================================
bot.callbackQuery(/^nav:(.+)$/, async (ctx) => {
  const sec = ctx.match![1];
  const l = getLang(ctx.chat.id);
  const s = t[l];

  // Answer immediately (only once!)
  if (sec === "more") {
    await ctx.answerCallbackQuery();
    await safeEdit(ctx, l === "zh" ? "📚 *更多栏目*\n\n选择一个栏目查看详情：" : "📚 *More Sections*\n\nSelect a section to explore:", moreKB(l));
    return;
  }
  if (sec === "back") {
    await ctx.answerCallbackQuery();
    await safeEdit(ctx, s.welcome, mainKB(l));
    return;
  }
  if (sec === "lang") {
    const nl: L = l === "en" ? "zh" : "en";
    setLang(ctx.chat.id, nl);
    await ctx.answerCallbackQuery();
    await safeEdit(ctx, t[nl].langChanged, mainKB(nl));
    return;
  }

  // Data sections — answer with loading toast, then fetch
  await ctx.answerCallbackQuery({ text: s.loading });

  // ── Dashboard ──────────────────────────────────────────────
  if (sec === "dashboard") {
    const [p, fg, dig] = await Promise.all([
      api<PricesResponse>("/api/prices"),
      api<FearGreedResponse>("/api/fear-greed"),
      api<AIDigestResponse>("/api/ai/digest"),
    ]);
    let text = s.dashboardDesc + "\n\n";
    if (p?.global) {
      const g = p.global;
      text += l === "zh"
        ? `🌐 总市值：${fmtLarge(g.totalMarketCap)}\n📊 24h变化：${fmtChg(g.marketCapChange24h)}\n💵 24h成交量：${fmtLarge(g.totalVolume)}\n🔢 活跃币种：${escNum(g.activeCryptos)}\n\n`
        : `🌐 Total MCap: ${fmtLarge(g.totalMarketCap)}\n📊 24h: ${fmtChg(g.marketCapChange24h)}\n💵 24h Vol: ${fmtLarge(g.totalVolume)}\n🔢 Active: ${escNum(g.activeCryptos)}\n\n`;
    }
    if (p?.coins?.length) {
      text += l === "zh" ? "🏆 市值前5：\n" : "🏆 Top 5 MCap:\n";
      for (const c of p.coins.slice(0, 5))
        text += `  ${chgEmoji(c.change24h)} ${esc(c.symbol.toUpperCase())}: ${fmtUSD(c.usdPrice)} \\(${fmtChg(c.change24h)}\\)\n`;
      text += "\n";
    }
    if (fg && fg.value !== undefined) text += `${fgEmoji(fg.value)} ${s.fearGreed}: ${escNum(fg.value)}/100 \\(${fgLabel(fg.label, l)}\\)\n\n`;
    if (dig?.digest) text += `📝 ${l === "zh" ? "AI 每日点评" : "AI Digest"}:\n${esc(dig.digest.slice(0, 400))}${dig.digest.length > 400 ? "\\.\\.\\." : ""}\n`;
    text += l === "zh" ? "\n👉 [查看完整仪表盘](https://driftcrypto\\.fun#dashboard)" : "\n👉 [View full dashboard](https://driftcrypto.fun#dashboard)";
    await safeEdit(ctx, text, mainKB(l));
    return;
  }

  // ── Market ─────────────────────────────────────────────────
  if (sec === "market") {
    const data = await api<PricesResponse>("/api/prices");
    let text = s.marketDesc + "\n\n";
    if (data?.global) {
      const g = data.global;
      text += l === "zh"
        ? `🌐 总市值：${fmtLarge(g.totalMarketCap)} \\(${fmtChg(g.marketCapChange24h)}\\)\n💵 24h成交量：${fmtLarge(g.totalVolume)}\n\n`
        : `🌐 Total MCap: ${fmtLarge(g.totalMarketCap)} \\(${fmtChg(g.marketCapChange24h)}\\)\n💵 24h Vol: ${fmtLarge(g.totalVolume)}\n\n`;
    }
    if (data?.coins?.length) {
      text += l === "zh" ? "🏆 市值前15：\n" : "🏆 Top 15 MCap:\n";
      for (const c of data.coins.slice(0, 15))
        text += `${chgEmoji(c.change24h)} ${esc(c.symbol.toUpperCase().padEnd(7))} ${fmtUSD(c.usdPrice)} \\(${fmtChg(c.change24h)}\\)\n`;
    }
    text += l === "zh" ? "\n👉 [查看完整行情](https://driftcrypto\\.fun#market)" : "\n👉 [View full market](https://driftcrypto.fun#market)";
    await safeEdit(ctx, text, mainKB(l));
    return;
  }

  // ── AI Chat ────────────────────────────────────────────────
  if (sec === "ai-chat") {
    await safeEdit(ctx, s.aiChatDesc, new InlineKeyboard()
      .text(l === "zh" ? "💡 BTC前景" : "💡 BTC?", "quick:btc").text(l === "zh" ? "📊 趋势" : "📊 Trend", "quick:market").row()
      .text(l === "zh" ? "🔥 山寨币" : "🔥 Altcoins", "quick:altcoins").text(l === "zh" ? "💚 情绪" : "💚 Sentiment", "quick:sentiment").row()
      .text(s.mainMenu, "nav:back"));
    return;
  }

  // ── PiaoShu ────────────────────────────────────────────────
  if (sec === "piao-shu") {
    const data = await api<PiaoShuDailyResponse>("/api/piao-shu/daily?membership=free");
    let text = s.piaoShuDesc + "\n\n";
    if (data?.title) text += `📅 ${esc(data.title)}\n\n`;
    if (data?.overview) text += `📊 ${esc(data.overview.slice(0, 400))}${data.overview.length > 400 ? "\\.\\.\\." : ""}\n\n`;
    if (data?.marketOverview) {
      const mo = data.marketOverview;
      text += l === "zh"
        ? `🌐 BTC ${escNum(mo.btcDominance)}% | ETH ${escNum(mo.ethDominance)}%\n📊 总市值 ${esc(mo.totalMarketCap)} | 24h ${fmtChg(mo.marketCapChange24h)}\n\n`
        : `🌐 BTC ${escNum(mo.btcDominance)}% | ETH ${escNum(mo.ethDominance)}%\n📊 MCap ${esc(mo.totalMarketCap)} | 24h ${fmtChg(mo.marketCapChange24h)}\n\n`;
    }
    if (data?.gainers?.length) {
      text += l === "zh" ? "🟢 涨幅榜：\n" : "🟢 Gainers:\n";
      for (const g of data.gainers.slice(0, 5)) text += `  ${esc(g.symbol)}: ${fmtChg(g.change24h)}\n`;
      text += "\n";
    }
    if (data?.losers?.length) {
      text += l === "zh" ? "🔴 跌幅榜：\n" : "🔴 Losers:\n";
      for (const lo of data.losers.slice(0, 5)) text += `  ${esc(lo.symbol)}: ${fmtChg(lo.change24h)}\n`;
      text += "\n";
    }
    if (data?.minMembership && data.minMembership !== "free") text += l === "zh" ? "🔒 需升级会员\n\n" : "🔒 Requires membership\n\n";
    text += l === "zh" ? "👉 [查看飘叔分析](https://driftcrypto\\.fun#piao\\-shu)" : "👉 [View PiaoShu](https://driftcrypto.fun#piao-shu)";
    await safeEdit(ctx, text, mainKB(l));
    return;
  }

  // ── Sentiment ──────────────────────────────────────────────
  if (sec === "sentiment") {
    const fg = await api<FearGreedResponse>("/api/fear-greed");
    let text = l === "zh" ? "💚 *市场情绪*\n\n" : "💚 *Market Sentiment*\n\n";
    if (fg && fg.value !== undefined) text += `${fgEmoji(fg.value)} ${s.fearGreed}: ${escNum(fg.value)}/100 \\(${fgLabel(fg.label, l)}\\)\n\n`;
    text += l === "zh"
      ? "📱 社交情绪：Twitter/Reddit 实时讨论\n📰 新闻情绪：AI 多空分析\n\n👉 [查看情绪分析](https://driftcrypto\\.fun#sentiment)"
      : "📱 Social: Twitter/Reddit discussion\n📰 News: AI sentiment analysis\n\n👉 [View sentiment](https://driftcrypto.fun#sentiment)";
    await safeEdit(ctx, text, moreKB(l));
    return;
  }

  // ── Macro ──────────────────────────────────────────────────
  if (sec === "macro-economics") {
    const p = await api<PricesResponse>("/api/prices");
    let text = l === "zh" ? "🏛 *宏观经济*\n\n" : "🏛 *Macro Economics*\n\n";
    if (p?.global) text += l === "zh"
      ? `🌐 加密总市值：${fmtLarge(p.global.totalMarketCap)} \\(${fmtChg(p.global.marketCapChange24h)}\\)\n\n`
      : `🌐 Crypto MCap: ${fmtLarge(p.global.totalMarketCap)} \\(${fmtChg(p.global.marketCapChange24h)}\\)\n\n`;
    text += l === "zh" ? "👉 [查看宏观数据](https://driftcrypto\\.fun#macro\\-economics)" : "👉 [View macro](https://driftcrypto.fun#macro-economics)";
    await safeEdit(ctx, text, moreKB(l));
    return;
  }

  // ── Trending ───────────────────────────────────────────────
  if (sec === "trending") {
    const p = await api<PricesResponse>("/api/prices");
    let text = l === "zh" ? "🔥 *热门趋势*\n\n" : "🔥 *Trending*\n\n";
    if (p?.coins?.length) {
      const sorted = [...p.coins].sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0));
      const gainers = sorted.filter(c => (c.change24h ?? 0) > 0).slice(0, 5);
      const losers = sorted.filter(c => (c.change24h ?? 0) < 0).slice(0, 5);
      if (gainers.length) {
        text += l === "zh" ? "🟢 涨幅榜：\n" : "🟢 Gainers:\n";
        for (const g of gainers) text += `  ${chgEmoji(g.change24h)} ${esc(g.symbol.toUpperCase())}: ${fmtUSD(g.usdPrice)} \\(${fmtChg(g.change24h)}\\)\n`;
        text += "\n";
      }
      if (losers.length) {
        text += l === "zh" ? "🔴 跌幅榜：\n" : "🔴 Losers:\n";
        for (const lo of losers) text += `  ${chgEmoji(lo.change24h)} ${esc(lo.symbol.toUpperCase())}: ${fmtUSD(lo.usdPrice)} \\(${fmtChg(lo.change24h)}\\)\n`;
        text += "\n";
      }
    }
    text += l === "zh" ? "👉 [查看热门](https://driftcrypto\\.fun#trending)" : "👉 [View trending](https://driftcrypto.fun#trending)";
    await safeEdit(ctx, text, moreKB(l));
    return;
  }

  // ── Membership ─────────────────────────────────────────────
  if (sec === "membership") {
    await safeEdit(ctx, l === "zh"
      ? `👑 *会员方案*\n\n🔓 *免费* — 基础行情数据, 每天5次AI对话\n⭐ *进阶* — $19/月 — 飘叔研报, 每天100次AI对话\n💎 *专业* — $49/月 — 无限AI对话, 实时提醒\n\n💳 支持 USD 或 USDC 支付\n\n👉 [升级会员](https://driftcrypto\\.fun#membership)`
      : `👑 *Membership Plans*\n\n🔓 *Free* — Basic data, 5 AI chats/day\n⭐ *Plus* — $19/mo — PiaoShu reports, 100 AI chats/day\n💎 *Pro* — $49/mo — Unlimited AI, Real\\-time alerts\n\n💳 USD or USDC\n\n👉 [Upgrade](https://driftcrypto.fun#membership)`,
      moreKB(l));
    return;
  }

  // ── Generic sections ───────────────────────────────────────
  const descs: Record<string, string> = {
    "portfolio": l === "zh" ? "💼 *投资组合*\n\n追踪和管理您的加密资产。登录网站同步。\n\n👉 [查看](https://driftcrypto\\.fun#portfolio)" : "💼 *Portfolio*\n\nTrack and manage your crypto holdings\\. Sign in to sync\\.\n\n👉 [View](https://driftcrypto.fun#portfolio)",
    "screener": l === "zh" ? "🔍 *VC 持仓筛选器*\n\n追踪顶级风投基金加密持仓。\n\n👉 [查看](https://driftcrypto\\.fun#screener)" : "🔍 *VC Token Screener*\n\nTrack top VC fund crypto holdings\\.\n\n👉 [View](https://driftcrypto.fun#screener)",
    "ai-analysis": l === "zh" ? "🧠 *AI 分析中心*\n\n多模型 AI 驱动的加密分析。\n\n👉 [查看](https://driftcrypto\\.fun#ai-analysis)" : "🧠 *AI Analysis Hub*\n\nMulti\\-model AI\\-powered crypto analysis\\.\n\n👉 [View](https://driftcrypto.fun#ai-analysis)",
    "technical-analysis": l === "zh" ? "📈 *技术分析*\n\n高级图表模式、技术指标、支撑/阻力位。\n\n👉 [查看](https://driftcrypto\\.fun#technical-analysis)" : "📈 *Technical Analysis*\n\nChart patterns, indicators, support/resistance\\.\n\n👉 [View](https://driftcrypto.fun#technical-analysis)",
    "predictions": l === "zh" ? "🔮 *增强预测*\n\nAI 驱动的价格预测，带置信度评分。\n\n👉 [查看](https://driftcrypto\\.fun#predictions)" : "🔮 *Enhanced Predictions*\n\nAI\\-driven price predictions with confidence scores\\.\n\n👉 [View](https://driftcrypto.fun#predictions)",
    "market-analysis": l === "zh" ? "📊 *市场分析*\n\n综合 AI 驱动的市场分析。\n\n👉 [查看](https://driftcrypto\\.fun#market-analysis)" : "📊 *Market Analysis*\n\nAI\\-driven market analysis with trend direction\\.\n\n👉 [View](https://driftcrypto.fun#market-analysis)",
    "correlations": l === "zh" ? "🔗 *跨资产相关性*\n\n主要资产相关性热力图。\n\n👉 [查看](https://driftcrypto\\.fun#correlations)" : "🔗 *Cross\\-Asset Correlations*\n\nCorrelation heatmap across major assets\\.\n\n👉 [View](https://driftcrypto.fun#correlations)",
    "microstructure": l === "zh" ? "🔬 *市场微观结构*\n\n订单簿深度、买卖价差和流动性指标。\n\n👉 [查看](https://driftcrypto\\.fun#microstructure)" : "🔬 *Market Microstructure*\n\nOrder book depth, spreads, and liquidity\\.\n\n👉 [View](https://driftcrypto.fun#microstructure)",
    "prediction-accuracy": l === "zh" ? "🎯 *预测准确率*\n\n追踪和验证 AI 预测表现。\n\n👉 [查看](https://driftcrypto\\.fun#prediction-accuracy)" : "🎯 *Prediction Accuracy*\n\nTrack and verify AI prediction performance\\.\n\n👉 [View](https://driftcrypto.fun#prediction-accuracy)",
    "batch-analysis": l === "zh" ? "📑 *批量分析*\n\n同时分析多个币种。\n\n👉 [查看](https://driftcrypto\\.fun#batch-analysis)" : "📑 *Batch Analysis*\n\nAnalyze multiple coins simultaneously\\.\n\n👉 [View](https://driftcrypto.fun#batch-analysis)",
    "nft": l === "zh" ? "🖼 *NFT*\n\nAI 驱动的独特数字资产。即将上线！\n\n👉 [查看](https://driftcrypto\\.fun#nft)" : "🖼 *NFT*\n\nAI\\-driven digital assets\\. Coming soon\\!\n\n👉 [View](https://driftcrypto.fun#nft)",
  };

  const desc = descs[sec];
  if (desc) {
    await safeEdit(ctx, desc, moreKB(l));
  } else {
    console.warn(`Unknown section: ${sec}`);
  }
});

// ===========================================================================
// QUICK AI CHAT CALLBACKS
// ===========================================================================
bot.callbackQuery(/^quick:(.+)$/, async (ctx) => {
  const topic = ctx.match![1];
  const l = getLang(ctx.chat.id);
  const s = t[l];
  const queries: Record<string, string> = {
    btc: l === "zh" ? "比特币前景如何？" : "What's the Bitcoin outlook?",
    market: l === "zh" ? "分析当前市场趋势" : "Analyze the current market trend",
    altcoins: l === "zh" ? "值得关注的山寨币" : "Top altcoins to watch",
    sentiment: l === "zh" ? "今天的市场情绪如何？" : "What is market sentiment today?",
  };
  const q = queries[topic] ?? queries.btc;
  await ctx.answerCallbackQuery({ text: s.loading });

  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: q, history: [], locale: l }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json() as AIChatResponse;
    const answer = aiText(data)?.slice(0, 3500) ?? s.error;
    const text = `🤖 *AI ${l === "zh" ? "回答" : "Response"}*\n\n${esc(answer)}${s.aiDisclaimer}\n\n👉 [继续聊天](https://driftcrypto\\.fun#ai\\-chat)`;
    await safeEdit(ctx, text, new InlineKeyboard()
      .text(l === "zh" ? "💡 再问" : "💡 Ask another", "nav:ai-chat").text(s.mainMenu, "nav:back"));
  } catch (err) {
    console.error("Quick chat error:", err);
    await safeEdit(ctx, s.error, mainKB(l));
  }
});

// ===========================================================================
// FREE-FORM AI CHAT
// ===========================================================================
bot.on("message:text", async (ctx) => {
  const l = getLang(ctx.chat.id);
  const s = t[l];
  const text = ctx.message.text;
  if (text.length < 2 || text.startsWith("/")) return;

  const msg = await ctx.reply(s.loading);

  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: [], locale: l }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json() as AIChatResponse;
    const answer = aiText(data)?.slice(0, 3500) ?? s.error;
    await safeApiEdit(ctx.chat.id, msg.message_id, `🤖 ${esc(answer)}${s.aiDisclaimer}`, mainKB(l));
  } catch (err) {
    console.error("Chat error:", err);
    try {
      await safeApiEdit(ctx.chat.id, msg.message_id, s.error, mainKB(l));
    } catch {}
  }
});

// ===========================================================================
// HEALTH CHECK SERVER
// ===========================================================================
Bun.serve({
  port: BOT_PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return Response.json({ status: "ok", service: "driftcrypto-telegram-bot", bot: "@DriftcryptoBot", url: "https://t.me/DriftcryptoBot", uptime: process.uptime(), timestamp: new Date().toISOString() });
    }
    return new Response("Not Found", { status: 404 });
  },
});
console.log(`🏥 Health check on port ${BOT_PORT}`);

// ===========================================================================
// ERROR HANDLING
// ===========================================================================
bot.catch((err) => console.error("❌ Bot error:", err));
process.on("uncaughtException", (err) => console.error("❌ Uncaught:", err));
process.on("unhandledRejection", (r) => console.error("❌ Rejection:", r));
setInterval(() => {}, 30000); // keepalive

// ===========================================================================
// START
// ===========================================================================
console.log("🚀 driftcrypto.fun Telegram Bot starting...");
bot.start({
  onStart: (info) => {
    console.log(`🤖 Bot @${info.username} started!`);
    console.log(`🔗 t.me/${info.username}`);
    console.log(`📡 Polling...`);
  },
});
