'use client';

import React from 'react';
import { AiAssistant } from '@/components/features/assistant';

export default function CustomerAssistantPage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">AI Assistant</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Ask Finlit about your spending, income, cashflow forecasts and subscriptions.
          </p>
        </div>
      </div>

      <AiAssistant />
    </div>
  );
}
