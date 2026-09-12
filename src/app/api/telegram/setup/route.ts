import { NextRequest, NextResponse } from 'next/server';
import { bot, registerCommandMenu } from '@/lib/telegram/bot';

// ---------------------------------------------------------------------------
// /api/telegram/setup — register (or remove) the Telegram webhook
// ---------------------------------------------------------------------------
// Run this once after deploying, so Telegram starts delivering updates to the
// webhook route instead of expecting a long-polling client.
//
//   POST   register the webhook + refresh the command menu
//   GET    inspect what Telegram currently thinks the webhook is
//   DELETE go back to "no webhook" (e.g. to run the standalone poller again)
//
// Guarded by the same internal key as the report generator: it is an
// operator action, not something end users should be able to trigger.
// ---------------------------------------------------------------------------

function authorized(req: NextRequest): boolean {
  const expected = process.env.PIAOSHU_GENERATE_KEY;
  if (!expected) return false;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

function resolveWebhookUrl(req: NextRequest): string {
  const configured = process.env.DRIFTCRYPTO_SITE_URL || process.env.DRIFTCRYPTO_API_BASE;
  const base = (configured || req.nextUrl.origin).replace(/\/+$/, '');
  return `${base}/api/telegram/webhook`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const info = await bot.api.getWebhookInfo();
  return NextResponse.json({
    ok: true,
    expectedUrl: resolveWebhookUrl(req),
    current: info,
    matches: info.url === resolveWebhookUrl(req),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = resolveWebhookUrl(req);
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  await bot.api.setWebhook(url, {
    ...(secret ? { secret_token: secret } : {}),
    // The bot only handles messages and button presses; asking for anything
    // else just wastes deliveries.
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });

  // The "/" menu is per-bot state, so it has to be (re)registered here too —
  // a fresh deployment has never called setMyCommands.
  await registerCommandMenu();

  const info = await bot.api.getWebhookInfo();

  return NextResponse.json({
    ok: true,
    registered: url,
    secretConfigured: Boolean(secret),
    current: info,
  });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await bot.api.deleteWebhook({ drop_pending_updates: true });
  return NextResponse.json({
    ok: true,
    message:
      'Webhook removed. The bot receives no updates until it is registered again (or the standalone poller is started).',
  });
}
