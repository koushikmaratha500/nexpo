'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/date';

interface ExpenseItem {
  id: string;
  type?: 'DEBIT' | 'CREDIT';
  title?: string;
  merchant?: string;
  description?: string;
  category?: { name?: string };
  budgetDepositType?: { name?: string };
  transactionDate: string | Date;
  amount: string | number;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  totalAmount: number;
}

type ReportType = 'ALL' | 'DEBIT' | 'CREDIT';

const getTypeBadge = (type?: 'DEBIT' | 'CREDIT'): string => {
  if (type === 'CREDIT') return 'bg-secondary-container/10 text-on-secondary-container';
  return 'bg-error-container/30 text-error';
};

export default function CustomerReportsPage() {
  const toast = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<ReportType>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const categoriesFetchedRef = useRef(false);
  const lastFetchedRef = useRef<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    if (categoriesFetchedRef.current) return;
    categoriesFetchedRef.current = true;
    async function loadCategories() {
      try {
        const res = await axios.get('/api/user/category');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        categoriesFetchedRef.current = false;
      }
    }
    loadCategories();
  }, []);

  // Fetch report data when filters change
  useEffect(() => {
    const cacheKey = `${typeFilter}-${selectedCategory}-${startDate}-${endDate}`;
    if (lastFetchedRef.current === cacheKey) return;
    lastFetchedRef.current = cacheKey;

    async function fetchReportData() {
      setIsLoading(true);
      try {
        const catParam = selectedCategory !== 'ALL' ? `&categoryId=${selectedCategory}` : '';
        const startParam = startDate ? `&startDate=${startDate}` : '';
        const endParam = endDate ? `&endDate=${endDate}` : '';
        const typeParam = `&type=${typeFilter}`;
        const res = await axios.get(`/api/user/reports?pageSize=1000${typeParam}${catParam}${startParam}${endParam}`);
        
        setExpenses(res.data.expenses || []);
        setCategoryBreakdown(res.data.categoryBreakdown || []);
        setTotalSpend(res.data.totalAmount || 0);
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        lastFetchedRef.current = null;
      } finally {
        setIsLoading(false);
      }
    }
    fetchReportData();
    setCurrentPage(1);
  }, [typeFilter, selectedCategory, startDate, endDate]);

  // Client-side text search filtering
  const filteredExpenses = expenses.filter(e => {
    const titleVal = e.title || e.merchant || '';
    const descVal = e.description || '';
    return titleVal.toLowerCase().includes(search.toLowerCase()) || 
           descVal.toLowerCase().includes(search.toLowerCase());
  });

  const totalItems = filteredExpenses.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.addToast('No data to export', 'warning');
      return;
    }
    const headers = ['Title', 'Description', 'Type', 'Category', 'Submission Date', 'Amount'];
    const rows = filteredExpenses.map(item => [
      `"${(item.title || item.merchant || '').replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${(item.type || 'DEBIT')}"`,
      `"${(item.category?.name || item.budgetDepositType?.name || 'Other').replace(/"/g, '""')}"`,
      `"${formatDate(item.transactionDate)}"`,
      `"${(typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount).toFixed(2)}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spend_report_${formatDate(new Date())}.csv`);
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
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Personal Spend Reports</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Analyze category weights and download statements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 ${showFilters ? 'bg-surface-container-high' : ''}`}
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
          </Button>
          <Button variant="primary" className="px-4 py-2" onClick={handleExportCSV}>
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        {(['ALL', 'DEBIT', 'CREDIT'] as const).map((f) => (
          <Button
            key={f}
            variant={typeFilter === f ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter(f)}
            className="px-3 py-2"
          >
            {f === 'ALL' ? 'All' : f}
          </Button>
        ))}
      </div>

      {/* Collapsible Filter Block */}
      {showFilters && (
        <Card className="bg-surface-container-lowest flex flex-col md:flex-row gap-4 items-center px-lg py-md animate-in slide-in-from-top duration-200" glass={false}>
          {/* Search Input */}
          <div className="relative flex-1 w-full focus-within:ring-2 ring-primary/10 rounded-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              type="text"
              placeholder="Search title or descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:ring-0 text-on-surface"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold whitespace-nowrap">Category:</span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none text-on-surface font-bold flex-1 md:flex-initial w-full md:w-40"
            >
              <option value="ALL">ALL Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold whitespace-nowrap">Start:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none text-on-surface font-bold flex-1 md:flex-initial w-full md:w-40"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold whitespace-nowrap">End:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none text-on-surface font-bold flex-1 md:flex-initial w-full md:w-40"
            />
          </div>
        </Card>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-surface-container-lowest" glass={false}>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Total Statement Amount</h4>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">
            ₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="font-label-md text-[10px] text-on-surface-variant mt-2">
            Based on {filteredExpenses.length} transactions across matching filters.
          </p>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Category Distribution</h4>
          <div className="flex gap-2 items-center h-full mt-2 overflow-x-auto scrollbar-hide py-1">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map(cat => {
                const pct = totalSpend > 0 ? Math.round((cat.totalAmount / totalSpend) * 100) : 0;
                return (
                  <div 
                    key={cat.categoryName} 
                    className="flex-1 min-w-[80px] text-center p-2 rounded-lg bg-surface-container-low border border-outline-variant/30"
                  >
                    <p className="font-label-md text-[9px] text-on-surface-variant font-bold uppercase truncate" title={cat.categoryName}>{cat.categoryName}</p>
                    <p className="font-title-md text-title-md font-black text-primary mt-1">{pct}%</p>
                  </div>
                );
              })
            ) : (
              <p className="font-label-md text-on-surface-variant italic py-2">No category data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Grid details */}
      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="px-6 py-4 border-b border-outline-variant bg-white/40">
          <h4 className="font-title-md text-title-md font-bold text-primary">Transaction Statement Items</h4>
        </div>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <span>Loading statement records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedExpenses.length > 0 ? (
                paginatedExpenses.map(item => {
                  const titleVal = item.title || item.merchant || 'Transaction';
                  const categoryName = item.category?.name || item.budgetDepositType?.name || 'Other';
                  const formattedDate = formatDate(item.transactionDate);
                  const amountVal = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-primary font-bold">{titleVal}</span>
                          <span className="text-[10px] text-on-surface-variant">{item.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 bg-secondary-container/10 text-on-secondary-container rounded-full text-[10px] font-bold">
                          {categoryName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getTypeBadge(item.type)}`}>
                          {item.type || 'DEBIT'}
                        </span>
                      </TableCell>
                      <TableCell className="text-on-surface-variant font-medium">
                        {formattedDate}
                      </TableCell>
                      <TableCell align="right" className={`font-mono-data text-mono-data font-bold ${item.type === 'CREDIT' ? 'text-secondary' : 'text-primary'}`}>
                        {item.type === 'CREDIT' ? '+' : '-'}₹{amountVal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-on-surface-variant italic">
                    No transactions matched the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
