'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import type { Insight } from '@/lib/ai/types';

export interface InsightCardProps {
  className?: string;
}

interface InsightsPayload {
  insights: Insight[];
  generatedFor: string;
}

type LoadState = 'loading' | 'ready' | 'hidden';

const TYPE_META: Record<Insight['type'], { icon: string; label: string }> = {
  spend: { icon: 'credit_score', label: 'Spending' },
  income: { icon: 'trending_up', label: 'Income' },
  subscription: { icon: 'repeat', label: 'Subscription' },
  budget: { icon: 'speed', label: 'Budget' },
  savings: { icon: 'savings', label: 'Savings' },
  info: { icon: 'lightbulb', label: 'Info' },
};

const MAGNITUDE_DOT: Record<Insight['magnitude'], string> = {
  low: 'bg-surface-variant',
  medium: 'bg-tertiary',
  high: 'bg-error',
};

function formatInr(amount?: number): string {
  return typeof amount === 'number' ? `\u20B9${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '';
}

export function InsightCard({ className = '' }: InsightCardProps) {
  const [state, setState] = useState<LoadState>('loading');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [generatedFor, setGeneratedFor] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await axios.get<InsightsPayload>('/api/ai/insights');
      setInsights(res.data.insights ?? []);
      setGeneratedFor(res.data.generatedFor ?? '');
      setState('ready');
    } catch {
      // AI disabled (503) or any failure → hide the section quietly.
      setState('hidden');
    }
  }, []);

  useEffect(() => {
    // AbortController genuinely cancels the in-flight request on cleanup.
    // Under React StrictMode (on by default in dev) the effect double-invokes
    // mount → cleanup → mount: the first request is aborted before it can be
    // processed server-side, so only one `/api/ai/insights` call is made.
    const controller = new AbortController();
    (async () => {
      setState('loading');
      try {
        const res = await axios.get<InsightsPayload>('/api/ai/insights', { signal: controller.signal });
        setInsights(res.data.insights ?? []);
        setGeneratedFor(res.data.generatedFor ?? '');
        setState('ready');
      } catch (err) {
        if (axios.isCancel(err)) return;
        setState('hidden');
      }
    })();
    return () => {
      controller.abort();
    };
  }, []);

  if (state === 'hidden') {
    return null;
  }

  const monthLabel =
    generatedFor.length === 10
      ? new Date(`${generatedFor}T00:00:00`).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      : '';

  return (
    <Card className={`bg-surface-container-lowest ${className}`} glass={false}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
          <div>
            <h4 className="font-title-md text-title-md font-bold text-primary">AI Insights</h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {monthLabel ? `Proactive observations for ${monthLabel}` : 'Proactive observations for your money'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={state === 'loading'}
          title="Refresh insights"
          className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>

      {state === 'loading' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-surface-container-high/60 animate-pulse" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant italic py-3">
          Nothing notable yet. As you add more transactions, Finlit will surface insights here.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight) => {
            const typeMeta = TYPE_META[insight.type] ?? TYPE_META.info;
            return (
              <div
                key={insight.id}
                className="flex items-start gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-low p-3.5"
              >
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                  {typeMeta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-body-md text-body-md font-bold text-on-surface">{insight.title}</span>
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${MAGNITUDE_DOT[insight.magnitude] ?? MAGNITUDE_DOT.low}`}
                      title={`${insight.magnitude} priority`}
                    />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{insight.body}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container/10 text-on-secondary-container text-label-sm font-bold">
                      {typeMeta.label}
                    </span>
                    {typeof insight.amount === 'number' && (
                      <span className="font-mono-data text-mono-data text-primary font-bold">
                        {formatInr(insight.amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
