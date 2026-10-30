'use client';

import { BookMarked, Check, Menu, MessageSquareText, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDate } from '@/lib/client';
import { getSubject } from '@/lib/subjects';
import type { Insight, Subject } from '@/lib/types';

type StatusFilter = 'active' | 'mastered' | 'all';

interface MistakeBookProps {
  subject: Subject;
  insights: Insight[];
  onToggleMastered: (id: string) => void;
  onDelete: (id: string) => void;
  onReview: (insight: Insight) => void;
  onOpenSidebar: () => void;
}

export default function MistakeBook({ subject, insights, onToggleMastered, onDelete, onReview, onOpenSidebar }: MistakeBookProps) {
  const [scope, setScope] = useState<'subject' | 'all'>('subject');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [query, setQuery] = useState('');

  const scoped = useMemo(
    () => (scope === 'subject' ? insights.filter((i) => i.subjectId === subject.id) : insights),
    [insights, scope, subject.id],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped
      .filter((i) => (status === 'all' ? true : status === 'mastered' ? i.mastered : !i.mastered))
      .filter((i) => !q || `${i.topic} ${i.rule} ${i.question}`.toLowerCase().includes(q))
      .sort((a, b) => Number(a.mastered) - Number(b.mastered) || b.hits - a.hits || b.updatedAt - a.updatedAt);
  }, [scoped, status, query]);

  const stats = {
    total: scoped.length,
    active: scoped.filter((i) => !i.mastered).length,
    mastered: scoped.filter((i) => i.mastered).length,
    repeat: scoped.filter((i) => i.hits > 1 && !i.mastered).length,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="icon-btn md:hidden" onClick={onOpenSidebar} aria-label="Open sidebar">
            <Menu size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-zinc-950">Mistake Book</h1>
            <div className="truncate text-[12px] text-zinc-500">
              {scope === 'subject' ? subject.name : 'All subjects'}
            </div>
          </div>
        </div>
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: 'subject', label: 'This subject' },
            { value: 'all', label: 'All' },
          ]}
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
          {/* Stats */}
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-zinc-200 sm:grid-cols-4">
            <Stat label="Entries" value={stats.total} />
            <Stat label="Active" value={stats.active} />
            <Stat label="Repeat weak spots" value={stats.repeat} />
            <Stat label="Mastered" value={stats.mastered} />
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'mastered', label: 'Mastered' },
                { value: 'all', label: 'All' },
              ]}
            />
            <label className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 focus-within:border-zinc-900 sm:w-64">
              <Search size={14} className="text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rules and topics"
                className="w-full bg-transparent text-[13px] placeholder:text-zinc-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </label>
          </div>

          {/* Entries */}
          {visible.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-zinc-300 px-6 py-14 text-center">
              <BookMarked size={20} strokeWidth={1.5} className="mx-auto text-zinc-400" />
              <div className="mt-3 text-[14px] font-medium text-zinc-900">
                {scoped.length === 0 ? 'No entries yet' : 'Nothing matches this filter'}
              </div>
              <p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-zinc-500">
                {scoped.length === 0
                  ? 'Ask a question in Study Chat. The rule at the end of each answer is saved here, and concepts you ask about again move to the top.'
                  : 'Try a different status filter or search term.'}
              </p>
            </div>
          ) : (
            <ol className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card">
              {visible.map((entry, idx) => (
                <Entry
                  key={entry.id}
                  index={idx + 1}
                  entry={entry}
                  showSubject={scope === 'all'}
                  onToggleMastered={() => onToggleMastered(entry.id)}
                  onDelete={() => onDelete(entry.id)}
                  onReview={() => onReview(entry)}
                />
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function Entry(props: {
  index: number;
  entry: Insight;
  showSubject: boolean;
  onToggleMastered: () => void;
  onDelete: () => void;
  onReview: () => void;
}) {
  const { entry } = props;
  const subjectName = getSubject(entry.subjectId)?.name ?? entry.subjectId;

  return (
    <li className={`group flex gap-4 px-5 py-4 ${entry.mastered ? 'bg-zinc-50' : ''}`}>
      <div className="w-6 shrink-0 pt-0.5 font-mono text-[11px] text-zinc-400">{String(props.index).padStart(2, '0')}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className={`text-[14px] font-semibold ${entry.mastered ? 'text-zinc-500 line-through decoration-zinc-400' : 'text-zinc-950'}`}>
            {entry.topic}
          </h3>
          {entry.hits > 1 && (
            <span className="rounded bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-white" title="Times this concept came up">
              ×{entry.hits}
            </span>
          )}
          {entry.mastered && <span className="label-caps text-zinc-500">Mastered</span>}
        </div>
        <div className="mt-0.5 text-[11.5px] text-zinc-400">
          {props.showSubject && `${subjectName} · `}
          {entry.lesson ?? 'General'} · {formatDate(entry.updatedAt)}
        </div>

        <p className="mt-2.5 border-l-2 border-zinc-900 pl-3 text-[13.5px] leading-6 text-zinc-800">{entry.rule}</p>
        <p className="mt-2 truncate text-[12px] text-zinc-500" title={entry.question}>
          <span className="text-zinc-400">Asked: </span>
          {entry.question}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start sm:opacity-60 sm:transition-opacity sm:group-hover:opacity-100">
        <button className="icon-btn" onClick={props.onReview} title="Review in chat" aria-label="Review in chat">
          <MessageSquareText size={15} strokeWidth={1.75} />
        </button>
        <button
          className="icon-btn"
          onClick={props.onToggleMastered}
          title={entry.mastered ? 'Mark as active' : 'Mark as mastered'}
          aria-label={entry.mastered ? 'Mark as active' : 'Mark as mastered'}
        >
          {entry.mastered ? <RotateCcw size={15} strokeWidth={1.75} /> : <Check size={15} strokeWidth={2} />}
        </button>
        <button className="icon-btn" onClick={props.onDelete} title="Delete entry" aria-label="Delete entry">
          <Trash2 size={15} strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-r border-zinc-200 bg-white px-4 py-3 last:border-r-0 sm:border-b-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r [&:nth-child(n+3)]:border-b-0">
      <div className="label-caps">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold text-zinc-950">{value}</div>
    </div>
  );
}

function Segmented<T extends string>(props: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-md border border-zinc-300 bg-white p-0.5">
      {props.options.map((o) => (
        <button
          key={o.value}
          onClick={() => props.onChange(o.value)}
          className={`rounded px-3 py-1 text-[12px] font-medium transition-colors ${
            props.value === o.value ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-950'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
