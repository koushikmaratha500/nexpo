'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MOCK_EXPENSES, MOCK_CATEGORIES } from '@/mock/data';

export default function CustomerReportsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('2023-10-01');
  const [endDate, setEndDate] = useState('2023-10-31');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, startDate, endDate]);

  const personalExpenses = MOCK_EXPENSES.filter(e => e.submittedBy === 'Alex Sterling');
  
  // Filter personal expenses
  const filteredExpenses = personalExpenses.filter(e => {
    const matchesSearch = e.merchant.toLowerCase().includes(search.toLowerCase()) || 
                          e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    
    const itemTime = new Date(e.date).setHours(0, 0, 0, 0);
    let matchesDate = true;
    if (startDate) {
      const startTime = new Date(startDate).setHours(0, 0, 0, 0);
      if (itemTime < startTime) matchesDate = false;
    }
    if (endDate) {
      const endTime = new Date(endDate).setHours(23, 59, 59, 999);
      if (itemTime > endTime) matchesDate = false;
    }
    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalSpend = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

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

  // Compute filtered category breakdown dynamically based on current filtered dataset
  const filteredCategoryBreakdown = MOCK_CATEGORIES.map(cat => {
    const amount = filteredExpenses
      .filter(e => e.category === cat.code)
      .reduce((sum, item) => sum + item.amount, 0);
    const percentage = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
    return {
      name: cat.name,
      percentage,
      color: cat.color
    };
  }).filter(cat => cat.percentage > 0);

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ['Title', 'Description', 'Category', 'Submission Date', 'Amount'];
    const rows = filteredExpenses.map(item => [
      `"${item.merchant.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.date.replace(/"/g, '""')}"`,
      `"${item.amount.toFixed(2)}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spend_report_${new Date().toISOString().split('T')[0]}.csv`);
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

      {/* Collapsible Filter Block */}
      {showFilters && (
        <Card className="bg-surface-container-lowest flex flex-col md:flex-row gap-4 items-center px-lg py-md animate-in slide-in-from-top duration-200" glass={false}>
          {/* Search Input */}
          <div className="relative flex-1 w-full focus-within:ring-2 ring-primary/10 rounded-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              type="text"
              placeholder="Search merchant or descriptions..."
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
              {MOCK_CATEGORIES.map(c => (
                <option key={c.id} value={c.code}>{c.name}</option>
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
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          <p className="font-label-md text-[10px] text-on-surface-variant mt-2">
            Based on {filteredExpenses.length} transactions across current quarter.
          </p>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Category Distribution</h4>
          <div className="flex gap-2 items-center h-full mt-2 overflow-x-auto scrollbar-hide py-1">
            {filteredCategoryBreakdown.length > 0 ? (
              filteredCategoryBreakdown.map(cat => (
                <div 
                  key={cat.name} 
                  className="flex-1 min-w-[80px] text-center p-2 rounded-lg bg-surface-container-low border border-outline-variant/30"
                >
                  <p className="font-label-md text-[9px] text-on-surface-variant font-bold uppercase truncate" title={cat.name}>{cat.name}</p>
                  <p className="font-title-md text-title-md font-black text-primary mt-1">{cat.percentage}%</p>
                </div>
              ))
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
                <TableHead>Submission Date</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-primary font-bold">{item.merchant}</span>
                        <span className="text-[10px] text-on-surface-variant">{item.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-secondary-container/10 text-on-secondary-container rounded-full text-[10px] font-bold">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-medium">
                      {item.date}
                    </TableCell>
                    <TableCell align="right" className="font-mono-data text-mono-data font-bold text-primary">
                      -₹{item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-on-surface-variant italic">
                    No transactions matched the current filters.
                  </TableCell>
                </TableRow>
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
  );
}
