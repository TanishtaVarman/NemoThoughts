'use client';

import { ArrowUp, Globe, Menu, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { modelLabel } from '@/lib/models';
import type { ChatMessage, Subject } from '@/lib/types';
import ErrorBanner from './ErrorBanner';
import MessageBubble from './MessageBubble';

interface ChatViewProps {
  subject: Subject;
  lesson: string | null;
  messages: ChatMessage[];
  pending: boolean;
  busyElsewhere: boolean;
  error: { code: string; message: string } | null;
  draft: string;
  model: string;
  research: boolean;
  onDraftChange: (value: string) => void;
  onSend: (text: string) => void;
  onRetry: () => void;
  onDismissError: () => void;
  onToggleResearch: () => void;
  onClear: () => void;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

export default function ChatView(props: ChatViewProps) {
  const { subject, lesson, messages, pending, error, draft } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const disabled = pending || props.busyElsewhere;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, pending, error]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [subject.id, lesson]);

  const submit = () => {
    const text = draft.trim();
    if (!text || disabled) return;
    props.onSend(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="icon-btn md:hidden" onClick={props.onOpenSidebar} aria-label="Open sidebar">
            <Menu size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">{subject.name}</h1>
              <span className="hidden font-mono text-[11px] text-zinc-400 sm:inline">{subject.code}</span>
            </div>
            <div className="truncate text-[12px] text-zinc-500">{lesson ?? 'All topics'}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={props.onToggleResearch}
            aria-pressed={props.research}
            title="Enrich answers with live Tavily web research"
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
              props.research ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900'
            }`}
          >
            <Globe size={13} strokeWidth={1.75} />
            <span className="hidden sm:inline">Live research</span>
            <span className="font-mono text-[10px] uppercase">{props.research ? 'On' : 'Off'}</span>
          </button>
          <button
            onClick={props.onOpenSettings}
            className="hidden rounded-full border border-zinc-200 px-3 py-1 font-mono text-[11px] text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 lg:block"
            title="Change model in Settings"
          >
            {modelLabel(props.model)}
          </button>
          <button
            className="icon-btn"
            onClick={props.onClear}
            disabled={messages.length === 0 || pending}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-8">
          {messages.length === 0 && !pending && (
            <EmptyState subject={subject} lesson={lesson} onPick={(p) => props.onDraftChange(p)} />
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {pending && <ThinkingCard research={props.research} />}

          {error && (
            <ErrorBanner
              code={error.code}
              message={error.message}
              onRetry={props.onRetry}
              onDismiss={props.onDismissError}
              onOpenSettings={props.onOpenSettings}
            />
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-zinc-200 bg-white px-4 pb-4 pt-3 md:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border border-zinc-300 bg-white p-2 shadow-card transition-colors focus-within:border-zinc-900">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => props.onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={`Ask about ${lesson ?? subject.name}…`}
              className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-6 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              onClick={submit}
              disabled={disabled || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition-colors hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400"
              aria-label="Send message"
            >
              <ArrowUp size={16} strokeWidth={2.25} />
            </button>
          </div>
          <div className="mt-2 flex justify-between px-1 text-[11px] text-zinc-400">
            <span>
              {props.busyElsewhere ? 'Waiting for a reply in another subject…' : 'Enter to send · Shift + Enter for a new line'}
            </span>
            <span className="hidden sm:inline">Rules are logged to your Mistake Book automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ subject, lesson, onPick }: { subject: Subject; lesson: string | null; onPick: (p: string) => void }) {
  const prompts = lesson
    ? [
        `Explain the core idea of ${lesson} in simple terms.`,
        `What is the most common mistake students make with ${lesson}?`,
        `Give me a worked example on ${lesson}.`,
        `Test me with one question on ${lesson}.`,
      ]
    : subject.prompts;

  return (
    <div className="pt-6 md:pt-14">
      <div className="label-caps">{subject.code}</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 md:text-[28px]">{lesson ?? subject.name}</h2>
      <p className="mt-2 max-w-lg text-[14px] leading-6 text-zinc-500">
        Ask anything you are stuck on. Every answer ends with a rule to remember, and that rule goes into your Mistake Book.
      </p>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left text-[13px] leading-5 text-zinc-700 shadow-card transition-colors hover:border-zinc-900 hover:text-zinc-950"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingCard({ research }: { research: boolean }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-5 py-4 shadow-card">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 animate-blink rounded-full bg-zinc-900" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </span>
        <span className="text-[12.5px] text-zinc-500">
          {research ? 'Researching with Tavily, then reasoning with Nemotron…' : 'Nemotron is reasoning…'}
        </span>
      </div>
    </div>
  );
}
