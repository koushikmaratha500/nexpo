import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/repositories/transaction.repository', () => ({
  TransactionRepository: {
    serializeAmount: (t: Record<string, unknown>) => String(t.amount ?? '0'),
    findAll: vi.fn(),
    findDistinctMonths: vi.fn(),
  },
}));

import {
  dateHints,
  detectSubscriptionsAndOverruns,
  getMonthSummary,
  mapTransaction,
  monthLabel,
  monthRange,
  toYmd,
} from '@/lib/ai/aggregates';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';

const repo = TransactionRepository as unknown as {
  findAll: ReturnType<typeof vi.fn>;
  findDistinctMonths: ReturnType<typeof vi.fn>;
};

describe('date/string helpers', () => {
  it('formats a date to YYYY-MM-DD', () => {
    expect(toYmd(new Date(2026, 6, 5))).toBe('2026-07-05');
  });

  it('labels a month as YYYY-MM', () => {
    expect(monthLabel(new Date(2026, 7, 1))).toBe('2026-08');
    expect(monthLabel(new Date(2026, 0, 15))).toBe('2026-01');
  });

  it('computes month ranges', () => {
    const range = monthRange('2026-07');
    expect(range).not.toBeNull();
    expect(range!.start.getFullYear()).toBe(2026);
    expect(range!.start.getMonth()).toBe(6);
    expect(range!.end.getMonth()).toBe(7);
    expect(monthRange('2026-13')).toBeNull();
    expect(monthRange('2026-00')).toBeNull();
    expect(monthRange('not-a-month')).toBeNull();
  });

  it('builds date hints anchored on the injected today', () => {
    const hints = dateHints(new Date(2026, 7, 6));
    expect(hints).toContain('2026-08-06');
    expect(hints).toContain('"This month" = 2026-08,');
    expect(hints).toContain('"last month" = 2026-07');
  });
});

describe('mapTransaction', () => {
  it('maps a repository row to a plain row', () => {
    const row = mapTransaction({
      transactionDate: new Date(2026, 6, 5),
      title: 'Fresh Mart',
      merchant: 'Fresh Mart',
      type: 'DEBIT',
      amount: '1499.40',
      category: { name: 'Groceries' },
      currency: { code: 'INR' },
    });
    expect(row).toEqual({
      date: '2026-07-05',
      title: 'Fresh Mart',
      merchant: 'Fresh Mart',
      type: 'DEBIT',
      amount: 1499.4,
      category: 'Groceries',
      currency: 'INR',
    });
  });

  it('handles missing category/merchant', () => {
    const row = mapTransaction({
      transactionDate: '2026-07-05T00:00:00.000Z',
      title: 'Cash',
      type: 'DEBIT',
      amount: '50',
      category: null,
      currency: null,
    });
    expect(row.category).toBeNull();
    expect(row.merchant).toBeNull();
    expect(row.amount).toBe(50);
  });
});

describe('getMonthSummary', () => {
  const items = [
    {
      transactionDate: new Date(2026, 6, 10),
      title: 'Salary',
      merchant: 'Acme Corp',
      type: 'CREDIT',
      amount: '1000',
      category: { name: 'Salary' },
      currency: { code: 'INR' },
    },
    {
      transactionDate: new Date(2026, 6, 6),
      title: 'Fresh Mart',
      merchant: 'Fresh Mart',
      type: 'DEBIT',
      amount: '500',
      category: { name: 'Groceries' },
      currency: { code: 'INR' },
    },
    {
      transactionDate: new Date(2026, 6, 5),
      title: 'Fresh Mart',
      merchant: 'Fresh Mart',
      type: 'DEBIT',
      amount: '1500',
      category: { name: 'Groceries' },
      currency: { code: 'INR' },
    },
  ];

  it('aggregates spend/income per category, newest-first', async () => {
    repo.findAll.mockResolvedValue({ items, total: items.length });
    repo.findDistinctMonths.mockResolvedValue(['2026-06', '2026-07']);

    const summary = await getMonthSummary('u1', '2026-07');

    expect(summary.totalSpend).toBe(2000);
    expect(summary.totalIncome).toBe(1000);
    expect(summary.net).toBe(-1000);
    expect(summary.transactionCount).toBe(3);
    expect(summary.availableMonths).toEqual(['2026-06', '2026-07']);
    expect(summary.categories[0]).toEqual({ category: 'Groceries', spend: 2000, income: 0, count: 2 });
    expect(summary.categories[1]).toEqual({ category: 'Salary', spend: 0, income: 1000, count: 1 });
  });

  it('returns zeros with availableMonths for an invalid month', async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 0 });
    repo.findDistinctMonths.mockResolvedValue(['2026-07']);

    const summary = await getMonthSummary('u1', '2026-13');
    expect(summary.totalSpend).toBe(0);
    expect(summary.availableMonths).toEqual(['2026-07']);
  });
});

describe('detectSubscriptionsAndOverruns', () => {
  it('detects recurring merchants and category overruns over the last 6 months', async () => {
    const items = [
      { transactionDate: new Date(2026, 7, 1), title: 'Netflix', merchant: 'Netflix', type: 'DEBIT', amount: '299', category: { name: 'Entertainment' }, currency: { code: 'INR' } },
      { transactionDate: new Date(2026, 7, 3), title: 'Fresh Mart', merchant: 'Fresh Mart', type: 'DEBIT', amount: '700', category: { name: 'Groceries' }, currency: { code: 'INR' } },
      { transactionDate: new Date(2026, 6, 1), title: 'Netflix', merchant: 'Netflix', type: 'DEBIT', amount: '299', category: { name: 'Entertainment' }, currency: { code: 'INR' } },
      { transactionDate: new Date(2026, 6, 6), title: 'Fresh Mart', merchant: 'Fresh Mart', type: 'DEBIT', amount: '400', category: { name: 'Groceries' }, currency: { code: 'INR' } },
      { transactionDate: new Date(2026, 5, 1), title: 'Netflix', merchant: 'Netflix', type: 'DEBIT', amount: '299', category: { name: 'Entertainment' }, currency: { code: 'INR' } },
      { transactionDate: new Date(2026, 5, 6), title: 'Fresh Mart', merchant: 'Fresh Mart', type: 'DEBIT', amount: '400', category: { name: 'Groceries' }, currency: { code: 'INR' } },
      { transactionDate: new Date(2026, 4, 1), title: 'Netflix', merchant: 'Netflix', type: 'DEBIT', amount: '299', category: { name: 'Entertainment' }, currency: { code: 'INR' } },
      { transactionDate: new Date(2026, 4, 6), title: 'Fresh Mart', merchant: 'Fresh Mart', type: 'DEBIT', amount: '400', category: { name: 'Groceries' }, currency: { code: 'INR' } },
    ];
    repo.findAll.mockResolvedValue({ items, total: items.length });

    const result = await detectSubscriptionsAndOverruns('u1', new Date(2026, 7, 6));

    const netflix = result.subscriptions.find((s) => s.merchant === 'Netflix');
    expect(netflix).toBeDefined();
    expect(netflix!.distinctMonths).toBe(4);
    expect(netflix!.avgMonthlyAmount).toBe(299);

    const grocery = result.categoryOverruns.find((c) => c.category === 'Groceries');
    expect(grocery).toBeDefined();
    expect(grocery!.recentSpend).toBe(700);
    expect(grocery!.averageSpend).toBe(475);
  });

  it('excludes merchants seen in fewer than 3 months', async () => {
    repo.findAll.mockResolvedValue({
      items: [
        { transactionDate: new Date(2026, 7, 1), title: 'One-off', merchant: 'One-off', type: 'DEBIT', amount: '100', category: null, currency: { code: 'INR' } },
        { transactionDate: new Date(2026, 6, 1), title: 'One-off', merchant: 'One-off', type: 'DEBIT', amount: '100', category: null, currency: { code: 'INR' } },
      ],
      total: 2,
    });

    const result = await detectSubscriptionsAndOverruns('u1', new Date(2026, 7, 6));
    expect(result.subscriptions).toEqual([]);
  });
});
