import { NextRequest, NextResponse } from 'next/server';
import { chatComplete, isChatConfigured } from '@/lib/ai/provider';

// ---------------------------------------------------------------------------
// GET /api/ai/diagnose — why is the AI layer not answering?
// ---------------------------------------------------------------------------
// Deployment debugging aid: reports what the running function actually sees in
// its environment and performs one real round-trip, surfacing the provider's
// error text instead of the friendly fallback the UI shows.
//
// Operator-only: the same key as the report generator. It never returns the
// API key itself, only enough of it to tell two keys apart.
// ---------------------------------------------------------------------------

function authorized(req: NextRequest): boolean {
  const expected = process.env.PIAOSHU_GENERATE_KEY;
  if (!expected) return false;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  let probe: string;
  try {
    probe =
      'OK: ' +
      (await chatComplete([{ role: 'user', content: 'Reply with the single word: pong' }], {
        maxTokens: 32,
        timeoutMs: 20_000,
      }));
  } catch (error) {
    probe = 'ERROR: ' + (error instanceof Error ? error.message : String(error));
  }

  return NextResponse.json({
    configured: isChatConfigured(),
    baseUrl: baseUrl ?? '(default: https://api.openai.com/v1)',
    model: model ?? '(default: gpt-4o-mini)',
    keyPresent: Boolean(key),
    keyPrefix: key ? key.slice(0, 6) + '…' : null,
    probe,
  });
}
