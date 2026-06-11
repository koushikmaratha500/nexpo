'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MOCK_EXPENSES, MOCK_CATEGORIES } from '@/mock/data';

export default function AdminReportsPage() {
  // Date range state default to October 2023 (matching mock data dates)
  const [startDate, setStartDate] = useState('2023-10-01');
  const [endDate, setEndDate] = useState('2023-10-31');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // Filter expenses by date range normalized to local day start/end
  const filteredExpenses = useMemo(() => {
    return MOCK_EXPENSES.filter(item => {
      const itemTime = new Date(item.date).setHours(0, 0, 0, 0);
      if (startDate) {
        const startTime = new Date(startDate).setHours(0, 0, 0, 0);
        if (itemTime < startTime) return false;
      }
      if (endDate) {
        const endTime = new Date(endDate).setHours(23, 59, 59, 999);
        if (itemTime > endTime) return false;
      }
      return true;
    });
  }, [startDate, endDate]);

  // Compute aggregate metrics on filtered expenses
  const totalSpend = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  const totalCount = filteredExpenses.length;

  const avgSpend = useMemo(() => {
    return totalCount > 0 ? totalSpend / totalCount : 0;
  }, [totalSpend, totalCount]);
  
  // Category aggregation
  const categoryBreakdown = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => {
      const catObj = MOCK_CATEGORIES.find(c => c.code === curr.category);
      const catName = catObj ? catObj.name : curr.category;
      acc[catName] = (acc[catName] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredExpenses]);

  const totalItems = filteredExpenses.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const pageRange = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    pageRange.push(i);
  }

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
          <Button variant="primary">
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
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          <p className="font-label-md text-[10px] text-secondary font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_flat</span>
            <span>100% matched with bank records</span>
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
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">₹{avgSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          <p className="font-label-md text-[10px] text-on-surface-variant mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">analytics</span>
            <span>Average value per entry</span>
          </p>
        </Card>
      </div>

      {/* Bento breakdown */}
      <div className="grid grid-cols-12 gap-6">
        {/* Category chart mockup */}
        <Card className="col-span-12 md:col-span-6 bg-surface-container-lowest" glass={false}>
          <h4 className="font-title-md text-title-md font-bold text-primary mb-6">Expenditure by Category</h4>
          
          <div className="space-y-md">
            {Object.entries(categoryBreakdown).length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant font-body-md">
                No expense data found for this date range.
              </div>
            ) : (
              Object.entries(categoryBreakdown).map(([category, amount]) => {
                const maxAmount = Math.max(...Object.values(categoryBreakdown), 1);
                const percentage = (amount / maxAmount) * 100;
                return (
                  <div key={category} className="space-y-xs">
                    <div className="flex justify-between items-center text-body-md">
                      <span className="font-bold text-primary">{category}</span>
                      <span className="font-mono-data text-mono-data text-on-surface-variant">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }} 
                        className="bg-primary h-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Global Audit Ledger */}
        <Card className="col-span-12 md:col-span-6 bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
          <div className="px-6 py-4 border-b border-outline-variant bg-white/40">
            <h4 className="font-title-md text-title-md font-bold text-primary">System Ledger Audit</h4>
          </div>
          <div className="w-full overflow-x-auto scrollbar-hide">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" className="text-on-surface-variant py-8">
                    No transactions found in this period.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-primary font-bold">{item.merchant}</span>
                        <span className="text-[10px] text-on-surface-variant">{item.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-medium">
                      {MOCK_CATEGORIES.find(c => c.code === item.category)?.name || item.category}
                    </TableCell>
                    <TableCell align="right" className="font-mono-data text-mono-data font-bold text-primary">
                      -₹{item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-lg py-md border-t border-outline-variant/44 bg-surface-container-lowest gap-4">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium text-center sm:text-left">
              Showing {totalItems > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
            </span>
            <div className="flex items-center gap-sm">
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-sm py-1 rounded hover:bg-surface-container text-xs font-bold transition-all flex items-center cursor-pointer text-on-surface-variant"
                >
                  Back
                </button>
              )}
              {pageRange.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-primary text-on-primary shadow-sm active:scale-90'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {p}
                </button>
              ))}
              {currentPage < totalPages && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-sm py-1 rounded hover:bg-surface-container text-xs font-bold transition-all flex items-center cursor-pointer text-on-surface-variant"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
