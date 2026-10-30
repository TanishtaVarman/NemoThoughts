'use client';

import { BookmarkCheck, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { formatTime } from '@/lib/client';
import { splitRule } from '@/lib/format';
import { modelLabel } from '@/lib/models';
import type { ChatMessage } from '@/lib/types';
import Markdown from './Markdown';

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-zinc-900 px-4 py-3 text-[14px] text-zinc-100 shadow-card">
            <Markdown tone="dark">{message.content}</Markdown>
          </div>
          <div className="mt-1.5 pr-1 text-right font-mono text-[10.5px] text-zinc-400">{formatTime(message.createdAt)}</div>
        </div>
      </div>
    );
  }

  return <AssistantCard message={message} />;
}

function AssistantCard({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const { body, rule } = splitRule(message.content);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — nothing to do.
    }
  };

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[92%] md:max-w-[80%]">
        <article className="group rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-5 py-4 text-[14px] text-zinc-800 shadow-card">
          <Markdown>{body}</Markdown>

          {rule && (
            <div className="mt-4 border-l-2 border-zinc-950 bg-zinc-50 py-2.5 pl-4 pr-3">
              <div className="label-caps text-zinc-950">Rule to remember</div>
              <div className="mt-1 text-[13.5px] font-medium leading-6 text-zinc-950">
                <Markdown>{rule}</Markdown>
              </div>
            </div>
          )}

          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-3">
              <div className="label-caps mb-1.5">Sources</div>
              <ol className="space-y-1">
                {message.sources.map((s, i) => (
                  <li key={s.url} className="flex gap-2 text-[12px] leading-5">
                    <span className="font-mono text-zinc-400">[{i + 1}]</span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="truncate text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950 hover:decoration-zinc-900"
                      title={s.url}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </article>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-1 font-mono text-[10.5px] text-zinc-400">
          <span>{formatTime(message.createdAt)}</span>
          {message.model && <span>{modelLabel(message.model)}</span>}
          {typeof message.latencyMs === 'number' && <span>{(message.latencyMs / 1000).toFixed(1)}s</span>}
          {message.loggedTopic && (
            <span className="flex items-center gap-1 text-zinc-600">
              <BookmarkCheck size={11} />
              Logged · {message.loggedTopic}
            </span>
          )}
          <button onClick={copy} className="flex items-center gap-1 hover:text-zinc-900" aria-label="Copy answer">
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
