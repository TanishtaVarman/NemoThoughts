import { ApiError, describeUpstream, errorMessage, isTimeout } from './errors';
import type { SearchResponseBody } from './types';

export const TAVILY_BASE_URL = 'https://api.tavily.com';

export function getTavilyKey(): string {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) {
    throw new ApiError(
      500,
      'TAVILY_KEY_MISSING',
      'TAVILY_API_KEY is not set. Add it to .env.local and restart the server, or turn off Live research.',
    );
  }
  return key;
}

interface TavilyRaw {
  query?: string;
  answer?: string | null;
  response_time?: number;
  results?: { title?: string; url?: string; content?: string; score?: number }[];
}

export interface TavilySearchOptions {
  maxResults?: number;
  depth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  timeoutMs?: number;
}

export async function tavilySearch(query: string, opts: TavilySearchOptions = {}): Promise<SearchResponseBody & { httpStatus: number }> {
  const key = getTavilyKey();
  const trimmed = query.trim().slice(0, 400);
  if (!trimmed) throw new ApiError(400, 'SEARCH_QUERY_EMPTY', 'Search query must not be empty.');

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(`${TAVILY_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        query: trimmed,
        topic: 'general',
        search_depth: opts.depth ?? 'basic',
        max_results: opts.maxResults ?? 5,
        include_answer: opts.includeAnswer ?? false,
        include_images: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
    });
  } catch (err) {
    if (isTimeout(err)) throw new ApiError(504, 'TAVILY_TIMEOUT', 'Tavily did not respond in time.');
    throw new ApiError(502, 'TAVILY_UNREACHABLE', `Could not reach Tavily: ${errorMessage(err)}`);
  }

  if (!res.ok) {
    const detail = describeUpstream(await res.text());
    if (res.status === 401 || res.status === 403) {
      throw new ApiError(500, 'TAVILY_KEY_INVALID', `Tavily rejected TAVILY_API_KEY (HTTP ${res.status}): ${detail}`);
    }
    if (res.status === 429 || res.status === 432 || res.status === 433) {
      throw new ApiError(429, 'TAVILY_LIMIT_REACHED', `Tavily usage limit reached (HTTP ${res.status}): ${detail}`);
    }
    throw new ApiError(502, 'TAVILY_UPSTREAM_ERROR', `Tavily returned HTTP ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as TavilyRaw;
  return {
    query: trimmed,
    answer: data.answer ?? null,
    httpStatus: res.status,
    responseTimeMs: Date.now() - started,
    results: (data.results ?? [])
      .filter((r) => r.url)
      .map((r) => ({
        title: r.title?.trim() || r.url!,
        url: r.url!,
        content: r.content ?? '',
        score: r.score ?? 0,
      })),
  };
}
