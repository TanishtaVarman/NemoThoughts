'use client';

import { BookMarked, MessagesSquare, Settings2, X } from 'lucide-react';
import type { CheckKeysResponseBody, Subject } from '@/lib/types';

export type View = 'chat' | 'mistakes';

interface SidebarProps {
  subjects: Subject[];
  subjectId: string;
  lesson: string | null;
  view: View;
  activeCounts: Record<string, number>;
  keyStatus: CheckKeysResponseBody | null;
  open: boolean;
  onClose: () => void;
  onSelectSubject: (id: string) => void;
  onSelectLesson: (lesson: string | null) => void;
  onSelectView: (view: View) => void;
  onOpenSettings: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { subjects, subjectId, lesson, view, activeCounts, keyStatus, open } = props;
  const totalActive = Object.values(activeCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={props.onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-zinc-950 font-mono text-[11px] font-bold tracking-tight text-white">
              CB
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight text-zinc-950">CrimeBook</div>
              <div className="text-[11px] text-zinc-500">AI Study Companion</div>
            </div>
          </div>
          <button className="icon-btn md:hidden" onClick={props.onClose} aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        {/* Views */}
        <nav className="space-y-0.5 px-3 pt-4">
          <NavItem
            active={view === 'chat'}
            icon={<MessagesSquare size={15} strokeWidth={1.75} />}
            label="Study Chat"
            onClick={() => props.onSelectView('chat')}
          />
          <NavItem
            active={view === 'mistakes'}
            icon={<BookMarked size={15} strokeWidth={1.75} />}
            label="Mistake Book"
            badge={totalActive}
            onClick={() => props.onSelectView('mistakes')}
          />
        </nav>

        {/* Subjects */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <div className="label-caps px-6 pb-2">Subjects</div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
            {subjects.map((s) => {
              const active = s.id === subjectId;
              const count = activeCounts[s.id] ?? 0;
              return (
                <div key={s.id}>
                  <button
                    onClick={() => props.onSelectSubject(s.id)}
                    className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
                      active ? 'bg-white shadow-card ring-1 ring-zinc-200' : 'hover:bg-zinc-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`truncate text-[13px] ${active ? 'font-semibold text-zinc-950' : 'font-medium text-zinc-700'}`}>
                        {s.name}
                      </div>
                      <div className="font-mono text-[10.5px] text-zinc-400">{s.code}</div>
                    </div>
                    {count > 0 && (
                      <span className="ml-2 rounded border border-zinc-300 px-1.5 font-mono text-[10.5px] text-zinc-600">
                        {count}
                      </span>
                    )}
                  </button>

                  {active && (
                    <ul className="my-1.5 ml-[18px] border-l border-zinc-200 pl-2">
                      <LessonItem label="All topics" active={lesson === null} onClick={() => props.onSelectLesson(null)} />
                      {s.lessons.map((l) => (
                        <LessonItem key={l} label={l} active={lesson === l} onClick={() => props.onSelectLesson(l)} />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-zinc-200 p-3">
          <button
            onClick={props.onOpenSettings}
            className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition-colors hover:bg-zinc-100"
          >
            <div className="flex items-center gap-2.5">
              <Settings2 size={15} strokeWidth={1.75} className="text-zinc-600" />
              <span className="text-[13px] font-medium text-zinc-800">Settings</span>
            </div>
            <StatusDot status={keyStatus} />
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem(props: { active: boolean; icon: React.ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
        props.active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
      }`}
    >
      <span className="flex items-center gap-2.5">
        {props.icon}
        {props.label}
      </span>
      {props.badge ? (
        <span
          className={`rounded px-1.5 font-mono text-[10.5px] ${props.active ? 'bg-white/15 text-white' : 'bg-zinc-200 text-zinc-700'}`}
        >
          {props.badge}
        </span>
      ) : null}
    </button>
  );
}

function LessonItem(props: { label: string; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={props.onClick}
        className={`relative flex w-full items-center rounded px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
          props.active ? 'font-semibold text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        {props.active && <span className="absolute -left-[9px] top-1/2 h-4 w-px -translate-y-1/2 bg-zinc-950" />}
        {props.label}
      </button>
    </li>
  );
}

function StatusDot({ status }: { status: CheckKeysResponseBody | null }) {
  const label = !status ? 'Not checked' : status.ok ? 'Connected' : 'Attention';
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          !status ? 'border border-zinc-400' : status.ok ? 'bg-zinc-900' : 'border border-zinc-900 bg-white'
        }`}
      />
      {label}
    </span>
  );
}
