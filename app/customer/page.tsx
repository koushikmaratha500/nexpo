'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MOCK_EXPENSES, MOCK_CATEGORY_BREAKDOWN } from '@/mock/data';

export default function CustomerDashboard() {
  // Filter expenses matching the customer Alex Sterling
  const personalExpenses = MOCK_EXPENSES.filter(e => e.submittedBy === 'Alex Sterling');
  const totalSpend = personalExpenses.reduce((sum, item) => sum + item.amount, 0);

  // Chart range state
  const [selectedRange, setSelectedRange] = React.useState('Last 6 months');

  // Compute label and value data dynamically
  const chartData = React.useMemo(() => {
    switch (selectedRange) {
      case 'Current year (YTM)':
        return {
          labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
          income: [1500, 1600, 1400, 1800, 2200, 2000],
          expenses: [850, 1200, 980, 1450, 1800, 1550]
        };
      case 'Last Year':
        return {
          labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
          income: [1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500],
          expenses: [900, 1100, 950, 1300, 1200, 1400, 1500, 1350, 1600, 1750, 1900, 2100]
        };
      case 'Last 6 months':
        return {
          labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
          income: [1500, 1600, 1400, 1800, 2200, 2000],
          expenses: [850, 1200, 980, 1450, 1800, 1550]
        };
      case 'Last 3 month':
        return {
          labels: ['APR', 'MAY', 'JUN'],
          income: [1800, 2200, 2000],
          expenses: [1450, 1800, 1550]
        };
      case 'Last month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          income: [600, 550, 700, 650],
          expenses: [450, 320, 580, 450]
        };
      case 'Current month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          income: [500, 600, 550, 580],
          expenses: [380, 490, 310, 370]
        };
      default:
        return {
          labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
          income: [1500, 1600, 1400, 1800, 2200, 2000],
          expenses: [850, 1200, 980, 1450, 1800, 1550]
        };
    }
  }, [selectedRange]);

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
          val: incVal
        },
        expense: {
          x: centerX + gap / 2,
          y: 250 - expHeight,
          width: barWidth,
          height: expHeight,
          val: expVal
        }
      };
    });
  }, [chartData]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Welcome Koushik!</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Your accounts are up to date as of today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-on-surface-variant opacity-70 uppercase tracking-wider font-bold">Total Expenses</span>
            <div className="p-2 bg-primary-fixed text-primary rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-sm">payments</span>
            </div>
          </div>
          <h3 className="font-headline-md text-headline-md font-black text-primary">
            ₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="font-label-md text-secondary flex items-center gap-1 mt-1 font-bold">
            <span className="material-symbols-outlined text-xs">arrow_upward</span>
            <span>+8.4% from last period</span>
          </p>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-on-surface-variant opacity-70 uppercase tracking-wider font-bold">Today's Spend</span>
            <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-sm">today</span>
            </div>
          </div>
          <h3 className="font-headline-md text-headline-md font-black text-primary">₹45.20</h3>
          <p className="font-label-md text-on-surface-variant flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <span>Last entry 2h ago</span>
          </p>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-on-surface-variant opacity-70 uppercase tracking-wider font-bold">Monthly Trend</span>
            <div className="p-2 bg-surface-container-highest text-on-surface-variant rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-sm">trending_up</span>
            </div>
          </div>
          <h3 className="font-headline-md text-headline-md font-black text-primary">+12%</h3>
          <p className="font-label-md text-on-surface-variant flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">show_chart</span>
            <span>Trending vs last month</span>
          </p>
        </Card>
      </section>

      {/* Bento Grid Content */}
      <section className="grid grid-cols-12 gap-6">
        {/* Main Chart */}
        <Card className="col-span-12 md:col-span-7 lg:col-span-8 bg-surface-container-lowest flex flex-col gap-6 min-h-[380px]" glass={false}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="font-title-md text-title-md font-bold text-primary">Expense Trend Analysis</h4>
              <p className="font-label-md text-on-surface-variant">Consolidated monthly spending across all categories</p>

              {/* Legend for Income vs Expenses */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                  <span className="w-3 h-3 rounded-sm bg-secondary inline-block" style={{ backgroundColor: 'var(--color-secondary)' }} />
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                  <span className="w-3 h-3 rounded-sm bg-primary inline-block" style={{ backgroundColor: 'var(--color-primary)' }} />
                  <span>Expenses</span>
                </div>
              </div>
            </div>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="bg-transparent border-none font-label-md text-on-surface-variant focus:ring-0 cursor-pointer text-primary font-bold flex-shrink-0"
            >
              <option value="Current year (YTM)">Current year (YTM)</option>
              <option value="Last Year">Last Year</option>
              <option value="Last 6 months">Last 6 months</option>
              <option value="Last 3 month">Last 3 month</option>
              <option value="Last month">Last month</option>
              <option value="Current month">Current month</option>
            </select>
          </div>

          <div className="flex-1 w-full relative flex items-end justify-between px-4 pb-4 select-none min-h-[180px]">
            {/* SVG side-by-side bar chart */}
            <svg className="w-full h-full z-10" viewBox="0 0 800 300">
              {/* Grid lines */}
              <line x1="40" y1="50" x2="760" y2="50" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
              <line x1="40" y1="100" x2="760" y2="100" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
              <line x1="40" y1="150" x2="760" y2="150" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
              <line x1="40" y1="200" x2="760" y2="200" stroke="var(--color-outline-variant)" strokeDasharray="4 4" opacity="0.3" />
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
                    <title>{`Income (${bar.label}): ₹${bar.income.val}`}</title>
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
                    <title>{`Expense (${bar.label}): ₹${bar.expense.val}`}</title>
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

        {/* Category Breakdown (Donut Chart Simulation) */}
        <Card className="col-span-12 md:col-span-5 lg:col-span-4 bg-surface-container-lowest flex flex-col justify-between gap-6" glass={false}>
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
            {MOCK_CATEGORY_BREAKDOWN.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-body-md">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                  <span className="font-label-md text-on-surface-variant font-medium">{cat.name}</span>
                </div>
                <span className="font-mono-data text-mono-data font-bold text-primary">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Transactions Table */}
        <div className="col-span-12">
          <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
            <div className="p-6 flex items-center justify-between border-b border-outline-variant bg-white/40">
              <h4 className="font-title-md text-title-md font-bold text-primary">Recent Transactions</h4>
              <Link href="/customer/expenses" className="text-primary font-label-md hover:underline decoration-2 underline-offset-4">
                View All Activity
              </Link>
            </div>

            <div className="w-full overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personalExpenses.slice(0, 3).map((item) => {
                    const iconName = item.category === 'FOOD' ? 'restaurant' : item.category === 'TRAVEL' ? 'flight' : 'home_work';
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30">
                              <span className="material-symbols-outlined text-sm">{iconName}</span>
                            </div>
                            <div>
                              <p className="font-body-md text-body-md font-bold text-primary">{item.merchant}</p>
                              <p className="font-label-md text-on-surface-variant">{item.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-secondary-container/10 text-on-secondary-container rounded-full text-[10px] font-bold">
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-label-md text-on-surface-variant">
                          {item.date}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'VERIFIED' ? 'bg-secondary' : item.status === 'PENDING' ? 'bg-on-tertiary-container' : 'bg-error'
                              }`} />
                            <span className={`font-label-md ${item.status === 'VERIFIED' ? 'text-secondary' : item.status === 'PENDING' ? 'text-on-tertiary-container' : 'text-error'
                              }`}>{item.status}</span>
                          </div>
                        </TableCell>
                        <TableCell align="right" className="font-mono-data text-mono-data text-right font-bold text-primary">
                          -₹{item.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
