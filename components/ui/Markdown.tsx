'use client';

import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeMarkdownHref } from '@/lib/markdown/sanitizeLink';

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => (
    <h1 className="font-title-md text-title-md font-bold text-on-surface mt-3 mb-1.5 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-title-md text-title-md font-bold text-on-surface mt-3 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-body-lg text-body-lg font-bold text-on-surface mt-2.5 mb-1 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-body-md text-body-md font-bold text-on-surface mt-2 mb-1 first:mt-0">{children}</h4>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => {
    const safeHref = sanitizeMarkdownHref(href);
    if (!safeHref) {
      return <span className="text-primary">{children}</span>;
    }
    return (
      <a href={safeHref} target="_blank" rel="noreferrer" className="text-primary underline hover:opacity-80">
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 italic text-on-surface-variant my-2">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-outline-variant" />,
  code: ({ children }) => (
    <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-[0.85em] font-mono-data">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-surface-container-high p-3 rounded-lg overflow-x-auto my-2 text-[0.85em] font-mono-data whitespace-pre">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-outline-variant">
      <table className="w-full border-collapse text-body-md">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-container-high">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-outline-variant/50 last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-1.5 text-left font-bold text-on-surface whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-1.5 text-on-surface align-top">{children}</td>,
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="font-body-md text-body-md text-on-surface leading-relaxed break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
