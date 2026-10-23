'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/auth/AuthContext';
import { DashboardMetrics, RecentTransactions } from '@/components/features/dashboard';
import { InsightCard } from '@/components/features/assistant';
import { UpcomingReminders } from '@/components/features/notifications';
import type { CustomerDashboardPayload } from '@/lib/api/domain/customer-dashboard';
import type { Transaction } from '@/store/transactionStore';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const hasFetchedRef = useRef(false);
  const [dashboard, setDashboard] = useState<CustomerDashboardPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await axios.get<CustomerDashboardPayload>('/api/user/dashboard');
        setDashboard(res.data);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Failed to load dashboard';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  const chartData = useMemo(
    () => dashboard?.chart ?? { labels: [] as string[], income: [] as number[], expenses: [] as number[] },
    [dashboard?.chart],
  );

  const bars = useMemo(() => {
    const N = chartData.labels.length || 1;
    const segWidth = 720 / N;
    const barWidth = Math.max(8, Math.min(24, segWidth * 0.22));
    const gap = 4;
    const maxVal = Math.max(...chartData.income, ...chartData.expenses, 100);

    return chartData.labels.map((label, idx) => {
      const centerX = 40 + (idx + 0.5) * segWidth;
      const incVal = chartData.income[idx] ?? 0;
      const expVal = chartData.expenses[idx] ?? 0;

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

  const totalSpend = dashboard?.totalSpend ?? 0;
  const todaySpend = dashboard?.todaySpend ?? 0;
  const totalDeposits = dashboard?.totalDeposits ?? 0;
  const categoryBreakdown = dashboard?.categoryBreakdown ?? [];
  const recentTransactions = (dashboard?.recentTransactions ?? []) as Transaction[];
  const userFirstName = user?.firstName || 'User';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">
            Welcome {userFirstName}!
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Your accounts are up to date as of today.</p>
        </div>
      </div>

      {loadError && (
        <p className="font-body-md text-error" role="alert">
          {loadError}
        </p>
      )}

      {isLoading && !dashboard ? (
        <p className="font-body-md text-on-surface-variant">Loading dashboard...</p>
      ) : (
        <>
          <DashboardMetrics totalSpend={totalSpend} todaySpend={todaySpend} totalDeposits={totalDeposits} />

          <InsightCard />

          <UpcomingReminders />

          <section className="grid grid-cols-12 gap-6">
            <Card
              className="col-span-12 md:col-span-7 lg:col-span-8 bg-surface-container-lowest flex flex-col gap-6 min-h-[380px]"
              glass={false}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="font-title-md text-title-md font-bold text-primary">Ledger Flow Trend Analysis</h4>
                  <p className="font-label-md text-on-surface-variant">Daily income and spending flow for this month</p>

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
                <svg className="w-full h-full z-10" viewBox="0 0 800 300">
                  <line x1="40" y1="50" x2="760" y2="50" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
                  <line x1="40" y1="100" x2="760" y2="100" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
                  <line x1="40" y1="150" x2="760" y2="150" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
                  <line x1="40" y1="200" x2="760" y2="200" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
                  <line x1="40" y1="250" x2="760" y2="250" stroke="var(--color-outline-variant)" opacity="0.5" />

                  {bars.map((bar, idx) => (
                    <g key={idx}>
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

            <RecentTransactions transactions={recentTransactions} />
          </section>
        </>
      )}
    </div>
  );
}
