'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import axios from 'axios';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  // Fetch admin dashboard stats & expenses
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [dashboardRes, reportsRes] = await Promise.all([
          axios.get('/api/admin/dashboard'),
          axios.get('/api/admin/reports?pageSize=1000')
        ]);
        setMetrics(dashboardRes.data);
        setAllExpenses(reportsRes.data.expenses?.items || []);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Group aggregate monthly spending dynamically for last 6 months
  const monthlyLedgerFlow = useMemo(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now = new Date();
    const result: { month: string; value: number }[] = [];

    // Group expenses by month for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      
      const monthlyExp = allExpenses.filter((e) => {
        const date = new Date(e.expenseDate);
        return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      });
      const expSum = monthlyExp.reduce((sum, e) => sum + (typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount), 0);
      result.push({ month: mName, value: expSum });
    }
    return result;
  }, [allExpenses]);

  // Group aggregate spending by user country dynamically
  const spendDistribution = useMemo(() => {
    const total = allExpenses.reduce((sum, e) => sum + (typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount), 0);
    const groups: Record<string, number> = {};
    allExpenses.forEach((e) => {
      const countryName = e.user?.country?.name || 'India';
      groups[countryName] = (groups[countryName] || 0) + (typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount);
    });

    return Object.entries(groups)
      .map(([region, amount]) => {
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
        return { region, amount, percentage: pct };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [allExpenses]);

  const totalUsersCount = metrics?.userCount || 0;
  const globalExpensesVolume = metrics?.totalExpenses || 0;
  const globalBudgetsVolume = metrics?.totalBudgets || 0;
  const pendingApprovalsCount = metrics?.openTicketsCount || 0;
  const recentLedgerItems = metrics?.recentExpenses || [];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Administrative Overview</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Real-time governance and expenditure metrics.</p>
        </div>
      </div>

      {/* Admin Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-fixed text-on-primary-fixed rounded-lg">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Total Registered Users</p>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">
            {isLoading ? '...' : totalUsersCount}
          </h3>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Global Budgets</p>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">
            ₹{isLoading ? '...' : globalBudgetsVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Global Expenses</p>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">
            ₹{isLoading ? '...' : globalExpensesVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container text-on-error-container rounded-lg">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Open Tickets / Approvals</p>
          <Link href="/admin/support" className="block mt-1 hover:opacity-90 transition-opacity">
            <h3 className="font-headline-md text-headline-md text-primary font-black">
              {isLoading ? '...' : pendingApprovalsCount}
            </h3>
          </Link>
        </Card>
      </div>

      {/* Main Charts & Bento Sections */}
      <div className="grid grid-cols-12 gap-6">
        {/* User Growth (Bar Chart) */}
        <Card className="col-span-12 md:col-span-7 lg:col-span-8 bg-surface-container-lowest flex flex-col gap-6" glass={false}>
          <div>
            <h4 className="font-title-md text-title-md font-bold text-primary">Monthly Ledger Flow</h4>
            <p className="font-label-md text-on-surface-variant">Global aggregate spending flow trends</p>
          </div>

          <div className="flex-1 min-h-[200px] flex items-end justify-between px-2 pb-2 select-none border-b border-outline-variant/30">
            {monthlyLedgerFlow.map((item) => {
              const maxVal = Math.max(...monthlyLedgerFlow.map((m) => m.value), 100);
              const heightPct = `${(item.value / maxVal) * 100}%`;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full px-2 h-full flex items-end">
                    <div 
                      style={{ height: heightPct }} 
                      className="w-full rounded-t-sm transition-all duration-300 bg-primary hover:bg-primary/95 cursor-pointer relative group"
                    >
                      {/* Tooltip on Hover */}
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                        ₹{item.value.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <span className="font-label-md text-[10px] sm:text-label-md text-on-surface-variant font-bold">
                    {item.month}
                  </span>
                </div>
              );
            })}
            {monthlyLedgerFlow.length === 0 && (
              <p className="italic text-on-surface-variant text-center w-full py-8">No transaction history</p>
            )}
          </div>
        </Card>

        {/* Global Distribution Map */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 bg-primary text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          {/* Decorative graphic details */}
          <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <h4 className="font-title-md text-title-md font-bold">Regional Spending Distribution</h4>
              <p className="font-label-md text-label-md opacity-70 mt-1">Ledger weight groups by user country</p>
            </div>
            
            <div className="space-y-md">
              {spendDistribution.map((region) => (
                <div key={region.region} className="space-y-xs">
                  <div className="flex justify-between items-center text-body-md">
                    <span>{region.region}</span>
                    <span className="font-mono-data text-mono-data font-bold">
                      ₹{region.amount.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${region.percentage}%` }}
                      className="bg-secondary-container h-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
              {spendDistribution.length === 0 && (
                <p className="italic text-white/70 text-center py-4">No regional data recorded</p>
              )}
            </div>
          </div>
          
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[160px]">public</span>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="col-span-12">
          <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-white/40">
              <h4 className="font-title-md text-title-md text-primary font-bold">Recent Corporate Ledger Entries</h4>
            </div>
            
            <div className="w-full overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead align="right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLedgerItems.map((item: any) => {
                    const fullName = [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || 'User';
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <span className="font-body-md text-body-md font-bold text-primary">{fullName}</span>
                        </TableCell>
                        <TableCell className="text-on-surface-variant font-medium">
                          {item.title || item.merchant || 'Expense'}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-bold">
                            {item.category?.name || 'Other'}
                          </span>
                        </TableCell>
                        <TableCell align="right" className="text-on-surface-variant font-mono-data text-mono-data">
                          ₹{(typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {recentLedgerItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-on-surface-variant italic">
                        No transactions recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
