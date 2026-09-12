# driftcrypto.fun Telegram Bot (@DriftcryptoBot)
#
# Long-polling process — deliberately NOT a Vercel function. Build and run it
# anywhere that keeps a process alive (Docker, Railway, Fly.io, a VPS).
#
#   docker build -t driftcrypto-bot .
#   docker run -e TELEGRAM_BOT_TOKEN=123456:ABC... driftcrypto-bot

FROM oven/bun:1-alpine

WORKDIR /app

# Dependencies first so a source-only change does not bust the layer cache.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY index.ts tsconfig.json ./

ENV NODE_ENV=production
ENV BOT_PORT=3002
EXPOSE 3002

# Railway/Fly/Heroku inject PORT; index.ts prefers it when present.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3002}/health" || exit 1

CMD ["bun", "index.ts"]
