export type MonthlyDigestMode = 'preview' | 'test' | 'production';

export type DigestPeriodInput = 'previous_month' | string;

export interface DigestPeriod {
  periodKey: string;
  start: Date;
  end: Date;
  label: string;
}

export interface MonthlyDigestExpenseLine {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyDigestComparison {
  previousMonthCredit: number;
  previousMonthDebit: number;
  creditChangePercent: number | null;
  debitChangePercent: number | null;
}

export interface MonthlyDigestViewModel {
  user: {
    id: string;
    name: string;
    email: string;
  };
  period: DigestPeriod;
  summary: {
    totalCredit: number;
    totalDebit: number;
    netCashFlow: number;
  };
  comparison?: MonthlyDigestComparison;
  expenses: MonthlyDigestExpenseLine[];
  topCategories: { categoryName: string; amount: number }[];
  variant: 'full' | 'quiet';
  chartSvg: string;
  currencySymbol: string;
}

export interface MonthlyDigestBuildResult {
  digest: MonthlyDigestViewModel | null;
  skipReason?: 'no_history' | 'already_sent';
}
