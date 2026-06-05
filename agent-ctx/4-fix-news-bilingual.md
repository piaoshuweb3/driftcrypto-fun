# Task 4: Fix news display - add bilingual mock data and pass locale to news API

## Summary
Updated the news API and NewsFeed component to support bilingual news display based on the current locale.

## Changes Made

### 1. `/home/z/my-project/src/app/api/news/route.ts`
- Added `locale` query parameter reading: `const locale = searchParams.get("locale") ?? "en";`
- Added `ZH_MOCK_NEWS` array with 12 Chinese-language mock news items (matching the 12 English ones)
- Created `fallbackNews` variable that selects `ZH_MOCK_NEWS` when `locale === 'zh'`, otherwise `MOCK_NEWS`
- Replaced all three `MOCK_NEWS` references in fallback paths with `fallbackNews`:
  - ZAI SDK init failure fallback
  - No search results fallback
  - Catch block error fallback

### 2. `/home/z/my-project/src/components/NewsFeed.tsx`
- Updated `fetchNews` function to accept `locale: string` parameter and include it in the API URL as a query param
- Updated `NewsFeed` component to destructure `locale` from `useI18n()`
- Updated `useQuery` to include `locale` in the query key (`['news', locale]`) so changing locale triggers a refetch
- Updated `queryFn` to pass `locale` to `fetchNews(locale)`

## Result
When the user switches language to Chinese (zh), the NewsFeed component will refetch news with `locale=zh`, and the API will return Chinese mock data instead of English.
