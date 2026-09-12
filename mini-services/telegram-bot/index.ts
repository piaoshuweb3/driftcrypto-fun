// =============================================================================
// driftcrypto.fun Telegram Bot — standalone long-polling entry point
// =============================================================================
// The bot itself lives in src/lib/telegram/bot.ts, so this poller and the
// Vercel webhook route (src/app/api/telegram/webhook) share one implementation.
//
// Run this only where a process can stay alive:
//   TELEGRAM_BOT_TOKEN=... bun index.ts
// Vercel is not such a place — use the webhook route there instead.
// =============================================================================

import { bot, registerCommandMenu } from "../../../src/lib/telegram/bot";

const BOT_PORT = Number(process.env.PORT ?? process.env.BOT_PORT ?? 3002);

// ---------------------------------------------------------------------------
// Health check (container platforms probe this)
// ---------------------------------------------------------------------------
Bun.serve({
  port: BOT_PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return Response.json({
        status: "ok",
        service: "driftcrypto-telegram-bot",
        mode: "polling",
        bot: "@DriftcryptoBot",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
    return new Response("Not Found", { status: 404 });
  },
});
console.log("🏥 Health check on port " + BOT_PORT);

// ---------------------------------------------------------------------------
// Start polling
// ---------------------------------------------------------------------------
await registerCommandMenu();

console.log("🚀 driftcrypto.fun Telegram Bot starting (long polling)...");
bot.start({
  onStart: (info) => {
    console.log("🤖 Bot @" + info.username + " started and polling");
  },
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    console.log("\n" + signal + " received — stopping bot...");
    try {
      await bot.stop();
    } catch {
      // the poller may already be down
    }
    process.exit(0);
  });
}
