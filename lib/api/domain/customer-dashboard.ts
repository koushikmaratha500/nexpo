import type { ClientTransaction } from '@/lib/transactions/map-client-transaction';

export interface CustomerDashboardChart {
  labels: string[];
  income: number[];
  expenses: number[];
}

export interface CustomerDashboardCategory {
  name: string;
  percentage: number;
  color: string;
}

export interface CustomerDashboardPayload {
  month: string;
  totalSpend: number;
  todaySpend: number;
  totalDeposits: number;
  chart: CustomerDashboardChart;
  categoryBreakdown: CustomerDashboardCategory[];
  recentTransactions: ClientTransaction[];
}
