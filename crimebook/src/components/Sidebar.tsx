'use client';

import { BookMarked, ChevronRight, ClipboardCheck, ClipboardList, MessagesSquare, Settings2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CheckKeysResponseBody, Subject } from '@/lib/types';

export type View = 'chat' | 'mistakes' | 'test' | 'corrections';

const SUB_ITEMS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'chat', label: 'Study Chat', icon: <MessagesSquare size={14} strokeWidth={1.75} /> },
  { view: 'mistakes', label: 'Mistake Book', icon: <BookMarked size={14} strokeWidth={1.75} /> },
  { view: 'test', label: 'Test', icon: <ClipboardList size={14} strokeWidth={1.75} /> },
  { view: 'corrections', label: 'Test corrections', icon: <ClipboardCheck size={14} strokeWidth={1.75} /> },
];

interface SidebarProps {
  subjects: Subject[];
  subjectId: string;
  lesson: string | null;
  view: View;
  activeCounts: Record<string, number>;
  keyStatus: CheckKeysResponseBody | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (subjectId: string, view: View) => void;
  onSelectLesson: (subjectId: string, lesson: string | null) => void;
  onOpenSettings: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { subjects, subjectId, lesson, view, activeCounts, keyStatus, open } = props;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([subjectId]));

  // Keep the active subject open when it changes from elsewhere (e.g. "Review in chat").
  useEffect(() => {
    setExpanded((prev) => (prev.has(subjectId) ? prev : new Set(prev).add(subjectId)));
  }, [subjectId]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
              <div className="text-[15px] font-semibold tracking-tight text-zinc-950"> NemoThoughts</div>
              <div className="text-[11px] text-zinc-500">AI Study Companion</div>
            </div>
          </div>
          <button className="icon-btn md:hidden" onClick={props.onClose} aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        {/* Subjects */}
        <div className="flex min-h-0 flex-1 flex-col pt-5">
          <div className="label-caps px-6 pb-2">Subjects</div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
            {subjects.map((s) => {
              const isActive = s.id === subjectId;
              const isOpen = expanded.has(s.id);
              const count = activeCounts[s.id] ?? 0;
              const panelId = `subject-panel-${s.id}`;

              return (
                <div key={s.id}>
                  <button
                    onClick={() => toggle(s.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                      isActive ? 'bg-white shadow-card ring-1 ring-zinc-200' : 'hover:bg-zinc-100'
                    }`}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={2}
                      className={`shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-zinc-900' : ''}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[13px] ${isActive ? 'font-semibold text-zinc-950' : 'font-medium text-zinc-700'}`}>
                        {s.name}
                      </div>
                      <div className="font-mono text-[10.5px] text-zinc-400">{s.code}</div>
                    </div>
                    {count > 0 && !isOpen && (
                      <span className="rounded border border-zinc-300 px-1.5 font-mono text-[10.5px] text-zinc-600">{count}</span>
                    )}
                  </button>

                  {/* Animated height via grid rows 0fr → 1fr */}
                  <div
                    id={panelId}
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      {/* `inert` keeps collapsed items out of the tab order; React 18 types lack it, so spread it. */}
                      <ul className="my-1 ml-[15px] border-l border-zinc-200 py-0.5 pl-2" {...(isOpen ? {} : { inert: '' })}>
                        {SUB_ITEMS.map((item) => {
                          const selected = isActive && view === item.view;
                          return (
                            <li key={item.view}>
                              <SubItem
                                icon={item.icon}
                                label={item.label}
                                selected={selected}
                                badge={item.view === 'mistakes' ? count : 0}
                                onClick={() => props.onNavigate(s.id, item.view)}
                              />
                              {item.view === 'chat' && selected && (
                                <ul className="mb-1 ml-[19px] mt-0.5 space-y-px">
                                  <LessonItem
                                    label="All topics"
                                    active={lesson === null}
                                    onClick={() => props.onSelectLesson(s.id, null)}
                                  />
                                  {s.lessons.map((l) => (
                                    <LessonItem key={l} label={l} active={lesson === l} onClick={() => props.onSelectLesson(s.id, l)} />
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
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

function SubItem(props: { icon: React.ReactNode; label: string; selected: boolean; badge: number; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      aria-current={props.selected ? 'page' : undefined}
      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
        props.selected ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
      }`}
    >
      <span className="flex items-center gap-2">
        {props.icon}
        {props.label}
      </span>
      {props.badge > 0 && (
        <span
          className={`rounded px-1.5 font-mono text-[10px] ${props.selected ? 'bg-white/15 text-white' : 'bg-zinc-200 text-zinc-700'}`}
        >
          {props.badge}
        </span>
      )}
    </button>
  );
}

function LessonItem(props: { label: string; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={props.onClick}
        className={`relative flex w-full items-center rounded px-2.5 py-1 text-left text-[12px] transition-colors ${
          props.active ? 'font-semibold text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        {props.active && <span className="absolute left-0 top-1/2 h-3.5 w-px -translate-y-1/2 bg-zinc-950" />}
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
