'use client';

import { AlertTriangle, RotateCcw, Settings2, X } from 'lucide-react';

interface ErrorBannerProps {
  code: string;
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  onOpenSettings?: () => void;
}

export default function ErrorBanner({ code, message, onRetry, onDismiss, onOpenSettings }: ErrorBannerProps) {
  const keyProblem = /_KEY_(MISSING|INVALID)$/.test(code);

  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-zinc-900 bg-white p-4 shadow-card">
      <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-zinc-950" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-zinc-950">Request failed</span>
          <span className="rounded border border-zinc-300 px-1.5 font-mono text-[10px] uppercase tracking-wide text-zinc-600">
            {code}
          </span>
        </div>
        <p className="mt-1 break-words text-[13px] leading-6 text-zinc-700">{message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {onRetry && (
            <button className="btn-primary" onClick={onRetry}>
              <RotateCcw size={13} /> Retry
            </button>
          )}
          {keyProblem && onOpenSettings && (
            <button className="btn-outline" onClick={onOpenSettings}>
              <Settings2 size={13} /> Check keys
            </button>
          )}
        </div>
      </div>
      <button className="icon-btn -mr-1 -mt-1 h-7 w-7" onClick={onDismiss} aria-label="Dismiss error">
        <X size={14} />
      </button>
    </div>
  );
}
