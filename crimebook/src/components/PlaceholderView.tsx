'use client';

import { Menu } from 'lucide-react';
import type { Subject } from '@/lib/types';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  subject: Subject;
  onOpenSidebar: () => void;
}

export default function PlaceholderView({ title, description, icon, subject, onOpenSidebar }: PlaceholderViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 px-4 md:px-8">
        <button className="icon-btn md:hidden" onClick={onOpenSidebar} aria-label="Open sidebar">
          <Menu size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-tight text-zinc-950">{title}</h1>
          <div className="truncate text-[12px] text-zinc-500">{subject.name}</div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-dashed border-zinc-300 px-6 py-14 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-500">{icon}</div>
          <div className="mt-4 text-[14px] font-semibold text-zinc-950">{title}</div>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-zinc-500">{description}</p>
          <span className="label-caps mt-5 inline-block rounded border border-zinc-300 px-2 py-0.5">In development</span>
        </div>
      </div>
    </div>
  );
}
