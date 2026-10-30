import { NextResponse } from 'next/server';
import { ApiError, errorMessage } from '@/lib/errors';
import { NEBIUS_BASE_URL, knownModelIds, listNebiusModels, resolveModel } from '@/lib/nebius';
import { TAVILY_BASE_URL, tavilySearch } from '@/lib/tavily';
import type { CheckKeysResponseBody, NebiusStatus, ServiceState, ServiceStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function stateFor(err: unknown): { state: ServiceState; httpStatus: number | null; message: string } {
  if (err instanceof ApiError) {
    if (err.code.endsWith('_KEY_MISSING')) return { state: 'missing', httpStatus: null, message: err.message };
    if (err.code.endsWith('_KEY_INVALID')) return { state: 'invalid', httpStatus: err.status, message: err.message };
    return { state: 'error', httpStatus: err.status, message: err.message };
  }
  return { state: 'error', httpStatus: null, message: errorMessage(err) };
}

async function checkNebius(): Promise<NebiusStatus> {
  const configured = Boolean(process.env.NEBIUS_API_KEY?.trim());
  const defaultModel = resolveModel();
  const base = { service: 'nebius' as const, endpoint: NEBIUS_BASE_URL, configured, defaultModel };
  const started = Date.now();

  try {
    const available = new Set((await listNebiusModels()).map((id) => id.toLowerCase()));
    const models = knownModelIds().map((id) => ({ id, available: available.has(id.toLowerCase()) }));
    const usable = models.filter((m) => m.available).length;
    return {
      ...base,
      state: 'connected',
      httpStatus: 200,
      latencyMs: Date.now() - started,
      message: `Key accepted. ${usable} of ${models.length} Nemotron models available to this account.`,
      models,
    };
  } catch (err) {
    return {
      ...base,
      ...stateFor(err),
      latencyMs: configured ? Date.now() - started : null,
      models: knownModelIds().map((id) => ({ id, available: false })),
    };
  }
}

async function checkTavily(): Promise<ServiceStatus> {
  const configured = Boolean(process.env.TAVILY_API_KEY?.trim());
  const base = { service: 'tavily' as const, endpoint: TAVILY_BASE_URL, configured };
  const started = Date.now();

  try {
    // Smallest possible authenticated request (1 basic-search credit).
    const res = await tavilySearch('Tavily API connectivity check', { maxResults: 1, depth: 'basic', timeoutMs: 15_000 });
    return {
      ...base,
      state: 'connected',
      httpStatus: res.httpStatus,
      latencyMs: Date.now() - started,
      message: 'Key accepted. Live research is available.',
    };
  } catch (err) {
    return { ...base, ...stateFor(err), latencyMs: configured ? Date.now() - started : null };
  }
}

export async function GET() {
  const [nebius, tavily] = await Promise.all([checkNebius(), checkTavily()]);
  const ok = nebius.state === 'connected' && tavily.state === 'connected';
  const body: CheckKeysResponseBody = { ok, checkedAt: new Date().toISOString(), nebius, tavily };
  // Full diagnostics are always returned; a non-200 status flags that at least one service is unusable.
  return NextResponse.json(body, { status: ok ? 200 : 500 });
}
