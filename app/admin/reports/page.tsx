'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import axios from 'axios';
import { formatDate } from '@/lib/date';

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const lastFetchedRef = useRef<string | null>(null);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin reports data
  useEffect(() => {
    const cacheKey = `${startDate}-${endDate}`;
    if (lastFetchedRef.current === cacheKey) return;
    lastFetchedRef.current = cacheKey;

    async function loadReports() {
      setIsLoading(true);
      try {
        const startParam = startDate ? `&startDate=${startDate}` : '';
        const endParam = endDate ? `&endDate=${endDate}` : '';
        const res = await axios.get(`/api/admin/reports?pageSize=1000${startParam}${endParam}`);
        setExpenses(res.data.expenses?.items || []);
      } catch (err) {
        console.error('Failed to load admin reports:', err);
        lastFetchedRef.current = null;
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [startDate, endDate]);

  // Compute aggregates dynamically
  const totalSpend = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount), 0);
  }, [expenses]);

  const totalCount = expenses.length;

  const avgSpend = useMemo(() => {
    return totalCount > 0 ? totalSpend / totalCount : 0;
  }, [totalSpend, totalCount]);

  // Group by category dynamically
  const categoryBreakdown = useMemo(() => {
    return expenses.reduce((acc, curr) => {
      const catName = curr.category?.name || 'Other';
      const amountVal = typeof curr.amount === 'string' ? parseFloat(curr.amount) : curr.amount;
      acc[catName] = (acc[catName] || 0) + amountVal;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);


  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['User', 'Title', 'Description', 'Category', 'Submission Date', 'Amount'];
    const rows = expenses.map(item => [
      `"${[item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ').replace(/"/g, '""')}"`,
      `"${(item.title || item.merchant || '').replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${(item.category?.name || 'Other').replace(/"/g, '""')}"`,
      `"${formatDate(item.expenseDate)}"`,
      `"${(typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount).toFixed(2)}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `global_spend_report_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Global Expenditure Reports</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Audit reports and analytics of company assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print Ledger</span>
          </Button>
          <Button variant="primary" onClick={handleExportCSV}>
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Download CSV</span>
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="bg-surface-container-lowest" glass={false}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-md">calendar_month</span>
            <span className="font-title-md font-bold">Filter Ledger by Date Range</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <label className="font-label-md text-on-surface-variant font-bold uppercase text-[11px]">Start</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary font-bold"
              />
            </div>
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <label className="font-label-md text-on-surface-variant font-bold uppercase text-[11px]">End</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary font-bold"
              />
            </div>
            {(startDate || endDate) && (
              <Button 
                variant="ghost" 
                className="text-error hover:bg-error-container/10 px-4 py-2 h-auto text-label-md font-bold"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface-container-lowest" glass={false}>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Total Disbursed Volume</h4>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">
            ₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="font-label-md text-[10px] text-secondary font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_flat</span>
            <span>Matched with ledger records</span>
          </p>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Total Transactions Count</h4>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">{totalCount}</h3>
          <p className="font-label-md text-[10px] text-on-surface-variant mt-2">
            Total recorded ledger entries in period
          </p>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Average Transaction Value</h4>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">
            ₹{avgSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="font-label-md text-[10px] text-on-surface-variant mt-2">
            Dynamic average of filtered dataset
          </p>
        </Card>
      </div>

      {/* Category Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-surface-container-lowest" glass={false}>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold mb-4">Category Distribution</h4>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([catName, amountVal]) => {
              const amount = amountVal as number;
              const percentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between items-center text-body-md text-on-surface-variant">
                    <span className="font-semibold text-primary">{catName}</span>
                    <span className="font-mono-data font-bold">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percentage}%` }}
                      className="bg-primary h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(categoryBreakdown).length === 0 && (
              <p className="italic text-on-surface-variant text-center py-4">No categories recorded in this range</p>
            )}
          </div>
        </Card>

        <Card className="bg-surface-container-lowest flex flex-col justify-between" glass={false}>
          <div>
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold mb-2">Category Weight Shares</h4>
            <p className="text-body-small text-on-surface-variant">Proportional weights of cost centers globally.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center py-4">
            {Object.entries(categoryBreakdown).map(([catName, amountVal]) => {
              const amount = amountVal as number;
              const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
              return (
                <div key={catName} className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-center min-w-[100px] flex-1">
                  <p className="font-label-md text-[9px] text-on-surface-variant font-bold uppercase truncate">{catName}</p>
                  <p className="font-headline-sm text-headline-sm font-black text-primary mt-1">{pct}%</p>
                </div>
              );
            })}
            {Object.keys(categoryBreakdown).length === 0 && (
              <p className="italic text-on-surface-variant text-center w-full">No records found</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
