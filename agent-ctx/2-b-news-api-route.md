# Task 2-b: News API Route Implementation

## Summary
Created the API route file at `/home/z/my-project/src/app/api/news/route.ts` that searches for cryptocurrency/AI news using the `z-ai-web-dev-sdk` web_search function and returns aggregated, deduplicated, sentiment-classified news results cached in the Prisma database.

## Implementation Details

### File Created
- `/home/z/my-project/src/app/api/news/route.ts`

### Key Features
1. **GET Handler** — Accepts query params:
   - `q` (search query, default: "cryptocurrency AI blockchain")
   - `num` (number of results, default: 20, clamped 1–50)
   - `recency_days` (filter recency, default: 7, clamped 1–30)

2. **Parallel Multi-Query Search** — Searches three fixed queries in parallel for broader coverage:
   - "cryptocurrency news"
   - "AI blockchain news"
   - "crypto market analysis"
   - Plus the custom `q` param if different from the above

3. **Deduplication** — Results are deduplicated by normalised URL (trailing slashes removed, lowercased) using a `Set`.

4. **Sentiment Classification** — Simple keyword scoring:
   - **Bullish**: rally, surge, bull, gain, pump, moon, breakout, soar, positive, growth, upgrade
   - **Bearish**: crash, dump, bear, decline, drop, fall, hack, exploit, ban, risk, warning, fear
   - **Neutral**: when scores are equal or no keywords matched

5. **Prisma Caching** — Each result is upserted into the `News` model using `contentHash` (a deterministic hash of `url::title`) as the unique key.

6. **Response Format**:
   ```json
   { "items": [...], "total": number, "hasMore": boolean }
   ```
   Each item: `{ id, title, url, snippet, source, sentiment, publishedAt, favicon }`

7. **Error Handling** — Individual search query failures are caught and logged without breaking the entire response. The top-level try/catch returns a 500 with a clean error payload if an unexpected error occurs.

## Verification
- ESLint passed with no errors
- Dev server running correctly (no compilation errors)
- Prisma schema already includes the `News` model with the required fields

## Dependencies Used
- `z-ai-web-dev-sdk` (already in package.json)
- `@/lib/db` (Prisma client singleton)
- Next.js `NextRequest` / `NextResponse`
