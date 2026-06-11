'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MOCK_EXPENSES, MOCK_CATEGORIES, Expense } from '@/mock/data';

const getCurrencySymbol = (currencyCode: string) => {
  return '₹';
};

export default function ExpenseManagementPage() {
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('2023-10-01');
  const [endDate, setEndDate] = useState('2023-10-31');

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, startDate, endDate]);

  // Modal Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  useEffect(() => {
    if (selectedExpense) {
      setIsPreviewLoading(true);
    }
  }, [selectedExpense]);

  // Form Fields State
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paymentType, setPaymentType] = useState('Credit Card');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [receiptFile, setReceiptFile] = useState<{ name: string; size: string; date: string; url?: string } | null>(null);

  // Date converters
  const formatDateToInput = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
    return new Date().toISOString().split('T')[0];
  };

  const formatDateFromInput = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00'); // enforce noon to avoid timezone shift
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  // Filtered dataset
  const filteredExpenses = expenses.filter((e) => {
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

  // Handle Add Expense Trigger
  const handleOpenAdd = () => {
    setMerchant('');
    setCategory('FOOD');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentType('Credit Card');
    setNotes('');
    setCurrency('INR');
    setReceiptFile(null);
    setIsAddOpen(true);
  };

  // Save New Expense
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount || !category || !date || !paymentType || !currency) return;

    const newExpense: Expense = {
      id: `e${expenses.length + 1}`,
      merchant,
      description: merchant, // default description to merchant title
      category,
      date: formatDateFromInput(date),
      status: 'PENDING',
      amount: parseFloat(amount),
      submittedBy: 'Alex Sterling',
      paymentType,
      currency,
      notes: notes || undefined,
      receiptName: receiptFile?.name,
      receiptSize: receiptFile?.size,
      receiptDate: receiptFile?.date,
      receiptUrl: receiptFile?.url || (receiptFile ? '/basic-text.pdf' : undefined)
    };

    setExpenses([newExpense, ...expenses]);
    setIsAddOpen(false);
  };

  // Handle Edit Expense Trigger
  const handleOpenEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setMerchant(expense.merchant);
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDate(formatDateToInput(expense.date));
    setPaymentType(expense.paymentType);
    setNotes(expense.notes || '');
    setCurrency(expense.currency);
    if (expense.receiptName) {
      setReceiptFile({
        name: expense.receiptName,
        size: expense.receiptSize || '2.4 MB',
        date: expense.receiptDate || 'Nov 24',
        url: expense.receiptUrl || '/basic-text.pdf'
      });
    } else {
      setReceiptFile(null);
    }
    setIsDetailsOpen(false);
    setIsEditOpen(true);
  };

  // Save Edit Expense
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !merchant || !amount || !category || !date || !paymentType || !currency) return;

    setExpenses(prev => prev.map(item => {
      if (item.id === selectedExpense.id) {
        return {
          ...item,
          merchant,
          description: merchant, // default description to merchant title
          category,
          amount: parseFloat(amount),
          date: formatDateFromInput(date),
          paymentType,
          currency,
          notes: notes || undefined,
          receiptName: receiptFile?.name,
          receiptSize: receiptFile?.size,
          receiptDate: receiptFile?.date,
          receiptUrl: receiptFile?.url || (receiptFile ? '/basic-text.pdf' : undefined)
        };
      }
      return item;
    }));

    setIsEditOpen(false);
  };

  // Open Details Modal
  const handleOpenDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  // Open Delete Confirm
  const handleOpenDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!selectedExpense) return;
    setExpenses(prev => prev.filter(item => item.id !== selectedExpense.id));
    setSelectedExpense(null);
    setIsDeleteOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Expense Network Ledger</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Record, verify, and governance personal transaction slips.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} className="px-4 py-2">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Record Expense</span>
        </Button>
      </div>

      {/* Advanced Filter Bar */}
      <Card className="bg-surface-container-lowest flex flex-col md:flex-row gap-4 items-center px-lg py-md" glass={false}>
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
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold whitespace-nowrap">Category:</span>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none text-on-surface font-bold w-full md:w-40"
          >
            <option value="ALL">ALL Categories</option>
            {MOCK_CATEGORIES.map(c => (
              <option key={c.id} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold whitespace-nowrap">Start:</span>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none text-on-surface font-bold w-full md:w-40"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold whitespace-nowrap">End:</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none text-on-surface font-bold w-full md:w-40"
          />
        </div>
      </Card>

      {/* Main Expenses Table */}
      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Submittal Date</TableHead>
              <TableHead align="right">Amount</TableHead>
              <TableHead align="right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedExpenses.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8 text-on-surface-variant text-body-md" {...{colSpan: 5}}>
                  No records match the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedExpenses.map((item) => {
                const iconName = item.category === 'FOOD' ? 'restaurant' : item.category === 'TRAVEL' ? 'flight' : item.category === 'RENT' ? 'home_work' : 'category';
                return (
                  <TableRow key={item.id} onClick={() => handleOpenDetails(item)}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30">
                          <span className="material-symbols-outlined text-sm">{iconName}</span>
                        </div>
                        <p className="font-body-md text-body-md font-bold text-primary">
                          {item.merchant.length > 20 ? item.merchant.slice(0, 20) + '...' : item.merchant}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-secondary-container/10 text-on-secondary-container rounded-full text-[10px] font-bold">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-label-md text-on-surface-variant">
                      {item.date}
                    </TableCell>
                    <TableCell align="right" className="font-mono-data text-mono-data font-bold text-primary">
                      -{getCurrencySymbol(item.currency)}{item.amount.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all"
                          title="Modify details"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(item)}
                          className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all"
                          title="Revoke entry"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Record Expense Modal (Add) */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Expense" customHeader={true} cardPadding="p-0" maxWidth="max-w-2xl">
        <div className="px-xl py-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Add New Expense</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">Record a new transaction for your enterprise ledger.</p>
          </div>
          <button type="button" className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant" onClick={() => setIsAddOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSaveAdd}>
          <div className="px-xl py-xl space-y-lg max-h-[70vh] overflow-y-auto overflow-x-hidden">
            {/* Title (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Delta Airlines Flight"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
              />
            </div>

            {/* Category + Date (50% / 50%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Spend Category *</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md appearance-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                  >
                    {MOCK_CATEGORIES.map(c => (
                      <option key={c.id} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Amount + Currency (50% / 50%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Amount *</label>
                <div className="relative">
                  <span className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant font-mono-data font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-md font-mono-data text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Currency *</label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md appearance-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                  >
                    <option value="INR">INR (₹)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                </div>
              </div>
            </div>

            {/* Payment Type (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Payment Type *</label>
              <div className="relative">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md appearance-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
              </div>
            </div>

            {/* Receipt Upload (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Receipt Upload (Optional)</label>
              {receiptFile ? (
                <div className="flex items-center p-md bg-surface-container rounded-xl border border-outline-variant">
                  <div className="flex items-center w-full gap-lg">
                    <div className="w-16 h-16 bg-white rounded-lg border border-outline-variant flex-shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant">receipt_long</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-title-md text-title-md text-on-surface font-semibold truncate max-w-xs">{receiptFile.name}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">{receiptFile.size} • Uploaded on {receiptFile.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptFile(null)}
                      className="p-sm text-on-surface-variant hover:bg-error-container/20 hover:text-error rounded-full transition-all"
                      title="Remove file"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      setReceiptFile({
                        name: files[0].name,
                        size: `${(files[0].size / (1024 * 1024)).toFixed(1)} MB`,
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                        url: URL.createObjectURL(files[0])
                      });
                    }
                  }}
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
                    fileInput.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        setReceiptFile({
                          name: files[0].name,
                          size: `${(files[0].size / (1024 * 1024)).toFixed(1)} MB`,
                          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                          url: URL.createObjectURL(files[0])
                        });
                      }
                    };
                    fileInput.click();
                  }}
                  className="border-2 border-dashed border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center bg-surface-container-low/30 hover:bg-secondary-container/5 hover:border-secondary transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-md group-hover:bg-secondary-container group-hover:text-on-secondary-container transition-colors">
                    <span className="material-symbols-outlined">upload_file</span>
                  </div>
                  <p className="font-title-md text-title-md text-on-surface font-semibold text-center">Drag and drop a single receipt here</p>
                  <p className="font-label-md text-label-md text-on-surface-variant mt-xs text-center">PDF, JPG, PNG up to 10MB (Max 1 file)</p>
                  <div className="mt-md flex items-center gap-xs text-secondary font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span>Single file upload only</span>
                  </div>
                  <button type="button" className="mt-md text-secondary font-label-md text-label-md underline underline-offset-4 font-bold">or browse files</button>
                </div>
              )}
            </div>

            {/* Notes (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md font-body-md text-body-md resize-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                placeholder="Add details about the purpose of this expense..."
                rows={3}
              />
            </div>
          </div>

          <div className="px-xl py-lg bg-surface-container-low border-t border-outline-variant flex justify-end items-center gap-md">
            <button type="button" className="px-xl h-11 rounded-lg border border-outline-variant text-on-surface-variant font-title-md text-title-md hover:bg-surface-container-high transition-colors active:scale-95 duration-150 font-semibold" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="px-xl h-11 rounded-lg bg-primary text-on-primary font-title-md text-title-md hover:shadow-lg transition-all active:scale-95 duration-150 flex items-center gap-sm font-semibold">
              <span>Save Expense</span>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Expense" customHeader={true} cardPadding="p-0" maxWidth="max-w-2xl">
        <div className="px-xl py-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Edit Expense</h2>
          </div>
          <button type="button" className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant" onClick={() => setIsEditOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSaveEdit}>
          <div className="px-xl py-xl space-y-lg max-h-[70vh] overflow-y-auto overflow-x-hidden">
            {/* Title (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Title *</label>
              <input
                type="text"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
              />
            </div>

            {/* Category + Date (50% / 50%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Spend Category *</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md appearance-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                  >
                    {MOCK_CATEGORIES.map(c => (
                      <option key={c.id} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Amount + Currency (50% / 50%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Amount *</label>
                <div className="relative">
                  <span className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant font-mono-data font-bold">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-md font-mono-data text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Currency *</label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md appearance-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                  >
                    <option value="INR">INR (₹)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                </div>
              </div>
            </div>

            {/* Payment Type (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Payment Type *</label>
              <div className="relative">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-md text-body-md appearance-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none font-bold"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
              </div>
            </div>

            {/* Receipt Upload (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Receipt Attachment (Optional)</label>
              {receiptFile ? (
                <div className="flex items-center p-md bg-surface-container rounded-xl border-2 border-dashed border-outline-variant group hover:border-secondary transition-colors">
                  <div className="flex items-center w-full gap-lg">
                    <div className="w-16 h-16 bg-white rounded-lg border border-outline-variant flex-shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant">receipt_long</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-title-md text-title-md text-on-surface font-semibold truncate">{receiptFile.name}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">{receiptFile.size} • Uploaded on {receiptFile.date}</p>
                    </div>
                    <div className="flex items-center gap-sm">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = '.pdf,.jpg,.jpeg,.png';
                          fileInput.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              setReceiptFile({
                                name: files[0].name,
                                size: `${(files[0].size / (1024 * 1024)).toFixed(1)} MB`,
                                date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                                url: URL.createObjectURL(files[0])
                              });
                            }
                          };
                          fileInput.click();
                        }}
                        className="flex items-center gap-xs px-md py-sm bg-secondary-container/10 text-secondary border border-secondary/20 rounded-lg font-label-md text-label-md hover:bg-secondary-container/20 transition-all font-semibold"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        Upload New
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptFile(null)}
                        className="p-sm text-on-surface-variant hover:bg-error-container/20 hover:text-error rounded-full transition-all"
                        title="Remove file"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
                    fileInput.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        setReceiptFile({
                          name: files[0].name,
                          size: `${(files[0].size / (1024 * 1024)).toFixed(1)} MB`,
                          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                          url: URL.createObjectURL(files[0])
                        });
                      }
                    };
                    fileInput.click();
                  }}
                  className="w-full flex items-center justify-center p-md bg-surface-container rounded-xl border-2 border-dashed border-outline-variant hover:border-secondary transition-colors text-secondary text-label-md font-semibold"
                >
                  <span className="material-symbols-outlined mr-2">upload</span>
                  Upload Receipt File
                </button>
              )}
            </div>

            {/* Notes (Full Row) */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md font-body-md text-body-md resize-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                placeholder="Add details about the purpose of this expense..."
                rows={3}
              />
            </div>
          </div>
          <div className="px-xl py-lg bg-surface-container-low border-t border-outline-variant flex justify-end items-center gap-md">
            <button type="button" className="px-xl h-11 rounded-lg border border-outline-variant text-on-surface-variant font-title-md text-title-md hover:bg-surface-container-high transition-colors active:scale-95 duration-150 font-semibold" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="px-xl h-11 rounded-lg bg-secondary text-on-secondary font-title-md text-title-md hover:shadow-lg transition-all active:scale-95 duration-150 flex items-center gap-sm font-semibold">
              <span>Update Expense</span>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Expense Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Expense Details" customHeader={true} cardPadding="p-0" maxWidth="max-w-3xl">
        {selectedExpense && (
          <>
            <div className="px-xl py-lg flex justify-between items-center bg-surface-bright border-b border-outline-variant">
              <div className="flex items-center gap-md">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Expense Details</h2>
                  <p className="font-label-md text-label-md text-on-surface-variant">Transaction ID: {selectedExpense.id.toUpperCase()}</p>
                </div>
              </div>
              <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors" onClick={() => setIsDetailsOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-xl grid grid-cols-1 md:grid-cols-5 gap-xl overflow-y-auto overflow-x-hidden max-h-[70vh]">
              <div className="md:col-span-3 space-y-xl">
                <div className="flex flex-col gap-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Merchant &amp; Total</span>
                  <div className="flex justify-between items-baseline border-b border-outline-variant pb-md">
                    <h3 className="font-headline-md text-headline-md font-black text-on-surface">{selectedExpense.merchant}</h3>
                    <div className="text-right">
                      <p className="font-headline-md text-headline-md font-mono-data text-secondary font-black">
                        -{getCurrencySymbol(selectedExpense.currency)}{selectedExpense.amount.toFixed(2)}
                      </p>
                      <p className="font-label-md text-label-md text-on-surface-variant font-medium">{selectedExpense.currency} - Paid in Full</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-xl">
                  <div className="space-y-xs">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Date</span>
                    <div className="flex items-center gap-xs text-on-surface font-title-md text-title-md font-semibold">
                      <span className="material-symbols-outlined text-outline">calendar_today</span>
                      <span>{selectedExpense.date}</span>
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Category</span>
                    <div className="flex items-center gap-sm">
                      <span className="px-md py-1 bg-secondary-container/20 text-on-secondary-container rounded-full font-label-md text-label-md flex items-center gap-xs font-bold border border-secondary/20">
                        <span className="material-symbols-outlined text-[14px]">
                          {selectedExpense.category === 'FOOD' ? 'restaurant' : selectedExpense.category === 'TRAVEL' ? 'flight' : selectedExpense.category === 'RENT' ? 'home_work' : 'category'}
                        </span>
                        {selectedExpense.category}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Payment Type</span>
                    <div className="flex items-center gap-xs text-on-surface font-body-md text-body-md font-medium font-semibold">
                      <span className="material-symbols-outlined text-outline">
                        {selectedExpense.paymentType === 'Credit Card' || selectedExpense.paymentType === 'Debit Card' ? 'credit_card' : selectedExpense.paymentType === 'Cash' ? 'payments' : 'account_balance'}
                      </span>
                      <span>{selectedExpense.paymentType}</span>
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Submitted By</span>
                    <div className="flex items-center gap-xs text-on-surface font-body-md text-body-md font-medium font-semibold">
                      <span className="material-symbols-outlined text-on-secondary-container text-[18px]">verified</span>
                      <span>{selectedExpense.submittedBy}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-xs p-md bg-surface-container-low rounded-lg border border-outline-variant">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Internal Notes</span>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                    {selectedExpense.notes || selectedExpense.description || 'No notes or purpose description provided for this ledger entry.'}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-md">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Receipt Preview</span>
                {selectedExpense.receiptName ? (
                  <>
                    <div 
                      onClick={() => window.open(selectedExpense.receiptUrl || '/basic-text.pdf', '_blank')}
                      className="group relative aspect-[3/4] w-full bg-surface-container rounded-lg border border-outline-variant overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center"
                    >
                      {isPreviewLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-high/60 backdrop-blur-[2px] z-10 gap-sm animate-pulse">
                          <div className="w-12 h-12 rounded bg-surface-container-highest flex items-center justify-center mb-1">
                            <span className="material-symbols-outlined text-xl text-on-surface-variant">description</span>
                          </div>
                          <span className="font-label-md text-label-md text-on-surface-variant font-bold">Rendering Document...</span>
                        </div>
                      )}
                      {(selectedExpense.receiptUrl || '/basic-text.pdf').toLowerCase().endsWith('.pdf') || selectedExpense.receiptName.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                          src={`${selectedExpense.receiptUrl || '/basic-text.pdf'}#toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full h-full border-none pointer-events-none"
                          onLoad={() => setIsPreviewLoading(false)}
                        />
                      ) : (
                        <img 
                          src={selectedExpense.receiptUrl || '/basic-text.pdf'} 
                          alt={selectedExpense.receiptName} 
                          className="w-full h-full object-cover pointer-events-none" 
                          onLoad={() => setIsPreviewLoading(false)}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                        <div className="bg-surface-container-lowest text-on-surface px-md py-sm rounded-lg flex items-center gap-sm font-label-md font-semibold">
                          <span className="material-symbols-outlined">zoom_in</span>
                          View Full Size
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm p-sm bg-surface-bright border border-outline-variant rounded-lg">
                      <span className="material-symbols-outlined text-on-primary-container">file_present</span>
                      <div className="flex-grow min-w-0">
                        <p className="font-label-md text-on-surface truncate font-semibold">{selectedExpense.receiptName}</p>
                        <p className="text-[10px] text-on-surface-variant">{selectedExpense.receiptSize || '2.4 MB'} • PDF</p>
                      </div>
                      <a
                        href={selectedExpense.receiptUrl || '/basic-text.pdf'}
                        download={selectedExpense.receiptName}
                        className="p-xs hover:bg-surface-container-high rounded transition-colors text-on-surface-variant flex items-center justify-center"
                        title="Download receipt"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="aspect-[3/4] w-full bg-surface-container-low rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant select-none p-md text-center">
                    <span className="material-symbols-outlined text-[48px] text-outline mb-sm">no_photography</span>
                    <p className="font-title-md text-title-md font-semibold">No Receipt Scan</p>
                    <p className="font-label-md text-label-md mt-xs">Use Edit Expense to attach a receipt.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-xl py-lg bg-surface-bright border-t border-outline-variant flex justify-end items-center gap-md">
              <button className="px-xl py-2 font-title-md text-title-md border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-high active:scale-95 transition-all font-semibold" onClick={() => setIsDetailsOpen(false)}>
                Close Details
              </button>
              <button className="px-xl py-2 font-title-md text-title-md bg-secondary text-on-secondary rounded-lg hover:bg-secondary/90 active:scale-95 transition-all flex items-center gap-sm font-semibold" onClick={() => handleOpenEdit(selectedExpense)}>
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Edit Expense
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Expense" customHeader={true} cardPadding="p-0" maxWidth="max-w-md">
        <div className="pt-xl px-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-error text-[32px]">warning</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm font-black">Delete Expense?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
            This action cannot be undone. Are you sure you want to delete this expense record?
          </p>
        </div>
        <div className="mx-xl my-lg p-md bg-surface-container rounded-lg border border-outline-variant flex items-center gap-md">
          <div className="flex-grow min-w-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold text-left">Selected Record</p>
            <p className="font-body-md text-body-md font-semibold text-on-surface truncate text-left">{selectedExpense?.merchant}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Total</p>
            <p className="font-mono-data text-mono-data text-error font-bold">
              {selectedExpense ? getCurrencySymbol(selectedExpense.currency) : ''}{selectedExpense?.amount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="p-lg bg-surface-container-low flex flex-col-reverse sm:flex-row gap-md sm:justify-end border-t border-outline-variant">
          <button className="px-xl h-11 flex items-center justify-center rounded-lg border border-outline text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-colors active:scale-95 duration-150 font-semibold" onClick={() => setIsDeleteOpen(false)}>
            Keep
          </button>
          <button className="px-xl h-11 flex items-center justify-center rounded-lg bg-error text-on-error font-title-md text-title-md shadow-md hover:opacity-90 transition-all active:scale-95 duration-150 font-semibold" onClick={handleConfirmDelete}>
            Delete
          </button>
        </div>
      </Modal>

    </div>
  );
}
