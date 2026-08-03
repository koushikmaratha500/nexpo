'use client';

import { useState, useEffect } from 'react';
import { useTransactionStore, TransactionType } from '@/store/transactionStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/useToast';
import { dateToInputFormat } from '@/lib/date';
import axios from 'axios';

interface CategoryOption {
  id: string;
  name: string;
  type?: 'DEBIT' | 'CREDIT';
}

interface TransactionFormInput {
  type: 'DEBIT' | 'CREDIT';
  title: string;
  merchant: string;
  category: string;
  amount: string;
  date: string;
  currency: string;
  paymentType: string;
  notes: string;
  depositType: string;
}

interface PaymentTypeOption {
  id: string;
  name: string;
}

interface CurrencyOption {
  id: string;
  code: string;
  symbol: string;
}

const inputClassName =
  'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

/* ---------- Reusable Document Uploader ---------- */
function DocumentUploader({
  file,
  onFileChange,
  existingDocumentName,
  onRemoveExisting,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingDocumentName?: string;
  onRemoveExisting?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChange(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    onFileChange(selected);
    e.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide block mb-2">
        Upload Document
      </span>

      {existingDocumentName && !file && (
        <div className="flex items-center justify-between gap-3 mb-2 px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">description</span>
            <span className="text-body-md text-on-surface truncate font-medium" title={existingDocumentName}>
              {existingDocumentName}
            </span>
          </div>
          {onRemoveExisting && (
            <button
              type="button"
              onClick={onRemoveExisting}
              className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error-container/20 transition-colors cursor-pointer shrink-0"
              title="Remove document"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between gap-3 mb-2 px-4 py-3 rounded-lg border border-primary/30 bg-primary-fixed/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0">upload_file</span>
            <div className="min-w-0">
              <span className="text-body-md text-on-surface truncate font-medium block" title={file.name}>
                {file.name}
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">{formatFileSize(file.size)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error-container/20 transition-colors cursor-pointer shrink-0"
            title="Remove file"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {!file && !existingDocumentName && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? 'border-primary bg-primary-fixed/10'
              : 'border-outline-variant bg-surface-container-low hover:border-primary/50 hover:bg-surface-container'
          }`}
        >
          <input
            type="file"
            onChange={handleFileInput}
            className="sr-only"
          />
          <span className={`material-symbols-outlined text-[28px] ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`}>
            cloud_upload
          </span>
          <span className="font-body-md text-body-md text-on-surface font-medium">
            Drag & drop or <span className="text-primary font-semibold">browse</span>
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">
            PDF, JPG, PNG, CSV (Max 10 MB)
          </span>
        </label>
      )}
    </div>
  );
}

/* ---------- Reusable Segmented Type Selector (no default selection) ---------- */
function TypeSelector({
  register,
  watch,
  error,
}: {
  register: any;
  watch: any;
  error?: any;
}) {
  const selectedType = watch('type');

  return (
    <div>
      <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide block mb-2">
        Transaction Type <span className="text-error">*</span>
      </span>
      <div className="grid grid-cols-2 gap-3">
        <label
          className={`relative flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selectedType === 'DEBIT'
              ? 'border-error bg-error-container/15 shadow-sm'
              : 'border-outline-variant bg-surface-container-low hover:border-outline hover:bg-surface-container'
          }`}
        >
          <input
            type="radio"
            value="DEBIT"
            {...register('type', { required: 'Please select a transaction type' })}
            className="sr-only"
          />
          <span
            className={`material-symbols-outlined text-[28px] transition-colors duration-200 ${
              selectedType === 'DEBIT' ? 'text-error' : 'text-on-surface-variant'
            }`}
          >
            south_west
          </span>
          <span
            className={`font-title-md text-title-md font-bold transition-colors duration-200 ${
              selectedType === 'DEBIT' ? 'text-error' : 'text-on-surface'
            }`}
          >
            Debit
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">Money Out</span>
          {selectedType === 'DEBIT' && (
            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-error text-on-error flex items-center justify-center animate-in zoom-in-75 duration-150">
              <span className="material-symbols-outlined text-[12px]">check</span>
            </span>
          )}
        </label>

        <label
          className={`relative flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selectedType === 'CREDIT'
              ? 'border-secondary bg-secondary-container/15 shadow-sm'
              : 'border-outline-variant bg-surface-container-low hover:border-outline hover:bg-surface-container'
          }`}
        >
          <input
            type="radio"
            value="CREDIT"
            {...register('type', { required: 'Please select a transaction type' })}
            className="sr-only"
          />
          <span
            className={`material-symbols-outlined text-[28px] transition-colors duration-200 ${
              selectedType === 'CREDIT' ? 'text-secondary' : 'text-on-surface-variant'
            }`}
          >
            north_east
          </span>
          <span
            className={`font-title-md text-title-md font-bold transition-colors duration-200 ${
              selectedType === 'CREDIT' ? 'text-secondary' : 'text-on-surface'
            }`}
          >
            Credit
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">Money In</span>
          {selectedType === 'CREDIT' && (
            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center animate-in zoom-in-75 duration-150">
              <span className="material-symbols-outlined text-[12px]">check</span>
            </span>
          )}
        </label>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error.message}
        </p>
      )}
    </div>
  );
}

/* ---------- Reusable Form Field wrapper ---------- */
function FormField({
  label,
  required,
  error,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && (
        <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </span>
      )}
    </div>
  );
}

/* ---------- Reusable Deposit Method Selector (Credit only, DB-driven) ---------- */
function DepositTypeSelector({
  register,
  watch,
  options,
}: {
  register: any;
  watch: any;
  options: PaymentTypeOption[];
}) {
  const selected = watch('depositType');

  return (
    <div>
      <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide block mb-2">
        Deposit Method
      </span>
      {options.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 cursor-pointer select-none transition-all duration-200 ${
                selected === opt.name
                  ? 'border-secondary bg-secondary-container/15 text-secondary shadow-sm'
                  : 'border-outline-variant bg-surface-container-low hover:border-outline hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <input type="radio" value={opt.name} {...register('depositType')} className="sr-only" />
              <span className="material-symbols-outlined text-[18px]">
                {opt.name.toLowerCase() === 'cash' ? 'payments' : 'account_balance'}
              </span>
              <span className="font-body-md text-body-md font-semibold">{opt.name}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant italic">No active deposit methods available.</p>
      )}
    </div>
  );
}

/* ---------- Reusable Select Field ---------- */
function SelectField({
  register,
  error,
  label,
  required,
  options,
  placeholder,
  valueKey = 'name',
  labelKey = 'name',
  className = '',
}: {
  register: any;
  error?: string;
  label: string;
  required?: boolean;
  options: any[];
  placeholder: string;
  valueKey?: string;
  labelKey?: string;
  className?: string;
}) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className="relative">
        <select
          {...register}
          className={`${inputClassName} appearance-none pr-10`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt[valueKey]}>{opt[labelKey]}</option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">expand_more</span>
      </div>
    </FormField>
  );
}

export default function TransactionsPage() {
  const { transactions, fetchTransactions, addTransaction, updateTransaction, deleteTransaction, isLoading } = useTransactionStore();
  const { addToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<"ALL" | TransactionType>("ALL");
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [depositTypes, setDepositTypes] = useState<PaymentTypeOption[]>([]);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [removeExistingDoc, setRemoveExistingDoc] = useState(false);

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    watch: watchAdd,
    formState: { errors: errorsAdd },
  } = useForm<TransactionFormInput>({
    defaultValues: {
      title: '',
      merchant: '',
      category: '',
      amount: '',
      date: dateToInputFormat(new Date()),
      currency: 'INR',
      paymentType: '',
      notes: '',
      depositType: 'Account',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit },
  } = useForm<TransactionFormInput>();

  const selectedAddType = watchAdd('type');
  const selectedEditType = watchEdit('type');

  // Filter categories based on selected transaction type
  const filteredAddCategories = selectedAddType
    ? categories.filter((c) => !c.type || c.type === selectedAddType)
    : categories;
  const filteredEditCategories = selectedEditType
    ? categories.filter((c) => !c.type || c.type === selectedEditType)
    : categories;

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Load all metadata (categories, payment types, currencies, deposit types) from DB
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const res = await axios.get('/api/user/metadata');
        const data = res.data;
        if (Array.isArray(data.categories)) setCategories(data.categories);
        if (Array.isArray(data.paymentTypes)) setPaymentTypes(data.paymentTypes);
        if (Array.isArray(data.currencies)) setCurrencies(data.currencies);
        if (Array.isArray(data.budgetDepositTypes)) setDepositTypes(data.budgetDepositTypes);
      } catch (err) {
        console.error('Failed to load metadata', err);
        // Fallback: load categories from dedicated endpoint
        try {
          const res = await axios.get('/api/user/category');
          if (Array.isArray(res.data)) setCategories(res.data);
        } catch (err2) {
          console.error('Failed to load categories fallback', err2);
        }
      }
    };
    loadMetadata();
  }, []);

  // Handle floating FAB ?openAdd=true from customer layout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openAdd') === 'true') {
        handleOpenAdd();
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter !== "ALL" && t.type !== activeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) ||
             (t.merchant || '').toLowerCase().includes(q) ||
             t.category.toLowerCase().includes(q);
    }
    return true;
  });

  const totalItems = filteredTransactions.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const totalDebit = filteredTransactions.filter((t) => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = filteredTransactions.filter((t) => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);

  const handleOpenAdd = () => {
    resetAdd({
      type: 'DEBIT',
      title: '',
      merchant: '',
      category: '',
      amount: '',
      date: dateToInputFormat(new Date()),
      currency: 'INR',
      paymentType: '',
      notes: '',
      depositType: 'Account',
    });
    setAddFile(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTransaction(t);
    setEditFile(null);
    setRemoveExistingDoc(false);
    resetEdit({
      type: t.type,
      title: t.title,
      merchant: t.merchant || '',
      category: t.category,
      amount: t.amount.toString(),
      date: dateToInputFormat(t.date),
      currency: t.currency,
      paymentType: t.paymentType || '',
      notes: t.notes || '',
      depositType: t.depositType || 'Account',
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await deleteTransaction(id);
        addToast('Transaction deleted', 'success');
      } catch (err: any) {
        addToast('Failed to delete transaction', 'error');
      }
    }
  };

  const onSaveAdd = async (data: TransactionFormInput) => {
    setSubmitting(true);
    try {
      await addTransaction({
        type: data.type || 'DEBIT',
        title: data.title,
        merchant: data.merchant,
        category: data.category,
        amount: parseFloat(data.amount),
        date: data.date,
        currency: data.currency,
        paymentType: data.paymentType,
        notes: data.notes,
        depositType: data.type === 'CREDIT' ? data.depositType : undefined,
      } as any, addFile);
      addToast('Transaction added successfully!', 'success');
      setIsAddOpen(false);
      setAddFile(null);
    } catch (err: any) {
      addToast('Failed to add transaction.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveEdit = async (data: TransactionFormInput) => {
    if (!editingTransaction) return;
    setSubmitting(true);
    try {
      const txnData: any = {
        type: data.type || 'DEBIT',
        title: data.title,
        merchant: data.merchant,
        category: data.category,
        amount: parseFloat(data.amount),
        date: data.date,
        currency: data.currency,
        paymentType: data.paymentType,
        notes: data.notes,
        depositType: data.type === 'CREDIT' ? data.depositType : undefined,
      };
      if (removeExistingDoc && !editFile) {
        txnData.documentName = '';
        txnData.documentUrl = '';
      }
      await updateTransaction(editingTransaction.id, txnData, editFile);
      addToast('Transaction updated successfully!', 'success');
      setIsEditOpen(false);
      setEditFile(null);
      setRemoveExistingDoc(false);
    } catch (err: any) {
      addToast('Failed to update transaction.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-[10px] font-bold";
    if (type === 'CREDIT') {
      return `${baseClasses} bg-secondary-container/10 text-on-secondary-container`;
    }
    return `${baseClasses} bg-error-container/30 text-error`;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Personal Transactions</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Track your debits and credits in one place.</p>
        </div>
        <Button onClick={handleOpenAdd} className="self-start md:self-auto">
          <span className="material-symbols-outlined text-sm">add</span>
          Add
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-surface-container-lowest flex flex-col lg:flex-row gap-4 items-stretch lg:items-center px-lg py-md" glass={false}>
        <div className="flex items-center gap-2">
          {(["ALL", "DEBIT", "CREDIT"] as const).map((f) => (
            <Button
              key={f}
              variant={activeFilter === f ? "primary" : "secondary"}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-2"
            >
              {f === "ALL" ? "All" : f}
            </Button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48 focus-within:ring-2 ring-primary/10 rounded-lg">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            type="text"
            placeholder="Search by title, merchant or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:ring-0 text-on-surface"
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-on-surface-variant whitespace-nowrap">
          <span>
            <span className="material-symbols-outlined text-error text-[16px] align-middle mr-1">south_west</span>
            <span className="font-medium text-error">{totalDebit.toFixed(2)}</span>
          </span>
          <span>
            <span className="material-symbols-outlined text-secondary text-[16px] align-middle mr-1">north_east</span>
            <span className="font-medium text-secondary">{totalCredit.toFixed(2)}</span>
          </span>
        </div>
      </Card>

      {/* Transactions table */}
      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="px-6 py-4 border-b border-outline-variant bg-white/40">
          <h4 className="font-title-md text-title-md font-bold text-primary">Transaction Ledger</h4>
        </div>

        <div className="w-full overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title / Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <span>Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span className="text-primary font-bold">{t.title}</span>
                      {t.merchant && t.merchant !== t.title && (
                        <span className="block text-[10px] text-on-surface-variant mt-0.5">{t.merchant}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-secondary-container/10 text-on-secondary-container rounded-full text-[10px] font-bold">
                        {t.category}
                      </span>
                    </TableCell>
                    <TableCell align="right" className="font-mono-data text-mono-data font-bold text-primary">
                      {t.type === 'DEBIT' ? '−' : '+'}{t.currency} {t.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={getTypeBadge(t.type)}>{t.type}</span>
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-medium">{t.date}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" onClick={() => handleOpenEdit(t)}>
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </Button>
                        <Button variant="ghost" onClick={() => handleDelete(t.id)}>
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant italic">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-lg py-md border-t border-outline-variant/40 bg-surface-container-lowest gap-4">
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Show</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="px-2 py-1 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">entries</span>
          </div>
          {totalItems > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </Card>

      {/* ---------------- ADD TRANSACTION MODAL ---------------- */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Transaction" subtitle="Record a new debit or credit entry" maxWidth="max-w-[45rem]">
        <form onSubmit={handleSubmitAdd(onSaveAdd)} className="space-y-5">
          <TypeSelector register={registerAdd} watch={watchAdd} error={errorsAdd.type} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Title" required error={errorsAdd.title?.message}>
              <input
                type="text"
                {...registerAdd('title', { required: 'Title is required' })}
                className={inputClassName}
                placeholder="E.g. Grocery shopping"
              />
            </FormField>

            <FormField label="Merchant">
              <input
                type="text"
                {...registerAdd('merchant')}
                className={inputClassName}
                placeholder="E.g. Whole Foods"
              />
            </FormField>
          </div>

          <SelectField
            register={registerAdd('category', { required: 'Category is required' })}
            error={errorsAdd.category?.message}
            label="Category"
            required
            options={filteredAddCategories}
            placeholder="Select a category"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Amount" required error={errorsAdd.amount?.message}>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">payments</span>
                <input
                  type="number"
                  step="0.01"
                  {...registerAdd('amount', { required: 'Amount is required' })}
                  className={`${inputClassName} pl-10`}
                  placeholder="0.00"
                />
              </div>
            </FormField>

            {selectedAddType === 'DEBIT' && (
              <SelectField
                register={registerAdd('paymentType', { required: 'Payment type is required' })}
                error={errorsAdd.paymentType?.message}
                label="Payment Type"
                required
                options={paymentTypes}
                placeholder="Select payment type"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date">
              <input
                type="date"
                {...registerAdd('date')}
                className={inputClassName}
              />
            </FormField>

            <SelectField
              register={registerAdd('currency', { required: 'Currency is required' })}
              error={errorsAdd.currency?.message}
              label="Currency"
              required
              options={currencies}
              placeholder="Select currency"
              valueKey="code"
              labelKey="code"
            />
          </div>

          {selectedAddType === 'CREDIT' && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <DepositTypeSelector register={registerAdd} watch={watchAdd} options={depositTypes} />
            </div>
          )}

          <FormField label="Notes">
            <textarea
              {...registerAdd('notes')}
              className={`${inputClassName} resize-none`}
              placeholder="Add additional notes..."
              rows={3}
            />
          </FormField>

          <DocumentUploader file={addFile} onFileChange={setAddFile} />

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---------------- EDIT TRANSACTION MODAL ---------------- */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={editingTransaction ? "Edit Transaction" : "Add Transaction"} subtitle="Update transaction details" maxWidth="max-w-[45rem]">
        <form onSubmit={handleSubmitEdit(onSaveEdit)} className="space-y-5">
          <TypeSelector register={registerEdit} watch={watchEdit} error={errorsEdit.type} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Title" required error={errorsEdit.title?.message}>
              <input
                type="text"
                {...registerEdit('title', { required: 'Title is required' })}
                className={inputClassName}
                placeholder="E.g. Grocery shopping"
              />
            </FormField>

            <FormField label="Merchant">
              <input
                type="text"
                {...registerEdit('merchant')}
                className={inputClassName}
                placeholder="E.g. Whole Foods"
              />
            </FormField>
          </div>

          <SelectField
            register={registerEdit('category', { required: 'Category is required' })}
            error={errorsEdit.category?.message}
            label="Category"
            required
            options={filteredEditCategories}
            placeholder="Select a category"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Amount" required error={errorsEdit.amount?.message}>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">payments</span>
                <input
                  type="number"
                  step="0.01"
                  {...registerEdit('amount', { required: 'Amount is required' })}
                  className={`${inputClassName} pl-10`}
                  placeholder="0.00"
                />
              </div>
            </FormField>

            {selectedEditType === 'DEBIT' && (
              <SelectField
                register={registerEdit('paymentType', { required: 'Payment type is required' })}
                error={errorsEdit.paymentType?.message}
                label="Payment Type"
                required
                options={paymentTypes}
                placeholder="Select payment type"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date">
              <input
                type="date"
                {...registerEdit('date')}
                className={inputClassName}
              />
            </FormField>

            <SelectField
              register={registerEdit('currency', { required: 'Currency is required' })}
              error={errorsEdit.currency?.message}
              label="Currency"
              required
              options={currencies}
              placeholder="Select currency"
              valueKey="code"
              labelKey="code"
            />
          </div>

          {selectedEditType === 'CREDIT' && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <DepositTypeSelector register={registerEdit} watch={watchEdit} options={depositTypes} />
            </div>
          )}

          <FormField label="Notes">
            <textarea
              {...registerEdit('notes')}
              className={`${inputClassName} resize-none`}
              placeholder="Add additional notes..."
              rows={3}
            />
          </FormField>

          <DocumentUploader
            file={editFile}
            onFileChange={setEditFile}
            existingDocumentName={removeExistingDoc ? undefined : editingTransaction?.documentName}
            onRemoveExisting={() => {
              setRemoveExistingDoc(true);
              setEditFile(null);
            }}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Update'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}