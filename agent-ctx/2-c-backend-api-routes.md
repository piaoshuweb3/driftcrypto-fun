# Worklog - Task 2-c: Create Three API Route Files

**Date**: 2026-06-04
**Task ID**: 2-c
**Agent**: backend-api-routes

## Summary

Created three production-ready API route files for the CoinRichAI Next.js 16 project with robust error handling and caching.

## Files Created

### 1. `/src/app/api/fear-greed/route.ts`
- **GET handler** that fetches the Fear & Greed Index from `https://api.alternative.me/fng/?limit=10`
- **Prisma caching**: Uses the `FearGreedIndex` model to cache results; returns cached data if less than 1 hour old
- **Cleanup logic**: Maintains only the last 30 entries in the database to prevent unbounded growth
- **Graceful degradation**: If API fails, returns stale cached data; if no cache exists, returns mock data `{ value: 50, label: "Neutral" }`
- **Timeout**: 10-second abort timeout for external API calls
- **Return format**: `{ value: number, label: string, updatedAt: string, history: [...] }`
- **Verified working**: Returns live data (e.g., `{ value: 12, label: "Extreme Fear" }`)

### 2. `/src/app/api/ai/digest/route.ts`
- **GET handler** that generates daily crypto market commentary in "飘叔" (Piaoshu) style
- **Two-step AI pipeline**:
  1. Uses `z-ai-web-dev-sdk` `web_search` to fetch latest cryptocurrency news (10 results, 1-day recency)
  2. Uses `z-ai-web-dev-sdk` LLM to generate commentary with 飘叔 system prompt
- **飘叔 style system prompt**: Short sentences, assertions, no internet buzzwords (赋能/闭环/抓手/痛点), decentralization-first, pragmatic, code-is-personality
- **In-memory cache**: 2-hour TTL; returns cached digest if still fresh
- **Graceful degradation**: If LLM fails, returns stale cache; if no cache, returns a 飘叔-style fallback message
- **Return format**: `{ digest: string, generatedAt: string, newsCount: number, sources: [...] }`
- **Verified working**: Returns 飘叔-style market commentary

### 3. `/src/app/api/mcp/manifest/route.ts`
- **GET handler** that returns a static MCP Server Manifest JSON
- **4 tools defined**: `search_news`, `get_coin_price`, `get_fear_greed`, `get_ai_digest` — each with full JSON Schema parameter definitions
- **4 endpoints**: Maps tool names to API routes (`/api/news`, `/api/prices`, `/api/fear-greed`, `/api/ai/digest`)
- **Cache headers**: `Cache-Control: public, max-age=3600` for CDN optimization
- **Return format**: `{ name, version, description, tools: [...], endpoints: {...} }`
- **Verified working**: Returns complete manifest JSON

## Technical Details

- All routes use `NextResponse.json()` for consistent response handling
- Error handling follows a layered fallback pattern: fresh cache → API → stale cache → mock/default
- ESLint passes with zero errors
- All three endpoints verified working via `curl` tests
- Prisma schema was already in sync (FearGreedIndex model existed)
- `z-ai-web-dev-sdk` v0.0.18 used for AI digest (server-side only)

## Verification Results

```
GET /api/fear-greed   → 200 ✓ (returned live Fear & Greed data)
GET /api/ai/digest    → 200 ✓ (returned 飘叔-style commentary)
GET /api/mcp/manifest → 200 ✓ (returned complete MCP manifest)
bun run lint          → ✓ (zero errors)
```
