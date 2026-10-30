import { NextResponse } from 'next/server';
import { ApiError, errorResponse } from '@/lib/errors';
import { tavilySearch } from '@/lib/tavily';
import type { SearchResponseBody } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { query?: unknown; maxResults?: unknown; depth?: unknown; includeAnswer?: unknown }
      | null;

    if (!body || typeof body.query !== 'string' || !body.query.trim()) {
      throw new ApiError(400, 'BAD_REQUEST', '"query" must be a non-empty string.');
    }

    const maxResults =
      typeof body.maxResults === 'number' ? Math.min(Math.max(Math.round(body.maxResults), 1), 10) : 5;
    const depth = body.depth === 'advanced' ? 'advanced' : 'basic';

    const { httpStatus: _status, ...result } = await tavilySearch(body.query, {
      maxResults,
      depth,
      includeAnswer: body.includeAnswer === true,
    });
    return NextResponse.json<SearchResponseBody>(result);
  } catch (err) {
    return errorResponse(err);
  }
}
