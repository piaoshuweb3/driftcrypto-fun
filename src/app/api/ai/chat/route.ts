import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPTS: Record<string, string> = {
  en: `You are CoinRichAI, an AI assistant specialized in cryptocurrency markets, blockchain technology, and digital assets. Provide helpful, accurate, and concise responses. Always include relevant disclaimers about financial advice. You can discuss market trends, price analysis, blockchain projects, DeFi protocols, NFTs, and trading strategies. Keep responses focused and informative.`,
  zh: `你是 CoinRichAI，一位专注于加密货币市场、区块链技术和数字资产的 AI 助手。提供有用、准确和简洁的回答。始终包含关于投资建议的相关免责声明。你可以讨论市场趋势、价格分析、区块链项目、DeFi 协议、NFT 和交易策略。保持回答聚焦和信息丰富。`,
};

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, locale } = body as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
      locale?: string;
    };

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }

    const systemPrompt =
      SYSTEM_PROMPTS[locale === 'zh' ? 'zh' : 'en'];

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages max)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (
          msg.role &&
          msg.content &&
          typeof msg.content === 'string' &&
          (msg.role === 'user' || msg.role === 'assistant')
        ) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message.trim() });

    // Call ZAI SDK
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      thinking: { type: 'disabled' },
    });

    const aiMessage =
      completion.choices?.[0]?.message?.content ??
      (locale === 'zh'
        ? '抱歉，我暂时无法生成回复。请稍后再试。'
        : 'Sorry, I could not generate a response. Please try again.');

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('AI Chat endpoint error:', error);

    return NextResponse.json({
      message:
        'I apologize, but I am currently unable to process your request. This is not financial advice. Please try again later or consult other sources for crypto market information.',
    });
  }
}
