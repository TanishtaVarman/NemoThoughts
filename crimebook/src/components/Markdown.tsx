'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Tone = 'light' | 'dark';

/** Headers are never expected from the model; render any that slip through as bold paragraphs. */
function Heading({ children }: { children?: React.ReactNode }) {
  return <p className="my-2 font-semibold text-inherit">{children}</p>;
}

function components(tone: Tone): Components {
  const dark = tone === 'dark';
  return {
    p: ({ children }) => <p className="my-2 leading-7 first:mt-0 last:mb-0">{children}</p>,
    strong: ({ children }) => (
      <strong className={`font-semibold ${dark ? 'text-white' : 'text-zinc-950'}`}>{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className={`my-2 list-disc space-y-1.5 pl-5 first:mt-0 last:mb-0 ${dark ? 'marker:text-zinc-500' : 'marker:text-zinc-400'}`}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className={`my-2 list-decimal space-y-1.5 pl-5 first:mt-0 last:mb-0 ${dark ? 'marker:text-zinc-400' : 'marker:text-zinc-500'}`}>
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
    a: ({ children, href }) => (
      <a href={href} target="_blank" rel="noreferrer noopener" className="underline decoration-zinc-400 underline-offset-2 hover:decoration-current">
        {children}
      </a>
    ),
    code: ({ children, className }) => (
      <code
        className={`rounded px-1.5 py-0.5 font-mono text-[0.85em] ${
          dark ? 'bg-white/10 text-zinc-100' : 'border border-zinc-200 bg-zinc-100 text-zinc-900'
        } ${className ?? ''}`}
      >
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="my-3 overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950 p-4 font-mono text-[12.5px] leading-6 text-zinc-100 [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className={`my-3 border-l-2 pl-4 ${dark ? 'border-zinc-500 text-zinc-300' : 'border-zinc-300 text-zinc-600'}`}>
        {children}
      </blockquote>
    ),
    hr: () => <hr className={`my-4 ${dark ? 'border-zinc-700' : 'border-zinc-200'}`} />,
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto rounded-md border border-zinc-200">
        <table className="w-full border-collapse text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-semibold text-zinc-900">{children}</th>
    ),
    td: ({ children }) => <td className="border-b border-zinc-100 px-3 py-2 align-top">{children}</td>,
    h1: Heading,
    h2: Heading,
    h3: Heading,
    h4: Heading,
    h5: Heading,
    h6: Heading,
  };
}

const LIGHT = components('light');
const DARK = components('dark');

export default function Markdown({ children, tone = 'light' }: { children: string; tone?: Tone }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={tone === 'dark' ? DARK : LIGHT}>
      {children}
    </ReactMarkdown>
  );
}
