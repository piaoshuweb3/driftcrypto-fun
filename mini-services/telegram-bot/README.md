# driftcrypto.fun Telegram Bot (@DriftcryptoBot)

Official channel bot for [driftcrypto.fun](https://driftcrypto.fun). Mirrors the
website's sections over Telegram: live market data, Fear & Greed, AI commentary
and the PiaoShu daily report.

## Why this is a separate service

It is a **long-polling process**. Vercel runs serverless functions that are
created per request and destroyed immediately after, so a persistent poller
cannot live there. Run this on anything that keeps a process alive — Docker,
Railway, Fly.io, a VPS — and point it at the deployed website through
`DRIFTCRYPTO_API_BASE`.

## Environment

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | **yes** | — | Token from @BotFather. The bot exits on boot without it. |
| `DRIFTCRYPTO_API_BASE` | no | `https://driftcrypto-fun.vercel.app` | Where data is read from. |
| `PORT` / `BOT_PORT` | no | `3002` | Health-check server (`GET /health`). |
| `BOT_LANG_FILE` | no | `./.bot-langs.json` | Persisted per-chat language choices. |

> **Never commit the bot token.** This repository is public, so any token that
> was ever committed must be treated as compromised and rotated with @BotFather
> (`/revoke`). The bot now reads it from the environment only.

## Run locally

```bash
bun install
TELEGRAM_BOT_TOKEN=123456:ABC... bun index.ts
# health check
curl http://127.0.0.1:3002/health
```

## Deploy with Docker

```bash
docker build -t driftcrypto-bot .
docker run --rm \
  -e TELEGRAM_BOT_TOKEN=123456:ABC... \
  -e DRIFTCRYPTO_API_BASE=https://driftcrypto-fun.vercel.app \
  -p 3002:3002 \
  driftcrypto-bot
```

## Commands

| Command | Description |
| --- | --- |
| `/start` | Main menu (inline keyboard for all 19 sections) |
| `/market` | Top 15 coins by market cap |
| `/trending` | Biggest movers in either direction |
| `/price <coin>` | Quick price lookup, e.g. `/price bitcoin` |
| `/ai <question>` | One-shot AI question |
| `/news` | Latest crypto headlines |
| `/feargreed` | Fear & Greed Index with recent history |
| `/piaoshu` | PiaoShu daily analysis |
| `/site` | Website, Twitter, Telegram and MCP manifest links |
| `/lang` | Switch between 中文 and English |
| `/help` | Command list (generated from the same table as the Telegram menu) |

The `/` menu is registered with Telegram on every boot via `setMyCommands`, in
both languages plus a default — no out-of-band setup is needed.

## Layout

- `index.ts` — the whole bot: config, i18n, formatters, commands, navigation.
- `tsconfig.json` — type checking for this sub-project (`bunx tsc --noEmit`).
- `Dockerfile` / `.dockerignore` — container build.
- `.bot-langs.json` — runtime state, git-ignored, created on first language switch.
