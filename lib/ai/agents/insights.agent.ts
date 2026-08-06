import { generateObject } from 'ai';
import { withModelFallback } from '@/lib/ai/provider';
import { InsightsSchema, type InsightsResult } from '@/lib/ai/types';
import {
  detectSubscriptionsAndOverruns,
  getMonthSummary,
  monthLabel,
} from '@/lib/ai/aggregates';

export interface GenerateInsightsOptions {
  userId: string;
  today?: Date;
}

export interface GenerateInsightsResult {
  insights: InsightsResult['insights'];
  inputTokens: number;
  outputTokens: number;
}

export async function generateInsights({
  userId,
  today = new Date(),
}: GenerateInsightsOptions): Promise<GenerateInsightsResult> {
  const currentLabel = monthLabel(today);
  const prevLabel = monthLabel(new Date(today.getFullYear(), today.getMonth() - 1, 1));

  const [current, previous, opportunities] = await Promise.all([
    getMonthSummary(userId, currentLabel),
    getMonthSummary(userId, prevLabel),
    detectSubscriptionsAndOverruns(userId, today),
  ]);

  const context = {
    today: today.toISOString().slice(0, 10),
    currentMonth: currentLabel,
    previousMonth: prevLabel,
    currentMonthSummary: current,
    previousMonthSummary: previous,
    detectedSubscriptions: opportunities.subscriptions,
    categoryOverruns: opportunities.categoryOverruns,
  };

  const { object, usage } = await withModelFallback('structured', (model) =>
    generateObject({
      model,
      schema: InsightsSchema,
      system: [
        'You are the insights engine for a personal finance app. You narrate the user\'s own data into a short list of proactive insights.',
        'Only use the numbers provided in the context. Never invent figures, categories, months, or transactions.',
        'Produce at most 6 insights, ordered by importance. Prefer genuine, data-backed observations: category spending up or down vs the previous month, detected recurring subscriptions, and category overrun estimates.',
        'Each insight: a short title, a one-to-two sentence body quoting the real numbers (amounts in INR, no currency symbol), a type (spend/income/subscription/budget/savings/info) and a magnitude (low/medium/high).',
        'If the current or previous month has no transactions, reflect that honestly instead of inventing activity. If nothing is notable, return an empty insights array.',
        'These are heuristics, not professional financial advice.',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: `Generate proactive insights for the current month from this deterministic data. Keep amounts exact.\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    })
  );

  return {
    insights: object.insights,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}
