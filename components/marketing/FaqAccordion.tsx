'use client';

import { useState } from 'react';

type FaqAccordionProps = {
  items: ReadonlyArray<{ question: string; answer: string }>;
  /** Index of the panel open on first render; only one panel open at a time. */
  defaultOpenIndex?: number | null;
};

export function FaqAccordion({ items, defaultOpenIndex = 0 }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpenIndex === undefined ? 0 : defaultOpenIndex,
  );

  return (
    <div className="space-y-3">
      {items.map((faq, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const triggerId = `faq-trigger-${index}`;

        return (
          <div
            key={faq.question}
            className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm"
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-md p-lg text-left transition-colors hover:bg-surface-container/40"
            >
              <span className="font-title-md text-title-md font-semibold text-on-surface">{faq.question}</span>
              <span
                className={`material-symbols-outlined shrink-0 text-on-surface-variant transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
              >
                keyboard_arrow_down
              </span>
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="border-t border-outline-variant/30 px-lg pb-lg pt-md animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{faq.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
