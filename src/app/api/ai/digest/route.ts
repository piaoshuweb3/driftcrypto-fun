import { NextResponse } from 'next/server';
import { chatComplete, webSearch } from '@/lib/ai/provider';

const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

interface CachedDigest {
  digest: string;
  generatedAt: string;
  newsCount: number;
  sources: Array<{ title: string; url: string; snippet: string }>;
}

let cachedDigest: CachedDigest | null = null;
let cachedAt = 0;

const SYSTEM_PROMPT = `你是"飘叔"——一个有10年全栈开发经验的程序员，AFC区块链核心设计者，PoRC共识机制发明人。

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
- 最后一段给一个明确的行动建议（买入/卖出/观望/空仓）
`;

async function fetchCryptoNews(): Promise<{
  results: Array<{ title: string; url: string; snippet: string }>;
  count: number;
}> {
  try {
    // Returns [] when no search provider is configured — callers degrade to
    // "no news today" rather than failing the whole digest.
    const results = await webSearch('cryptocurrency market news today', {
      num: 10,
      recencyDays: 1,
    });

    return { results, count: results.length };
  } catch (error) {
    console.error('Failed to fetch crypto news:', error);
    return { results: [], count: 0 };
  }
}

async function generateDigest(
  newsItems: Array<{ title: string; url: string; snippet: string }>
): Promise<string> {
  const newsText = newsItems
    .slice(0, 8)
    .map((n, i) => `${i + 1}. ${n.title}\n   ${n.snippet}`)
    .join('\n\n');

  const userPrompt = `以下是今日加密市场相关新闻：

${newsText || '暂无今日新闻数据。'}

请以飘叔的风格，给出今日市场点评。包括：
1. 今日市场整体判断
2. 重要新闻解读
3. 情绪面分析
4. 明确的行动建议

直接输出，不要废话。`;

  // The persona belongs in the system role — the previous code sent it as an
  // assistant message, which weaker models would read as their own prior turn.
  return chatComplete([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);
}

export async function GET() {
  try {
    // Return cached digest if still fresh
    if (cachedDigest && Date.now() - cachedAt < CACHE_DURATION_MS) {
      return NextResponse.json(cachedDigest);
    }

    // Fetch latest news
    const { results: newsItems, count: newsCount } = await fetchCryptoNews();

    // Generate AI commentary
    let digest: string;
    try {
      digest = await generateDigest(newsItems);
    } catch (error) {
      console.error('Failed to generate AI digest:', error);

      // If we have stale cache, return it
      if (cachedDigest) {
        return NextResponse.json(cachedDigest);
      }

      digest =
        '## 市场点评暂时无法生成\n\n系统开小差了。这种时候，**空仓观望**。看不懂就不动。';
    }

    const result: CachedDigest = {
      digest,
      generatedAt: new Date().toISOString(),
      newsCount,
      sources: newsItems.slice(0, 8).map((n) => ({
        title: n.title,
        url: n.url,
        snippet: n.snippet,
      })),
    };

    // Update cache
    cachedDigest = result;
    cachedAt = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Digest endpoint error:', error);

    // Return stale cache or fallback
    if (cachedDigest) {
      return NextResponse.json(cachedDigest);
    }

    return NextResponse.json({
      digest:
        '## 系统异常\n\n数据源挂了。飘叔说过：**不确定的时候，不要做任何决策。** 等数据恢复再看。',
      generatedAt: new Date().toISOString(),
      newsCount: 0,
      sources: [],
    });
  }
}
