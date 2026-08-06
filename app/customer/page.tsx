'use client';

import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuth } from '@/components/auth/AuthContext';
import { parseDate } from '@/lib/date';
import { DashboardMetrics, RecentTransactions } from '@/components/features/dashboard';
import { InsightCard } from '@/components/features/assistant';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { transactions, fetchTransactions } = useTransactionStore();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchTransactions();
  }, [fetchTransactions]);

  // Scope all dashboard metrics to the current month.
  const monthTransactions = React.useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = parseDate(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [transactions]);
  const expenses = React.useMemo(
    () => monthTransactions.filter((t) => t.type === 'DEBIT'),
    [monthTransactions]
  );
  const credits = React.useMemo(
    () => monthTransactions.filter((t) => t.type === 'CREDIT'),
    [monthTransactions]
  );

  const totalSpend = React.useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const todaySpend = React.useMemo(() => {
    const today = new Date().toDateString();
    return expenses
      .filter((e) => parseDate(e.date).toDateString() === today)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  // Compute daily income/expense for the current month
  const chartData = React.useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const labels: string[] = [];
    const expenseAmounts: number[] = [];
    const incomeAmounts: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      labels.push(String(day));
      const dayExp = expenses
        .filter((e) => parseDate(e.date).getDate() === day)
        .reduce((sum, e) => sum + e.amount, 0);
      expenseAmounts.push(dayExp);
      const dayCred = credits
        .filter((c) => parseDate(c.date).getDate() === day)
        .reduce((sum, c) => sum + c.amount, 0);
      incomeAmounts.push(dayCred);
    }

    return {
      labels,
      income: incomeAmounts,
      expenses: expenseAmounts,
    };
  }, [expenses, credits]);

  // Compute bar rendering parameters
  const bars = React.useMemo(() => {
    const N = chartData.labels.length;
    const segWidth = 720 / N;
    const barWidth = Math.max(8, Math.min(24, segWidth * 0.22));
    const gap = 4;
    const maxVal = Math.max(...chartData.income, ...chartData.expenses, 100);

    return chartData.labels.map((label, idx) => {
      const centerX = 40 + (idx + 0.5) * segWidth;
      const incVal = chartData.income[idx];
      const expVal = chartData.expenses[idx];

      const incHeight = (incVal / maxVal) * 200;
      const expHeight = (expVal / maxVal) * 200;

      return {
        label,
        centerX,
        income: {
          x: centerX - barWidth - gap / 2,
          y: 250 - incHeight,
          width: barWidth,
          height: incHeight,
          val: incVal,
        },
        expense: {
          x: centerX + gap / 2,
          y: 250 - expHeight,
          width: barWidth,
          height: expHeight,
          val: expVal,
        },
      };
    });
  }, [chartData]);

  // Compute category breakdown dynamically
  const categoryBreakdown = React.useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const groups: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      groups[cat] = (groups[cat] || 0) + e.amount;
    });

    const categoryColors: Record<string, string> = {
      FOOD: 'bg-secondary',
      RENT: 'bg-primary',
      TRAVEL: 'bg-outline-variant',
      UTILITIES: 'bg-surface-variant',
      SOFTWARE: 'bg-tertiary',
      MARKETING: 'bg-error',
    };

    return Object.entries(groups)
      .map(([catCode, amount]) => {
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
        return {
          name: catCode,
          percentage: pct,
          color: categoryColors[catCode] || 'bg-surface-variant',
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }, [expenses]);

  // Last 3 transactions of this month, sorted by date descending
  const recentTransactions = [...monthTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  const totalDeposits = credits.reduce((sum, c) => sum + c.amount, 0);
  const userFirstName = user?.firstName || 'User';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">
            Welcome {userFirstName}!
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Your accounts are up to date as of today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardMetrics totalSpend={totalSpend} todaySpend={todaySpend} totalDeposits={totalDeposits} />

      {/* AI Proactive Insights */}
      <InsightCard />

      {/* Bento Grid Content */}
      <section className="grid grid-cols-12 gap-6">
        {/* Main Chart */}
        <Card
          className="col-span-12 md:col-span-7 lg:col-span-8 bg-surface-container-lowest flex flex-col gap-6 min-h-[380px]"
          glass={false}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="font-title-md text-title-md font-bold text-primary">Ledger Flow Trend Analysis</h4>
              <p className="font-label-md text-on-surface-variant">Daily income and spending flow for this month</p>

              {/* Legend for Income vs Expenses */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                  <span
                    className="w-3 h-3 rounded-sm bg-secondary inline-block"
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                  />
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                  <span
                    className="w-3 h-3 rounded-sm bg-primary inline-block"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                  <span>Expenses</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full relative flex items-end justify-between px-4 pb-4 select-none min-h-[180px]">
            {/* SVG side-by-side bar chart */}
            <svg className="w-full h-full z-10" viewBox="0 0 800 300">
              {/* Grid lines */}
              <line
                x1="40"
                y1="50"
                x2="760"
                y2="50"
                stroke="var(--color-outline-variant)"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <line
                x1="40"
                y1="100"
                x2="760"
                y2="100"
                stroke="var(--color-outline-variant)"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <line
                x1="40"
                y1="150"
                x2="760"
                y2="150"
                stroke="var(--color-outline-variant)"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <line
                x1="40"
                y1="200"
                x2="760"
                y2="200"
                stroke="var(--color-outline-variant)"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <line x1="40" y1="250" x2="760" y2="250" stroke="var(--color-outline-variant)" opacity="0.5" />

              {bars.map((bar, idx) => (
                <g key={idx}>
                  {/* Income Bar (Green) */}
                  <rect
                    x={bar.income.x}
                    y={bar.income.y}
                    width={bar.income.width}
                    height={Math.max(2, bar.income.height)}
                    rx="3"
                    fill="var(--color-secondary)"
                    className="transition-all hover:opacity-85 cursor-pointer"
                  >
                    <title>{`Income (${bar.label}): ₹${bar.income.val.toFixed(2)}`}</title>
                  </rect>

                  {/* Expense Bar (Navy/Dark) */}
                  <rect
                    x={bar.expense.x}
                    y={bar.expense.y}
                    width={bar.expense.width}
                    height={Math.max(2, bar.expense.height)}
                    rx="3"
                    fill="var(--color-primary)"
                    className="transition-all hover:opacity-85 cursor-pointer"
                  >
                    <title>{`Expense (${bar.label}): ₹${bar.expense.val.toFixed(2)}`}</title>
                  </rect>

                  {/* X-Axis Labels */}
                  <text
                    x={bar.centerX}
                    y="275"
                    textAnchor="middle"
                    fill="var(--color-on-surface-variant)"
                    className="font-bold text-[10px] opacity-80"
                  >
                    {bar.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card
          className="col-span-12 md:col-span-5 lg:col-span-4 bg-surface-container-lowest flex flex-col justify-between gap-6"
          glass={false}
        >
          <h4 className="font-title-md text-title-md font-bold text-primary">Category Breakdown</h4>

          <div className="flex-1 flex items-center justify-center py-4 select-none">
            <div className="relative w-40 h-40 rounded-full border-[14px] border-surface-container-high flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-[14px] border-on-secondary-container"
                style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 50% 100%)' }}
              />
              <div className="text-center">
                <p className="font-headline-sm text-headline-sm font-black text-primary">
                  ₹{(totalSpend / 1000).toFixed(1)}k
                </p>
                <p className="font-label-md text-on-surface-variant">Total Spend</p>
              </div>
            </div>
          </div>

          <div className="space-y-sm">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-body-md">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                  <span className="font-label-md text-on-surface-variant font-medium">{cat.name}</span>
                </div>
                <span className="font-mono-data text-mono-data font-bold text-primary">{cat.percentage}%</span>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <p className="font-label-md text-on-surface-variant italic text-center py-2">No category weight data</p>
            )}
          </div>
        </Card>

        {/* Recent Transactions Table */}
        <RecentTransactions transactions={recentTransactions} />
      </section>
    </div>
  );
}
