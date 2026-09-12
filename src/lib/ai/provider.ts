/**
 * Provider-agnostic AI access.
 *
 * The app used to call `z-ai-web-dev-sdk`, which only exists inside the Z.ai
 * sandbox — on Vercel every AI route would fail. Everything here speaks plain
 * OpenAI-compatible HTTP instead, so the deployment target is chosen purely by
 * environment variables:
 *
 *   AI_BASE_URL   default https://api.openai.com/v1
 *   AI_API_KEY    required to enable chat
 *   AI_MODEL      default gpt-4o-mini
 *
 * Works unchanged against OpenAI, DeepSeek, Moonshot, OpenRouter, Groq, a
 * self-hosted vLLM or a local Ollama (`AI_BASE_URL=http://localhost:11434/v1`).
 *
 * Web search is a separate concern; providers differ too much to fake with one
 * protocol, so it is optional and degrades to "no results" (callers already
 * have fallbacks):
 *
 *   SEARCH_PROVIDER  "tavily" | "serper" | unset (disabled)
 *   SEARCH_API_KEY   key for the selected provider
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

export interface ChatOptions {
  /** Upper bound on generated tokens. */
  maxTokens?: number;
  temperature?: number;
  /** Abort the request after this many ms (default 30s). */
  timeoutMs?: number;
}

export interface SearchOptions {
  /** How many results to ask for. */
  num?: number;
  /** Only return results newer than this many days, when supported. */
  recencyDays?: number;
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_SEARCH_TIMEOUT_MS = 15_000;

/** True when a chat provider is configured. Routes use this to fail fast. */
export function isChatConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

/** True when a search provider is configured. */
export function isSearchConfigured(): boolean {
  const provider = process.env.SEARCH_PROVIDER?.toLowerCase();
  return (provider === 'tavily' || provider === 'serper') && Boolean(process.env.SEARCH_API_KEY);
}

function baseUrl(): string {
  return (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function model(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

/**
 * Run a chat completion and return the assistant's text.
 *
 * Throws on transport errors, non-2xx responses and empty output so callers can
 * decide between a friendly message and a 5xx — this function never silently
 * returns placeholder prose.
 */
export async function chatComplete(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI provider not configured: set AI_API_KEY');
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const res = await fetch(`${baseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model(),
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `AI provider returned ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`,
      );
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      throw new Error('AI provider returned an empty completion');
    }

    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Optional web search. Returns [] when no provider is configured or the request
 * fails — callers treat that as "nothing found" rather than an error, so a
 * missing search key degrades the news feed instead of breaking the route.
 */
export async function webSearch(
  query: string,
  options: SearchOptions = {},
): Promise<SearchHit[]> {
  const provider = process.env.SEARCH_PROVIDER?.toLowerCase();
  const apiKey = process.env.SEARCH_API_KEY;
  const num = Math.min(Math.max(options.num ?? 10, 1), 20);

  if (!apiKey || (provider !== 'tavily' && provider !== 'serper')) {
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_SEARCH_TIMEOUT_MS);

  try {
    if (provider === 'tavily') {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: num,
          ...(options.recencyDays ? { days: options.recencyDays } : {}),
        }),
        signal: controller.signal,
      });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        results?: Array<{ title?: string; url?: string; content?: string }>;
      };
      return (data.results ?? [])
        .filter((r) => r.url)
        .map((r) => ({
          title: r.title ?? '',
          url: r.url ?? '',
          snippet: r.content ?? '',
        }));
    }

    // serper.dev — Google results
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({
        q: query,
        num,
        ...(options.recencyDays ? { tbs: `qdr:d${options.recencyDays}` } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      organic?: Array<{ title?: string; link?: string; snippet?: string }>;
    };
    return (data.organic ?? [])
      .filter((r) => r.link)
      .map((r) => ({
        title: r.title ?? '',
        url: r.link ?? '',
        snippet: r.snippet ?? '',
      }));
  } catch {
    // Network error, timeout, malformed payload — all mean "no results".
    return [];
  } finally {
    clearTimeout(timer);
  }
}
