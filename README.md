# driftcrypto.fun

AI-powered cryptocurrency intelligence: live prices, AI market commentary,
news aggregation, the PiaoShu daily report, and USDC memberships.

**Live:** https://driftcrypto-fun.vercel.app

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Data | Prisma + libSQL — local SQLite in development, [Turso](https://turso.tech) in production |
| Auth | NextAuth (JWT) — Google, X/Twitter, wallet (EIP-191 signature), administrator password |
| AI | Any OpenAI-compatible endpoint, configured by environment |
| Payments | USDC on Polygon / Base / Arbitrum / Ethereum, verified on-chain |
| Bot | grammY, running as a Vercel webhook |

---

## Quick start

```bash
bun install
cp .env.example .env      # then fill it in — see below
bunx prisma generate
bunx prisma db push       # creates db/custom.db
bun run dev               # http://localhost:3000
```

Useful checks:

```bash
npm run typecheck         # tsc --noEmit
npm run lint
```

---

## Environment

Everything is read from the environment; nothing is committed. The full list
with inline notes lives in [`.env.example`](.env.example). The ones that matter
most:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `file:../db/custom.db` locally, `libsql://<db>.turso.io` in production |
| `TURSO_AUTH_TOKEN` | Required with a `libsql://` URL |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Session signing; generate with `openssl rand -base64 32` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Enables the administrator entry in the sign-in dialog |
| `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` | Chat backend — OpenAI, DeepSeek, Groq, OpenRouter, Ollama… |
| `SEARCH_PROVIDER` / `SEARCH_API_KEY` | Optional web search (`tavily` or `serper`) for news and the PiaoShu radar |
| `PAYMENT_RECEIVE_ADDRESS` | Address that receives USDC membership payments |
| `TELEGRAM_BOT_TOKEN` | The bot exits on boot without it |
| `PIAOSHU_GENERATE_KEY` | Operator key for report generation, `/api/telegram/setup` and `/api/ai/diagnose` |

### Choosing an AI backend

The AI layer speaks plain OpenAI-compatible HTTP, so a free tier is enough.
Groq works well and answers Chinese cleanly:

```bash
AI_BASE_URL="https://api.groq.com/openai/v1"
AI_MODEL="qwen/qwen3.8-27b"
```

> Avoid reasoning models such as `gpt-oss-*` on Groq unless you allow a large
> `max_tokens`: they spend the budget in a separate `reasoning` field and the
> `content` comes back empty.

---

## Deploying

```bash
vercel link
vercel env add DATABASE_URL production   # libsql://…
vercel env add TURSO_AUTH_TOKEN production
vercel deploy --prod
```

Two things that are easy to get wrong:

1. **Creating the schema on Turso.** The Prisma CLI rejects a `libsql://` URL
   ("the URL must start with `file:`"), so `prisma db push` cannot target it.
   Generate the DDL and apply it through Turso's API instead:

   ```bash
   bunx prisma migrate diff --from-empty \
     --to-schema-datamodel prisma/schema.prisma --script > schema.sql
   # then POST each statement to https://<db>.turso.io/v2/pipeline
   ```

2. **`.vercelignore`.** Vercel uploads the working tree, not the git tree.
   Without that file the local database is uploaded too — leaking local data
   into the deployment and making the app read stale rows from a read-only copy.

---

## The Telegram bot

`@DriftcryptoBot` mirrors the site's 19 sections and serves live data.

Bot logic lives in `src/lib/telegram/bot.ts`, with two entry points:

- `src/app/api/telegram/webhook` — the Vercel deployment (grammY `std/http`)
- `mini-services/telegram-bot/index.ts` — a long-polling entry for Docker or a VPS

Register the webhook once after deploying:

```bash
curl -X POST https://<your-domain>/api/telegram/setup \
  -H "Authorization: Bearer $PIAOSHU_GENERATE_KEY"
```

`GET` inspects the current registration; `DELETE` removes it (for switching
back to long polling).

---

## Payments

Checkout is server-quoted and server-verified:

1. `POST /api/payments/create` snapshots the tier, amount, chain and destination.
2. The wallet sends an ERC-20 `transfer` of USDC to that destination.
3. `POST /api/payments/verify` reads the receipt through a public RPC, decodes
   the USDC `Transfer` event addressed to us, enforces a confirmation depth and
   only then grants the tier.

Mainnet requires 24 confirmations, L2s require 12. A transaction hash can only
settle one checkout, and Polygon accepts both native USDC and the older
bridged USDC.e.

---

## Layout

```
src/app/            routes (App Router) and API endpoints
src/components/     UI — sections, dialogs, shadcn primitives
src/lib/            db, auth, i18n, AI provider, payments, PiaoShu, Telegram bot
mini-services/      standalone Telegram poller (optional deployment target)
prisma/schema.prisma
```

See also [`FEATURES_AND_DEPLOYMENT.md`](FEATURES_AND_DEPLOYMENT.md) for the
longer-form feature notes and [`worklog.md`](worklog.md) for the original build
history.
