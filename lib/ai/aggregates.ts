import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';

const MAX_BATCH = 500;

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthRange(month: string): { start: Date; end: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const zeroBased = Number(m[2]) - 1;
  if (zeroBased < 0 || zeroBased > 11) return null;
  return { start: new Date(year, zeroBased, 1), end: new Date(year, zeroBased + 1, 1) };
}

export function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function dateHints(today: Date): string {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const prev = new Date(y, today.getMonth() - 1, 1);
  const prevLabel = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  return `Today is ${y}-${m}-${d}. "This month" = ${y}-${m}, "last month" = ${prevLabel}. Use YYYY-MM format exactly.`;
}

export function monthLabel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export interface TransactionRow {
  date: string;
  title: string;
  merchant: string | null;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  category: string | null;
  currency: string | null;
}

export function mapTransaction(t: Record<string, unknown>): TransactionRow {
  const category = t.category as { name?: string } | null;
  return {
    date: toYmd(asDate(t.transactionDate as Date | string)),
    title: String(t.title ?? ''),
    merchant: t.merchant ? String(t.merchant) : null,
    type: t.type as 'DEBIT' | 'CREDIT',
    amount: Number(TransactionRepository.serializeAmount(t)),
    category: category?.name ?? null,
    currency: (t.currency as { code?: string } | null)?.code ?? null,
  };
}

export interface MonthSummary {
  month: string;
  totalSpend: number;
  totalIncome: number;
  net: number;
  transactionCount: number;
  truncated: boolean;
  availableMonths: string[];
  categories: Array<{ category: string; spend: number; income: number; count: number }>;
}

export async function getMonthSummary(userId: string, month: string): Promise<MonthSummary> {
  const range = monthRange(month);
  if (!range) {
    return {
      month,
      totalSpend: 0,
      totalIncome: 0,
      net: 0,
      transactionCount: 0,
      truncated: false,
      availableMonths: await TransactionRepository.findDistinctMonths(userId),
      categories: [],
    };
  }
  const { items, total } = await TransactionRepository.findAll({
    userId,
    startDate: range.start,
    endDate: new Date(range.end.getTime() - 1),
    page: 1,
    pageSize: MAX_BATCH,
  });
  const rows = items.map(mapTransaction);
  const byCategory = new Map<string, { spend: number; income: number; count: number }>();
  for (const t of rows) {
    const key = t.category ?? 'Uncategorized';
    const bucket = byCategory.get(key) ?? { spend: 0, income: 0, count: 0 };
    if (t.type === 'DEBIT') bucket.spend += t.amount;
    else bucket.income += t.amount;
    bucket.count += 1;
    byCategory.set(key, bucket);
  }
  const categories = [...byCategory.entries()]
    .map(([category, { spend, income, count }]) => ({
      category,
      spend: Math.round(spend * 100) / 100,
      income: Math.round(income * 100) / 100,
      count,
    }))
    .sort((a, b) => b.spend - a.spend);
  const totalSpend = categories.reduce((s, c) => s + c.spend, 0);
  const totalIncome = categories.reduce((s, c) => s + c.income, 0);
  return {
    month,
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    net: Math.round((totalIncome - totalSpend) * 100) / 100,
    transactionCount: rows.length,
    truncated: total > MAX_BATCH,
    availableMonths: await TransactionRepository.findDistinctMonths(userId),
    categories,
  };
}

export interface SavingsOpportunity {
  subscriptions: Array<{
    merchant: string;
    distinctMonths: number;
    avgMonthlyAmount: number;
  }>;
  categoryOverruns: Array<{
    category: string;
    recentSpend: number;
    averageSpend: number;
  }>;
}

export async function detectSubscriptionsAndOverruns(
  userId: string,
  today = new Date()
): Promise<SavingsOpportunity> {
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const { items } = await TransactionRepository.findAll({
    userId,
    type: 'DEBIT',
    startDate: start,
    page: 1,
    pageSize: MAX_BATCH,
  });
  const rows = items.map(mapTransaction);

  const byMerchant = new Map<string, { amounts: number[]; months: Set<string> }>();
  for (const t of rows) {
    const key = (t.merchant ?? t.title).trim().toLowerCase();
    if (!key) continue;
    const bucket = byMerchant.get(key) ?? { amounts: [], months: new Set<string>() };
    bucket.amounts.push(t.amount);
    bucket.months.add(t.date.slice(0, 7));
    byMerchant.set(key, bucket);
  }

  const subscriptions: SavingsOpportunity['subscriptions'] = [];
  for (const [merchant, { amounts, months }] of byMerchant) {
    if (months.size >= 3) {
      const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
      subscriptions.push({
        merchant: merchant.replace(/\b\w/g, (c) => c.toUpperCase()),
        distinctMonths: months.size,
        avgMonthlyAmount: Math.round(avg * 100) / 100,
      });
    }
  }
  subscriptions.sort((a, b) => b.avgMonthlyAmount - a.avgMonthlyAmount);

  const byCategory = new Map<string, number[]>();
  for (const t of rows) {
    const key = t.category ?? 'Uncategorized';
    const bucket = byCategory.get(key) ?? [];
    bucket.push(t.amount);
    byCategory.set(key, bucket);
  }
  const categoryOverruns: SavingsOpportunity['categoryOverruns'] = [];
  for (const [category, amounts] of byCategory) {
    if (amounts.length < 3) continue;
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const latest = amounts[0];
    if (latest > avg * 1.3 && avg > 0) {
      categoryOverruns.push({
        category,
        recentSpend: Math.round(latest * 100) / 100,
        averageSpend: Math.round(avg * 100) / 100,
      });
    }
  }
  categoryOverruns.sort((a, b) => b.recentSpend - a.recentSpend);

  return { subscriptions: subscriptions.slice(0, 10), categoryOverruns: categoryOverruns.slice(0, 10) };
}
