
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

---

## Task ID: 3-b — Add i18n Support to HeroSection, TrendingStrip & MarketTable

**Agent**: hero-trending-market-i18n-agent
**Date**: 2026-03-05

### Summary
Updated 3 component files to add bilingual (EN/ZH) internationalization support using the `useI18n` hook from `@/lib/i18n`. All hardcoded English strings were replaced with `t()` translation calls while preserving all existing functionality, animations, data fetching, and styling.

### What was done

#### 1. `src/components/HeroSection.tsx`
- Added `import { useI18n } from '@/lib/i18n';`
- Added `const { t } = useI18n();` inside the component
- Replaced hardcoded strings with i18n keys:
  - `'AI Powered'` → `t('hero.title1')`
  - `'Cryptocurrency'` → `t('hero.title2')`
  - `'Insights'` → `t('hero.title3')`
  - Subtitle text → `t('hero.subtitle')`
  - `'Total Market Cap'` → `t('hero.totalMarketCap')`
  - `'24h Volume'` → `t('hero.volume24h')`
  - `'BTC Dominance'` → `t('hero.btcDominance')`
  - `'Failed to load market data'` → `t('hero.failedToLoad')`
- "24h" label kept as-is (universal, not translated)
- All existing functionality preserved: data fetching, animations, stat cards, loading/error states, responsive design

#### 2. `src/components/TrendingStrip.tsx`
- Added `import { useI18n } from '@/lib/i18n';`
- Added `const { t } = useI18n();` inside the component
- Replaced hardcoded strings with i18n keys:
  - `'Trending'` → `t('trending.label')`
  - `'Failed to load trending data'` → `t('trending.failedToLoad')`
- All existing functionality preserved: data fetching, scrollable pills, animations, loading/error states

#### 3. `src/components/MarketTable.tsx`
- Added `import { useI18n } from '@/lib/i18n';`
- Added `const { t } = useI18n();` inside the component
- Replaced hardcoded strings with i18n keys:
  - `'Market Overview'` → `t('market.title')`
  - `'Search coins...'` → `t('market.searchPlaceholder')`
  - `'#'` → `t('market.rank')`
  - `'Name'` → `t('market.name')`
  - `'Price'` → `t('market.price')`
  - `'24h Change'` → `t('market.change24h')`
  - `'Market Cap'` → `t('market.marketCap')`
  - `'Volume (24h)'` → `t('market.volume24h')`
  - `'No coins found matching your search.'` → `t('market.noCoinsFound')`
  - `'Failed to load market data. Please try again later.'` → `t('market.failedToLoad')`
  - `'Showing'` → `t('market.showing')`
  - `'of'` → `t('market.of')`
  - Filter labels: `'All'` → `t('market.all')`, `'Top 10'` → `t('market.top10')`, `'Top 50'` → `t('market.top50')`, `'Gainers'` → `t('market.gainers')`, `'Losers'` → `t('market.losers')`
- All existing functionality preserved: search, filter, pagination, data fetching, animations, responsive design

### Key decisions
- Only the 3 specified component files were modified — no new files created
- Component external APIs (props, export names) were NOT changed
- Data fetching logic was NOT changed
- All Tailwind classes and design patterns preserved exactly
- The pre-existing lint error in `src/lib/i18n.tsx` (react-hooks/set-state-in-effect for `setLocaleState` in useEffect) was NOT addressed as it is outside the scope of this task
- Each file retains its `'use client'` directive

### Lint result
⚠️ 1 pre-existing error in `src/lib/i18n.tsx` (not in the 3 modified files). The 3 modified component files pass lint cleanly.

---

## Task ID: 3-c — Add i18n Support to NewsFeed, FearGreedWidget, AIDigestSection & Footer

**Agent**: news-feargreed-digest-footer-i18n-agent
**Date**: 2026-03-05

### Summary
Updated 4 component files to add bilingual (EN/ZH) internationalization support using the `useI18n` hook from `@/lib/i18n`. All hardcoded English strings were replaced with `t()` and `tArgs()` translation calls while preserving all existing functionality, animations, data fetching, and styling. Footer was converted from a server component to a client component to support the `useI18n` hook.

### What was done

#### 1. `src/components/NewsFeed.tsx`
- Added `import { useI18n } from '@/lib/i18n';`
- Added `const { t } = useI18n();` in `NewsFeed` and `const { t, tArgs } = useI18n();` in `NewsCard`
- Replaced hardcoded strings with i18n keys:
  - `'AI News Feed'` → `t('news.title')`
  - `'All'` → `t('news.all')`, `'Bullish'` → `t('news.bullish')`, `'Bearish'` → `t('news.bearish')`, `'Neutral'` → `t('news.neutral')`
  - `'Load More'` → `t('news.loadMore')`
  - `'No news found for this filter.'` → `t('news.noNewsFound')`
  - `'Failed to load news'` → `t('news.failedToLoad')`
  - `'Open original article'` (aria-label) → `t('news.openArticle')`
- Refactored `timeAgo` function to accept `t` and `tArgs` parameters:
  - `'Just now'` → `t('news.justNow')`
  - `` `${minutes}m ago` `` → `tArgs('news.minutesAgo', { n: minutes })`
  - `` `${hours}h ago` `` → `tArgs('news.hoursAgo', { n: hours })`
  - `` `${days}d ago` `` → `tArgs('news.daysAgo', { n: days })`
- Refactored `getSentimentConfig` to accept `t` parameter for sentiment labels:
  - `'Bullish'` → `t('news.bullish')`, `'Bearish'` → `t('news.bearish')`, `'Neutral'` → `t('news.neutral')`
- Section `aria-label` now uses `t('news.title')`

#### 2. `src/components/FearGreedWidget.tsx`
- Added `import { useI18n } from '@/lib/i18n';`
- Added `const { t } = useI18n();` in `FearGreedWidget`
- Replaced hardcoded strings with i18n keys:
  - `'Fear & Greed Index'` → `t('fearGreed.title')`
  - `'Updated'` → `t('fearGreed.updated')`
  - `'Failed to load data'` → `t('fearGreed.failedToLoad')`
- Updated `getGaugeLabel` function to accept `t` parameter:
  - `'Extreme Fear'` → `t('fearGreed.extremeFear')`
  - `'Fear'` → `t('fearGreed.fear')`
  - `'Neutral'` → `t('fearGreed.neutralLabel')`
  - `'Greed'` → `t('fearGreed.greed')`
  - `'Extreme Greed'` → `t('fearGreed.extremeGreed')`

#### 3. `src/components/AIDigestSection.tsx`
- Added `import { useI18n } from '@/lib/i18n';`
- Added `const { t } = useI18n();` in `AIDigestSection`
- Replaced hardcoded strings with i18n keys:
  - `'飘叔锐评'` → `t('digest.title')`
  - `'AI Daily Digest'` → `t('digest.subtitle')`
  - `'Generated by AI'` → `t('digest.generatedByAI')`
  - `'Failed to load digest'` → `t('digest.failedToLoad')`

#### 4. `src/components/Footer.tsx`
- **Added `'use client';` directive** (previously a server component, now needs client-side hook access)
- Added `import { useI18n } from '@/lib/i18n';`
- Added `const { t } = useI18n();` in `Footer`
- Replaced hardcoded strings with i18n keys:
  - Disclaimer text → `t('footer.disclaimer')`
  - `'API Docs'` (label + aria-label) → `t('footer.apiDocs')`
  - `'© 2026 CoinRichAI. All rights reserved.'` → `t('footer.copyright')`

### Key decisions
- Only the 4 specified component files were modified — no new files created
- Component external APIs (props, export names) were NOT changed
- Data fetching logic was NOT changed
- All Tailwind classes and design patterns preserved exactly
- `timeAgo` and `getSentimentConfig` helper functions were refactored to accept translation function parameters rather than using hooks inside them (they are not React components)
- `NewsCard` sub-component calls `useI18n()` directly since it's a client component function
- Footer converted from server to client component — this is required because `useI18n` is a client hook. The performance impact is negligible since Footer is a lightweight component with no data fetching
- Each file retains its `'use client'` directive (Footer now has it too)

### Lint result
✅ Passed with no errors

---

## Task ID: 3-d — Create AIChatSection Component & Backend API

**Agent**: ai-chat-component-agent
**Date**: 2026-03-05

### Summary
Created the AI Chat interactive component (`AIChatSection.tsx`) and its backend API route (`/api/ai/chat/route.ts`). The frontend provides a beautiful dark-themed chat interface with message bubbles, typing indicator, and error handling. The backend uses `z-ai-web-dev-sdk` to generate crypto-savvy AI responses with bilingual system prompts.

### What was done

#### 1. `src/app/api/ai/chat/route.ts` (Backend)
- POST endpoint accepting `{ message: string, history?: Array<{role, content}>, locale?: string }`
- Bilingual system prompts:
  - English: CoinRichAI assistant specialized in crypto markets, blockchain, and digital assets
  - Chinese: Same role in Chinese
- System prompt selected based on `locale` parameter (`'zh'` or default English)
- Conversation history support: includes last 10 messages for context
- Uses `z-ai-web-dev-sdk` (`ZAI.create()` + `zai.chat.completions.create()`) for AI generation
- Returns `{ message: string }` as JSON
- Error handling:
  - Empty/missing message → 400 error
  - ZAI SDK failure → fallback response with disclaimer
  - All errors caught gracefully with console logging

#### 2. `src/components/AIChatSection.tsx` (Frontend)
- `'use client'` directive with full i18n support via `useI18n()`
- **Card container** with Bot icon (gold) header, title, and subtitle
- **Welcome message** from AI on initial load using `t('aiChat.welcomeMessage')`
- **Chat message area**: scrollable (max-h-[400px]) with auto-scroll to bottom
- **Message bubbles**:
  - User: right-aligned, gold/amber background tint (`bg-gold/15 border-gold/20`), rounded corners with `rounded-tr-md`
  - AI: left-aligned, dark card background (`bg-card border-border/50`), rounded corners with `rounded-tl-md`
  - Both: Avatar with User/Bot icon, timestamp display
- **Typing indicator**: animated bouncing dots with "Thinking..." text
- **Input area**: Textarea + gold Send button
  - Enter to send, Shift+Enter for newline
  - Input disabled during loading
  - Textarea auto-resets height after sending
- **Error handling**: error banner with retry button (RotateCcw icon)
  - On error, a fallback AI message is appended with disclaimer
  - Retry repopulates input with last user message
- **Disclaimer footer**: "AI-generated content for reference only. Not financial advice."
- **Framer-motion animations**: message appearance (`opacity: 0, y: 12 → opacity: 1, y: 0`), AnimatePresence for smooth transitions
- **Custom scrollbar**: uses project's `custom-scrollbar` class
- **Responsive**: works on mobile and desktop, max-width constraints on bubbles

#### 3. `src/app/page.tsx` (Updated)
- Added `import AIChatSection from '@/components/AIChatSection';`
- Inserted `<AIChatSection />` between Market Stats grid and News Feed sections

### Key decisions
- Used `useState` for messages instead of TanStack Query since chat is interactive/mutative state (not just fetched data)
- Conversation history sent to API (last 10 messages) for multi-turn context
- System prompt uses `'system'` role (not `'assistant'` like the digest route) for cleaner chat API semantics
- Welcome message stored as a regular ChatMessage in state (not hardcoded in render) for consistent rendering
- Error messages include financial disclaimers per the system prompt requirements
- Used `useCallback` for `sendMessage` to prevent unnecessary re-renders
- `initialized` ref prevents welcome message duplication on re-renders
- Auto-scroll uses `scrollTop = scrollHeight` on a plain div (not ScrollArea) for reliable scroll behavior

### Lint result
✅ Passed with no errors

---

## Task ID: 3-a — Header i18n + Language Switcher + More Dropdown (Rewrite)

**Agent**: header-i18n-agent
**Date**: 2026-03-05

### Summary
Rewrote `Header.tsx` to add full i18n support via the `useI18n` hook, a language switcher (EN/中文) with Globe icon dropdown, and a "More" dropdown menu with 11 analysis-related items. Also fixed the existing `i18n.tsx` lint error (setState-in-effect).

### What was done

#### 1. `src/lib/i18n.tsx` — Fixed lint error
- Previous version used `useEffect(() => setLocaleState(...))` which triggered `react-hooks/set-state-in-effect` lint error
- Replaced with `useSyncExternalStore` to read locale from localStorage without calling setState in an effect
- Local state stays in sync with the external snapshot by comparing on each render
- `setLocale` writes to localStorage and dispatches a `StorageEvent` so other subscribers pick up the change
- Removed the `mounted` boolean state (no longer needed — `useSyncExternalStore` provides separate server snapshot that returns `'en'`)

#### 2. `src/components/Header.tsx` — Full rewrite
- **i18n integration**: All text strings now use `t('header.xxx')` translation keys from `useI18n()`
- **Updated navigation**: 6 main nav items — Dashboard, Market, Portfolio, Screener, AI Chat, NFT (replaced old Dashboard/Market/AI Chat/MCP set)
- **"More" dropdown**: shadcn `DropdownMenu` triggered by "More + ChevronDown" button in the nav bar
  - 11 items with unique lucide icons: AI Analysis (Brain), Technical Analysis (LineChart), Sentiment (HeartPulse), Enhanced Predictions (Sparkles), Market Analysis (BarChartBig), Macro Economics (Landmark), Correlations (GitBranch), Microstructure (Microscope), Trending (Flame), Prediction Accuracy (Target), Batch Analysis (Layers)
  - Separator at bottom with `signInRequired` message + LogIn icon
  - Dark-themed styling: `bg-[#12121a]/95 backdrop-blur-xl border-white/10`
- **Language switcher**: Globe icon button in right section showing current locale (EN/中文)
  - shadcn `DropdownMenu` with English and 中文 options
  - Active locale highlighted with `text-gold`
- **Desktop nav breakpoint**: Changed from `md` to `lg` to accommodate 6 items + More dropdown
- **Mobile Sheet menu**: 
  - All 6 main nav items
  - Collapsible "More" section with chevron animation (`ChevronDown` rotates 180°)
  - Language toggle button (shows "English / 中文" switching text)
  - `signInRequired` message at bottom
  - All text uses `t()` for i18n
- **Preserved**: Dark theme, gold accents, glass blur effects, scroll detection, framer-motion entrance animation, accessible sr-only labels

#### 3. Removed duplicate `src/lib/i18n.ts`
- Initially created a `.ts` version but discovered the existing `.tsx` file was more feature-rich (tArgs, localStorage persistence, browser language detection)
- Deleted `.ts` and fixed the `.tsx` instead

### Key decisions
- Used `useSyncExternalStore` for locale hydration instead of `useEffect` + `setState` to satisfy the `react-hooks/set-state-in-effect` lint rule
- Main nav uses `lg:` breakpoint (1024px) instead of `md:` (768px) because 6 items + More don't fit well at medium widths
- "More" dropdown items each have a unique lucide icon for visual distinction
- Language switcher uses a dropdown rather than a simple toggle button for potential future locale additions
- Mobile "More" section uses a collapsible accordion pattern with framer-motion animation instead of a nested Sheet for better UX

### Lint result
✅ Passed with no errors

---

## Task ID: 4 — i18n Bilingual System + AI Chat + Browser Verification

**Agent**: main
**Date**: 2026-06-04

### Summary
Implemented complete bilingual (CN/EN) i18n system, language switcher, "More" dropdown navigation matching reference screenshots, AI Chat component, and verified all features via browser testing.

### What was done

#### 1. i18n Infrastructure
- Created `/src/lib/translations.ts` — Complete EN/ZH translation dictionary covering all sections (header, hero, trending, market, news, fearGreed, digest, aiChat, footer, common)
- Fixed `/src/lib/i18n.tsx` — I18nProvider with React Context, `useI18n()` hook, `t()` and `tArgs()` functions, localStorage persistence, browser language detection
- Updated `/src/components/Providers.tsx` — Added I18nProvider wrapping QueryClientProvider

#### 2. Header Rewrite
- Full i18n support via `useI18n()` hook
- 6 main nav items: Dashboard, Market, Portfolio, Screener, AI Chat, NFT (matching reference screenshots)
- "More" dropdown: 11 items with icons (AI Analysis, Technical Analysis, Sentiment, Enhanced Predictions, Market Analysis, Macro Economics, Correlations, Microstructure, Trending, Prediction Accuracy, Batch Analysis)
- Language switcher: Globe icon + EN/中文 label with dropdown (English/中文)
- Mobile Sheet: All nav items + collapsible "More" section + language toggle + auth buttons

#### 3. Component i18n Updates
- **HeroSection**: All 8 strings translated (title parts, subtitle, stat card labels, error)
- **TrendingStrip**: 2 strings translated (label, error)
- **MarketTable**: 14 strings translated (title, headers, filters, pagination, states)
- **NewsFeed**: All strings + timeAgo() refactored with tArgs() for relative times
- **FearGreedWidget**: Title, gauge labels (5 levels), "Updated", error — all translated
- **AIDigestSection**: Title, subtitle, "Generated by AI", error — all translated
- **Footer**: Disclaimer, API Docs label, copyright — all translated (added 'use client')

#### 4. AI Chat Component
- Created `/src/components/AIChatSection.tsx` — Full chat interface with:
  - Welcome message, message bubbles (user/AI), typing indicator with bouncing dots
  - Auto-scroll, Enter to send, Shift+Enter for newline
  - Error handling with retry button, AI disclaimer
  - framer-motion animations, responsive design
- Created `/src/app/api/ai/chat/route.ts` — POST endpoint with:
  - Bilingual system prompts (EN/ZH based on locale)
  - Conversation history (last 10 messages)
  - ZAI SDK integration for AI responses
  - Error handling with fallback messages

#### 5. Page Update
- Added `<AIChatSection />` between Market Stats grid and News Feed in page.tsx

### Browser Verification Results
✅ English mode: All labels, buttons, headings display in English
✅ Chinese mode: All labels, buttons, headings display in Chinese
✅ Language switcher: Dropdown with EN/中文, instant toggle
✅ More dropdown: 11 items with icons, signInRequired footer
✅ Mobile responsive: Hamburger menu, language toggle, all nav items
✅ AI Chat: Input area, send button, welcome message
✅ No console errors
✅ Lint passed with no errors
✅ Dev server running cleanly

