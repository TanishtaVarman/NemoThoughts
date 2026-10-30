import type { ApiErrorBody } from './types';

export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

/** fetch + JSON with the server's { error: { code, message } } contract surfaced as an exception. */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch (err) {
    throw new ClientApiError(0, 'NETWORK_ERROR', `Could not reach the CrimeBook server: ${(err as Error).message}`);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ClientApiError(res.status, 'INVALID_RESPONSE', `Server returned non-JSON (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ClientApiError(res.status, err?.code ?? `HTTP_${res.status}`, err?.message ?? `Request failed with HTTP ${res.status}.`);
  }
  return data as T;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
