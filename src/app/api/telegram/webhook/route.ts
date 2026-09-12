import { webhookCallback } from 'grammy';
import { bot } from '@/lib/telegram/bot';

// ---------------------------------------------------------------------------
// POST /api/telegram/webhook
// ---------------------------------------------------------------------------
// Telegram delivers updates here once the webhook is registered (see
// /api/telegram/setup). This is what lets the bot run on Vercel, where a
// long-polling process cannot exist: the handlers live in
// src/lib/telegram/bot.ts and are shared with the standalone poller.
//
// grammY's webhookCallback parses the update, dispatches it and returns the
// Response — it also initialises the bot (getMe) on first use.
// ---------------------------------------------------------------------------

const handleUpdate = webhookCallback(bot, 'std/http');

export async function POST(request: Request): Promise<Response> {
  // Telegram echoes the secret we registered with setWebhook. Without it the
  // endpoint is open to anyone who guesses the URL.
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const provided = request.headers.get('x-telegram-bot-api-secret-token');
    if (provided !== expected) {
      return new Response('unauthorized', { status: 401 });
    }
  }

  try {
    return await handleUpdate(request);
  } catch (error) {
    // Always answer 200 afterwards: a non-2xx makes Telegram retry the same
    // update repeatedly, which turns one bad update into a flood.
    console.error('[telegram/webhook] failed to handle update:', error);
    return new Response('ok', { status: 200 });
  }
}

export async function GET(): Promise<Response> {
  // Convenience for a quick health check from a browser or uptime monitor.
  return Response.json({
    ok: true,
    endpoint: '/api/telegram/webhook',
    note: 'Telegram delivers updates here via POST once /api/telegram/setup has run.',
  });
}
