import { tool } from 'ai';
import { z } from 'zod';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';
import {
  dateHints,
  detectSubscriptionsAndOverruns,
  getMonthSummary,
  mapTransaction,
  monthRange,
  monthLabel,
  type MonthSummary,
} from '@/lib/ai/aggregates';

const MAX_BATCH = 500;

export function createFinanceTools(userId: string, today = new Date()) {
  const hints = dateHints(today);
  return {
    readTransactions: tool({
      description: `${hints} Read the user's own transactions, optionally filtered by date range, type (DEBIT/CREDIT) or category name. Returns a bounded, newest-first list plus matching counts.`,
      inputSchema: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date inclusive, YYYY-MM-DD.'),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('End date inclusive, YYYY-MM-DD.'),
        type: z.enum(['DEBIT', 'CREDIT']).optional(),
        category: z.string().optional().describe('Category name, e.g. Groceries.'),
        pageSize: z.number().int().min(1).max(100).default(25),
      }),
      execute: async ({ from, to, type, category, pageSize }) => {
        const start = from ? new Date(`${from}T00:00:00`) : undefined;
        const end = to ? new Date(`${to}T23:59:59.999`) : undefined;
        const { items, total } = await TransactionRepository.findAll({
          userId,
          type,
          startDate: start,
          endDate: end,
          page: 1,
          pageSize: MAX_BATCH,
        });
        let mapped = items.map(mapTransaction);
        if (category) {
          const needle = category.toLowerCase();
          mapped = mapped.filter((t) => t.category?.toLowerCase() === needle);
        }
        const limited = mapped.slice(0, pageSize);
        const totalSpend = mapped
          .filter((t) => t.type === 'DEBIT')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = mapped
          .filter((t) => t.type === 'CREDIT')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          count: limited.length,
          totalMatching: mapped.length,
          truncated: total > MAX_BATCH,
          totalSpend,
          totalIncome,
          items: limited,
        };
      },
    }),

    monthlySummary: tool({
      description: `${hints} Aggregate the user's spending and income for a single month, broken down by category. Use this to answer "how much did I spend on X last month" or "compare this month vs last". If the requested month has no data, check the returned availableMonths and retry with a month that has data.`,
      inputSchema: z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/).describe('Month in YYYY-MM format.'),
      }),
      execute: async ({ month }) => {
        const range = monthRange(month);
        if (!range) {
          return { month, error: 'Invalid month format. Use YYYY-MM.' };
        }
        const summary = await getMonthSummary(userId, month);
        return {
          month: summary.month,
          totalSpend: summary.totalSpend,
          totalIncome: summary.totalIncome,
          net: summary.net,
          transactionCount: summary.transactionCount,
          truncated: summary.truncated,
          availableMonths: summary.availableMonths,
          categories: summary.categories,
        };
      },
    }),

    forecastCashflow: tool({
      description: `${hints} Estimate future cashflow from the user's recent history. Returns per-month income/spend/net for the trailing N months and an average-based projection. This is a simple heuristic estimate, not a guarantee.`,
      inputSchema: z.object({
        months: z.number().int().min(1).max(12).default(3).describe('Number of trailing months to analyse (default 3).'),
      }),
      execute: async ({ months }) => {
        const rows: Array<{ month: string; income: number; spend: number; net: number }> = [];
        for (let i = months - 1; i >= 0; i -= 1) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const label = monthLabel(d);
          const summary: MonthSummary = await getMonthSummary(userId, label);
          rows.push({
            month: label,
            income: summary.totalIncome,
            spend: summary.totalSpend,
            net: summary.net,
          });
        }
        const withData = rows.filter((r) => r.income > 0 || r.spend > 0);
        const avgIncome = withData.length
          ? withData.reduce((s, r) => s + r.income, 0) / withData.length
          : 0;
        const avgSpend = withData.length
          ? withData.reduce((s, r) => s + r.spend, 0) / withData.length
          : 0;
        return {
          estimated: true,
          months: rows,
          avgIncome: Math.round(avgIncome * 100) / 100,
          avgSpend: Math.round(avgSpend * 100) / 100,
          projectedNetNextMonth: Math.round((avgIncome - avgSpend) * 100) / 100,
          caveat: 'Averages are a simple heuristic based on recent months; not a financial forecast.',
        };
      },
    }),

    getSavingsOpportunities: tool({
      description: `${hints} Detect recurring subscriptions and unusually expensive categories from the user's history. Returns heuristic findings the user could act on.`,
      inputSchema: z.object({}),
      execute: async () => {
        const { subscriptions, categoryOverruns } = await detectSubscriptionsAndOverruns(userId, today);
        return {
          found: subscriptions.length + categoryOverruns.length,
          subscriptions,
          categoryOverruns,
          caveat: 'Heuristic detection from the last 6 months; not a guarantee.',
        };
      },
    }),
  };
}
