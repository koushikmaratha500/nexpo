import {
  isLedgerExpenseTransaction,
  isLedgerIncomeTransaction,
  parseTransactionAmount,
  type LedgerTransactionLike,
} from '@/lib/transactions/ledger';

export type LedgerRowLike = Omit<LedgerTransactionLike, 'category' | 'categoryType'> & {
  amount: unknown;
  category?: string | null;
  categoryType?: string | null;
};

export function sumPersonalLedgerTotals(rows: LedgerRowLike[]): {
  totalExpenses: number;
  totalDeposits: number;
} {
  let totalExpenses = 0;
  let totalDeposits = 0;
  for (const row of rows) {
    const amount = parseTransactionAmount(row.amount);
    const ledgerLike: LedgerTransactionLike = {
      type: row.type,
      category: row.category ?? undefined,
      categoryType: row.categoryType ?? undefined,
    };
    if (isLedgerExpenseTransaction(ledgerLike)) {
      totalExpenses += amount;
    } else if (isLedgerIncomeTransaction(ledgerLike)) {
      totalDeposits += amount;
    }
  }
  return { totalExpenses, totalDeposits };
}
