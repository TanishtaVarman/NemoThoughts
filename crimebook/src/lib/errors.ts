import { NextResponse } from 'next/server';
import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorResponse(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  console.error('[crimebook] unhandled error', err);
  const message = err instanceof Error ? err.message : 'Unknown server error.';
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
}

/** Extract a readable message from an upstream error payload. */
export function describeUpstream(text: string): string {
  try {
    const data = JSON.parse(text);
    const candidate =
      data?.error?.message ?? data?.detail?.error ?? data?.detail ?? data?.message ?? data?.error;
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  } catch {
    // not JSON — fall through to raw text
  }
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(0, 300) : 'No error details returned.';
}

export function isTimeout(err: unknown): boolean {
  return err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: { code?: string; message?: string } }).cause;
    return cause?.code ? `${err.message} (${cause.code})` : err.message;
  }
  return String(err);
}
