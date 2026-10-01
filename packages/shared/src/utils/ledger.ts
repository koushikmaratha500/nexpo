export type LedgerTransactionType = 'DEBIT' | 'CREDIT';

const INCOME_CATEGORY_NAMES = new Set([
  'salary',
  'freelance',
  'investment',
  'investments',
  'gift',
  'refund',
  'income',
  'bonus',
  'dividend',
  'interest',
]);

export function isIncomeCategoryName(category?: string | null): boolean {
  if (!category?.trim()) return false;
  return INCOME_CATEGORY_NAMES.has(category.trim().toLowerCase());
}

export type LedgerTransactionLike = {
  type: LedgerTransactionType | string;
  category?: string;
  categoryType?: LedgerTransactionType | string | null;
};

export function isLedgerIncomeTransaction(t: LedgerTransactionLike): boolean {
  const normalizedType = String(t.type).toUpperCase();
  if (normalizedType === 'CREDIT') return true;
  if (t.categoryType === 'CREDIT') return true;
  if (isIncomeCategoryName(t.category)) return true;
  return false;
}

export function isLedgerExpenseTransaction(t: LedgerTransactionLike): boolean {
  if (isLedgerIncomeTransaction(t)) return false;
  return String(t.type).toUpperCase() === 'DEBIT';
}

export function parseTransactionAmount(amount: unknown): number {
  if (amount == null) return 0;
  if (typeof amount === 'number') return Number.isFinite(amount) ? amount : 0;
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof amount === 'object') {
    const maybeDecimal = amount as { toString?: () => string; valueOf?: () => number };
    if (typeof maybeDecimal.valueOf === 'function') {
      const coerced = Number(maybeDecimal.valueOf());
      if (Number.isFinite(coerced)) return coerced;
    }
    if (typeof maybeDecimal.toString === 'function') {
      const parsed = parseFloat(maybeDecimal.toString().replace(/,/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }
  const fallback = Number(amount);
  return Number.isFinite(fallback) ? fallback : 0;
}
