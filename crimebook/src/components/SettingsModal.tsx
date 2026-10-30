'use client';

import { Loader2, RefreshCw, X } from 'lucide-react';
import { useEffect } from 'react';
import { MODELS, type ModelId } from '@/lib/models';
import type { CheckKeysResponseBody, ServiceState, ServiceStatus } from '@/lib/types';

export interface SessionMetrics {
  requests: number;
  failures: number;
  totalLatencyMs: number;
  lastLatencyMs: number | null;
  totalTokens: number;
  researchCalls: number;
}

interface SettingsModalProps {
  status: CheckKeysResponseBody | null;
  checking: boolean;
  checkError: string | null;
  metrics: SessionMetrics;
  model: ModelId;
  onModelChange: (model: ModelId) => void;
  onRecheck: () => void;
  onClearChats: () => void;
  onClearMistakes: () => void;
  onClose: () => void;
}

const STATE_LABEL: Record<ServiceState, string> = {
  connected: 'Connected',
  missing: 'Key missing',
  invalid: 'Key invalid',
  error: 'Error',
};

export default function SettingsModal(props: SettingsModalProps) {
  const { status, checking, metrics } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  const succeeded = metrics.requests - metrics.failures;
  const avgLatency = succeeded > 0 ? metrics.totalLatencyMs / succeeded : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={props.onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border border-zinc-200 bg-white shadow-panel sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 id="settings-title" className="text-[15px] font-semibold tracking-tight text-zinc-950">
              Settings
            </h2>
            <p className="text-[12px] text-zinc-500">Connections, model and local data</p>
          </div>
          <button className="icon-btn" onClick={props.onClose} aria-label="Close settings">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* Connections */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="label-caps">API connections</div>
              <div className="flex items-center gap-3">
                {status && (
                  <span className="font-mono text-[10.5px] text-zinc-400">
                    Checked {new Date(status.checkedAt).toLocaleTimeString()}
                  </span>
                )}
                <button className="btn-outline py-1 text-[12px]" onClick={props.onRecheck} disabled={checking}>
                  {checking ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {checking ? 'Checking' : 'Re-check'}
                </button>
              </div>
            </div>

            {props.checkError && (
              <div className="mb-3 rounded-md border border-zinc-900 px-3 py-2 text-[12.5px] text-zinc-800">{props.checkError}</div>
            )}

            <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              <ServiceRow
                name="Nebius Token Factory"
                envVar="NEBIUS_API_KEY"
                service={status?.nebius ?? null}
                checking={checking}
              />
              <ServiceRow name="Tavily Search" envVar="TAVILY_API_KEY" service={status?.tavily ?? null} checking={checking} />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-zinc-400">
              Keys are read on the server from .env.local and never reach the browser. Each Tavily check uses one search credit.
            </p>
          </section>

          {/* Model */}
          <section>
            <div className="label-caps mb-3">Tutor model</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODELS.map((m) => {
                const selected = props.model === m.id;
                const availability = status?.nebius.models.find((x) => x.id === m.id);
                const known = status?.nebius.state === 'connected';
                return (
                  <button
                    key={m.id}
                    onClick={() => props.onModelChange(m.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      selected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-zinc-950">{m.label}</span>
                      <span className={`h-3.5 w-3.5 rounded-full border ${selected ? 'border-[4px] border-zinc-900' : 'border-zinc-300'}`} />
                    </div>
                    <div className="mt-0.5 text-[12px] text-zinc-500">{m.detail}</div>
                    <div className="mt-2 truncate font-mono text-[10.5px] text-zinc-400">{m.id}</div>
                    {known && (
                      <div className="mt-1 font-mono text-[10.5px] text-zinc-600">
                        {availability?.available ? '● Available on this key' : '○ Not listed for this key'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Session metrics */}
          <section>
            <div className="label-caps mb-3">Session metrics</div>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-zinc-200 sm:grid-cols-4">
              <Metric label="Requests" value={String(metrics.requests)} />
              <Metric label="Failures" value={String(metrics.failures)} />
              <Metric label="Avg latency" value={avgLatency === null ? '—' : `${(avgLatency / 1000).toFixed(2)}s`} />
              <Metric label="Tokens" value={metrics.totalTokens.toLocaleString()} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10.5px] text-zinc-400">
              <span>Last: {metrics.lastLatencyMs === null ? '—' : `${(metrics.lastLatencyMs / 1000).toFixed(2)}s`}</span>
              <span>Research calls: {metrics.researchCalls}</span>
            </div>
          </section>

          {/* Data */}
          <section>
            <div className="label-caps mb-3">Local data</div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-outline"
                onClick={() => window.confirm('Delete every conversation in every subject?') && props.onClearChats()}
              >
                Clear all chats
              </button>
              <button
                className="btn-outline"
                onClick={() => window.confirm('Delete every Mistake Book entry? This cannot be undone.') && props.onClearMistakes()}
              >
                Clear Mistake Book
              </button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">Chats and Mistake Book entries are stored in this browser only.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({ name, envVar, service, checking }: { name: string; envVar: string; service: ServiceStatus | null; checking: boolean }) {
  const state = service?.state;
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-zinc-950">{name}</div>
          <div className="truncate font-mono text-[10.5px] text-zinc-400">{service?.endpoint ?? envVar}</div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            !service
              ? 'border border-zinc-200 text-zinc-400'
              : state === 'connected'
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-900 text-zinc-900'
          }`}
        >
          {!service ? (checking ? 'Checking…' : 'Unknown') : STATE_LABEL[service.state]}
        </span>
      </div>

      {service && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <MiniMetric label="Key" value={service.configured ? 'Present' : 'Not set'} />
            <MiniMetric label="HTTP" value={service.httpStatus === null ? '—' : String(service.httpStatus)} />
            <MiniMetric label="Latency" value={service.latencyMs === null ? '—' : `${service.latencyMs} ms`} />
          </div>
          <p className="mt-2.5 break-words text-[12px] leading-5 text-zinc-600">{service.message}</p>
        </>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="font-mono text-[12.5px] text-zinc-900">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-r border-zinc-200 px-4 py-3 last:border-r-0 sm:border-b-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r [&:nth-child(n+3)]:border-b-0">
      <div className="label-caps">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
