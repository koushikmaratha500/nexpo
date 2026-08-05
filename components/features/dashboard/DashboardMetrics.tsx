'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export interface DashboardMetricsProps {
  totalSpend: number;
  todaySpend: number;
  totalDeposits: number;
}

const formatAmount = (value: number): string =>
  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export function DashboardMetrics({ totalSpend, todaySpend, totalDeposits }: DashboardMetricsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-surface-container-lowest" glass={false}>
        <div className="flex justify-between items-start mb-4">
          <span className="font-label-md text-on-surface-variant opacity-70 uppercase tracking-wider font-bold">
            Total Expenses
          </span>
          <div className="p-2 bg-primary-fixed text-primary rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-sm">payments</span>
          </div>
        </div>
        <h3 className="font-headline-md text-headline-md font-black text-primary">
          {formatAmount(totalSpend)}
        </h3>
        <p className="font-label-md text-secondary flex items-center gap-1 mt-1 font-bold">
          <span className="material-symbols-outlined text-xs">trending_flat</span>
          <span>Matched with ledger records</span>
        </p>
      </Card>

      <Card className="bg-surface-container-lowest" glass={false}>
        <div className="flex justify-between items-start mb-4">
          <span className="font-label-md text-on-surface-variant opacity-70 uppercase tracking-wider font-bold">
            Today&apos;s Spend
          </span>
          <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-sm">today</span>
          </div>
        </div>
        <h3 className="font-headline-md text-headline-md font-black text-primary">
          {formatAmount(todaySpend)}
        </h3>
        <p className="font-label-md text-on-surface-variant flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-xs">schedule</span>
          <span>Real-time tracking</span>
        </p>
      </Card>

      <Card className="bg-surface-container-lowest" glass={false}>
        <div className="flex justify-between items-start mb-4">
          <span className="font-label-md text-on-surface-variant opacity-70 uppercase tracking-wider font-bold">
            Total Deposits
          </span>
          <div className="p-2 bg-surface-container-highest text-on-surface-variant rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
          </div>
        </div>
        <h3 className="font-headline-md text-headline-md font-black text-primary">
          {formatAmount(totalDeposits)}
        </h3>
        <p className="font-label-md text-on-surface-variant flex items-center gap-1 mt-1 font-bold">
          <span className="material-symbols-outlined text-xs">payments</span>
          <span>Across all funding sources</span>
        </p>
      </Card>
    </section>
  );
}
