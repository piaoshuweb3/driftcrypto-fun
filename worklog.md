
---

## Task ID: 2-a — Create `/api/prices` route

**Agent**: main
**Date**: 2026-03-05

### Summary
Created the API route file at `src/app/api/prices/route.ts` that fetches cryptocurrency prices from CoinGecko's free API and caches results in the SQLite database via Prisma.

### What was done
1. Created directory `src/app/api/prices/` and wrote `route.ts`
2. Implemented `GET` handler with the following logic:
   - **Cache check first**: Queries the `Price` table for the most recent `recordedAt`. If data is less than 5 minutes old, returns cached coins immediately (still attempts to fetch fresh global data).
   - **Fresh fetch**: When cache is stale, fetches both coins (top 100) and global market data from CoinGecko in parallel using `Promise.all`.
   - **Caching**: After a successful fetch, cleans up stale DB records and inserts fresh ones in a `$transaction`.
   - **Error fallback chain**: CoinGecko failure → stale DB cache → mock data.
3. Helper functions:
   - `safeFetch()` — fetch with AbortController timeout and error handling
   - `parseCoinGeckoCoins()` — maps CoinGecko market response to `CoinData[]`
   - `parseCoinGeckoGlobal()` — maps CoinGecko global response to `GlobalData`
   - `cacheCoins()` — persists coins to DB, cleans stale entries
   - `loadCachedCoins()` — loads fresh cache (< 5 min)
   - `loadStaleCoins()` — loads any DB data as fallback (deduplicated by `coinId`)
   - `buildMockData()` — returns 10 top coins + global data for offline/error scenarios

### Key decisions
- Used standard `fetch` (not `z-ai-web-dev-sdk`) as instructed
- Cache window uses a 10-second tolerance when querying related Price records (since 100 inserts in a transaction may span a few seconds)
- Global data is not persisted — it's fetched on every request when coins come from cache
- Stale cleanup deletes records older than `CACHE_TTL_MS` before inserting new batch

### Lint result
✅ Passed with no errors

---

## Task ID: 3-b — Create TrendingStrip & MarketTable Components

**Agent**: main
**Date**: 2026-03-05

### Summary
Created two production-ready, dark-themed component files for the CoinRichAI crypto dashboard: `TrendingStrip.tsx` and `MarketTable.tsx`. Both components fetch data from `/api/prices` via TanStack React Query and are fully responsive with framer-motion animations.

### What was done

#### 1. `src/components/TrendingStrip.tsx`
- Horizontal scrollable row of coin pill badges below the hero section
- Section title "🔥 Trending" with `TrendingUp` icon and gold accent color
- Each pill displays: rank number, coin image (or fallback initial letter circle), symbol, and 24h change % (green/red via `text-bullish`/`text-bearish`)
- Fetches top 7 trending coins from `/api/prices` (sorted by market cap from API)
- Framer-motion staggered entrance animation (`containerVariants` + `itemVariants` with spring physics)
- Loading skeleton state with pulsing placeholder pills
- Error state with red text message
- Custom scrollbar hidden via `scrollbarWidth: 'none'` + `::-webkit-scrollbar { display: none }`
- Fully responsive: horizontally scrollable on all screen sizes

#### 2. `src/components/MarketTable.tsx`
- Full market data table with section header "Market Overview" + filter dropdown
- **Columns**: # (rank), Name (image + name + symbol), Price, 24h Change, Market Cap, Volume (24h)
- **Filter dropdown** (shadcn Select): All, Top 10, Top 50, Gainers, Losers
- **Search input** with magnifying glass icon — filters by name or symbol
- **Pagination**: 10 items per page with prev/next buttons and numbered page indicators with ellipsis
- Price formatted with `formatPrice()` — commas + `$` for prices ≥ $1, 6 decimals for sub-dollar
- Large numbers formatted with `formatLargeNumber()` — T/B/M abbreviations
- 24h change colored green/red with up/down arrow icons
- Rows are clickable with visual hover feedback (`hover:bg-accent/40`)
- Coin images have ring that transitions to gold on row hover
- Loading state: 10 skeleton rows matching table column structure
- Error state: centered error message in red
- Empty state: "No coins found" message
- Responsive: Market Cap and Volume columns hidden on mobile (`hidden md:table-cell`)
- Framer-motion `AnimatePresence` for row enter/exit animations with staggered delays
- Page resets to 1 when filter or search changes

### Key decisions
- Used CSS custom properties from `globals.css` (`text-bullish`, `text-bearish`, `text-gold`, `bg-card`, `border-border`, etc.) for consistent theming
- Both components share the same `useQuery` key `['prices']` so TanStack Query deduplicates the fetch
- Used `unoptimized` on Next.js `Image` for coin icons since they come from external CoinGecko URLs
- Pagination uses smart ellipsis (show first, last, and ±1 around current page)
- `motion.tr` used instead of shadcn `TableRow` for per-row animation control while preserving table semantics

### Lint result
✅ Passed with no errors

---

## Task ID: 3-a — Create Header & HeroSection Components

**Agent**: main
**Date**: 2026-06-04

### Summary
Created two production-ready, dark-themed component files for the CoinRichAI crypto AI news dashboard: `Header.tsx` and `HeroSection.tsx`. Both components use framer-motion for animations and are fully responsive.

### What was done

#### 1. `src/components/Header.tsx`
- Fixed top header/nav bar with sticky positioning and glass/blur effect on scroll
- **Left**: Logo image (`/coinrichai-logo.png`) with gold ring + "CoinRichAI" brand text with gold gradient (`gradient-text` CSS class)
- **Center**: Navigation links with icons — Dashboard (BarChart3), Market (custom TrendingUpIcon), AI Chat (MessageSquare), MCP (Server)
- **Right**: Expandable search input (Search icon, animates open with framer-motion), notification bell (Bell icon), Sign In (ghost variant), Sign Up (gold filled with shadow-gold/20)
- Scroll detection via `useEffect` toggles glass/blur backdrop + border-bottom + shadow
- Mobile: hamburger menu using shadcn/ui `Sheet` with full navigation, search input, and auth buttons
- Framer-motion entrance animation (y: -20 → 0, opacity fade in)
- `'use client'` directive
- Accessible: `sr-only` labels on icon buttons, `SheetTitle` for screen readers

#### 2. `src/components/HeroSection.tsx`
- Hero section with background image overlay (`/hero-banner.png` at 8% opacity + gradient fade + radial gold glow accent)
- Large heading: "AI Powered Cryptocurrency Insights" with gradient text effect on "AI Powered"
- Subtitle with muted foreground styling
- **3 stat cards** in a responsive grid:
  - Total Market Cap (TrendingUp icon, bullish green, $ value, % change with 24h label)
  - 24h Volume (BarChart3 icon, gold accent, $ value)
  - BTC Dominance (PieChart icon, blue accent, percentage)
- Each card: dark glass effect (`bg-white/[0.03]`, `backdrop-blur-md`), gold border accent on hover, icon with colored background, subtle gold radial glow on hover
- Data fetched from `/api/prices` using TanStack React Query (`useQuery`)
  - `refetchInterval: 60_000` for auto-refresh
  - `staleTime: 30_000`
  - BTC dominance calculated from coins array (bitcoin marketCap / totalMarketCap)
- Loading skeleton state: 3 animated placeholder cards with pulsing skeletons
- Error state: red Activity icon + error message
- Framer-motion staggered card entrance animation (`containerVariants` + `cardVariants`)
- Number formatting: `formatLargeNumber()` converts to T/B/M abbreviations
- Responsive: `grid-cols-1 sm:grid-cols-3`, text sizes scale across breakpoints
- `'use client'` directive

#### 3. Supporting changes
- Created `src/components/Providers.tsx` — TanStack QueryClientProvider wrapper with default options (no refetch on window focus, 2 retries)
- Updated `src/app/layout.tsx` — wrapped `{children}` + `<Toaster />` with `<Providers>` for React Query support
- Updated `src/app/page.tsx` — simplified to only import Header + HeroSection (removed references to non-existent components that were causing 500 errors)

### Key decisions
- Used CSS custom properties from `globals.css` (`text-bullish`, `text-bearish`, `text-gold`, `bg-card`, `gradient-text`, `grid-pattern`, etc.) for consistent theming
- Custom `TrendingUpIcon` SVG in Header to avoid import conflicts (TrendingUp from lucide-react is used differently in HeroSection)
- Search input uses framer-motion `animate` for smooth width/opacity expansion
- BTC dominance computed client-side from the coins array rather than requiring API changes
- QueryClient initialized with `useState` to avoid re-creation on re-renders
- Sheet `onOpenChange` controls mobile menu state for proper close-on-navigation

### Lint result
✅ Passed with no errors

### HTTP status check
✅ `GET /` returns 200, page renders with both Header and HeroSection components

---

## Task ID: 3-c — Create NewsFeed, FearGreedWidget, AIDigestSection & Footer Components

**Agent**: main
**Date**: 2026-03-05

### Summary
Created four production-ready, dark-themed component files for the CoinRichAI crypto AI news dashboard. All components use the project's CSS custom properties for consistent theming (`text-bullish`, `text-bearish`, `text-gold`, `bg-card`, `border-border`, etc.) and fetch data via TanStack React Query.

### What was done

#### 1. `src/components/NewsFeed.tsx`
- AI-powered news feed section with header "📰 AI News Feed" and filter tabs (All, Bullish 🟢, Bearish 🔴, Neutral ⚪)
- Grid layout: 2 columns on desktop (`md:grid-cols-2`), 1 on mobile
- Each news card shows: source badge (domain extracted from URL), title (2 lines max via `line-clamp-2`), AI summary snippet (3 lines max via `line-clamp-3`), sentiment badge (bullish=green/bearish=red/neutral=gray with icons), relative published time ("2h ago", "1d ago"), external link icon
- Fetches from `/api/news?num=20&recency_days=7`
- Loading state with 6 skeleton cards
- "Load More" button at bottom (shows 8 items initially, loads 8 more per click)
- Framer-motion stagger entrance animation (`containerVariants` + `cardVariants` with spring physics)
- `AnimatePresence` for smooth filter transitions
- Error state with red error message
- Empty state when no news match the filter

#### 2. `src/components/FearGreedWidget.tsx`
- Compact card with title "Fear & Greed Index" and `Activity` icon
- Professional SVG semi-circular gauge visualization:
  - Color gradient from red (0) to green (100) as background track
  - Active arc that fills up to the current value with glow effect (dual-layer: glow + solid)
  - Animated needle pointing to current value with glow filter
  - Tick marks at every 10 units
  - Large value number displayed below gauge center
  - Value-based color: 0-25 Extreme Fear (red), 25-45 Fear (orange), 45-55 Neutral (yellow), 55-75 Greed (light green), 75-100 Extreme Greed (green)
- Label below the value (e.g., "Fear", "Extreme Greed")
- Updated timestamp below
- Drop shadow glow effect matching the current sentiment color
- Loading skeleton state with pulsing placeholder
- Error state with red text
- Fetches from `/api/fear-greed`

#### 3. `src/components/AIDigestSection.tsx`
- Compact card with title "飘叔锐评" (Piaoshu Commentary) and subtitle "AI Daily Digest"
- `Bot` icon in gold accent color
- Digest text rendered with simple markdown parser:
  - `# Heading` → gold bold heading
  - `**bold**` → foreground bold text
  - Empty lines → spacers
  - Regular text → muted-foreground paragraphs
- Scrollable content area (`max-h-72 overflow-y-auto`)
- "Generated by AI" badge at bottom with `Sparkles` icon in gold/amber styling
- Generation timestamp displayed
- Loading state with multi-line skeleton
- Error state
- Fetches from `/api/ai/digest`

#### 4. `src/components/Footer.tsx`
- Sticky footer (pushed to bottom via `mt-auto` in parent flex layout)
- Investment disclaimer: "⚠️ Content on this site is for informational purposes only. Not financial advice. Always DYOR." with `AlertTriangle` icon
- Navigation links: GitHub (`Github` icon), Twitter (`Twitter` icon), API Docs (`FileText` icon + label), MCP Manifest (`Server` icon + label)
- All links open in new tab with `noopener noreferrer`
- Copyright: "© 2026 CoinRichAI. All rights reserved."
- Dark background (`#08080d`) with subtle top border (`border-border/40`)
- Responsive: icon labels hidden on mobile, visible on sm+ screens
- No `'use client'` directive (static content)
- Proper `aria-label` attributes for accessibility

### Key decisions
- All client components use `'use client'` directive; Footer is server-compatible (no directive)
- Used CSS custom properties from `globals.css` for consistent dark theme (`bg-card`, `border-border/50`, `text-muted-foreground`, `text-bullish`, `text-bearish`, `text-gold`, etc.)
- NewsFeed and FearGreedWidget use separate `useQuery` keys (`['news']`, `['fear-greed']`, `['ai-digest']`)
- FearGreedWidget SVG gauge built entirely with SVG elements (no external charting library) for lightweight rendering
- AI Digest uses a custom lightweight markdown parser instead of `react-markdown` to avoid unnecessary bundle size
- All components have proper loading, error, and empty states
- Framer-motion animations use spring physics for natural feel

### Lint result
✅ Passed with no errors
