import { create } from 'zustand';
import axios from 'axios';
import { formatDate } from '@/lib/date';

export interface CreditTransaction {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: 'Salary' | 'Savings' | 'Gift' | 'Returns' | 'Other';
  notes?: string;
  type: 'Cash' | 'Account';
  documentName?: string;
  documentSize?: string;
  documentDate?: string;
  documentUrl?: string;
  date: string;
  status: 'VERIFIED' | 'PENDING' | 'DECLINED';
}

const MOCK_CREDITS: CreditTransaction[] = [
  {
    id: 'cr1',
    title: 'Q4 Salary Paycheck',
    amount: 85000.00,
    currency: 'INR',
    category: 'Salary',
    notes: 'Monthly corporate base pay disbursement.',
    type: 'Account',
    documentName: 'paycheck_slip_oct.pdf',
    documentSize: '450 KB',
    documentDate: 'Oct 30',
    date: 'Oct 30, 2023',
    status: 'VERIFIED',
    documentUrl: '/basic-text.pdf'
  },
  {
    id: 'cr2',
    title: 'Savings Account Interest',
    amount: 1240.50,
    currency: 'INR',
    category: 'Savings',
    notes: 'Quarterly interest yield on savings reserve.',
    type: 'Account',
    date: 'Oct 15, 2023',
    status: 'VERIFIED'
  },
  {
    id: 'cr3',
    title: 'Birthday Gift from Family',
    amount: 5000.00,
    currency: 'INR',
    category: 'Gift',
    notes: 'Gift from parents.',
    type: 'Cash',
    date: 'Oct 10, 2023',
    status: 'VERIFIED'
  },
  {
    id: 'cr4',
    title: 'Travel Expense Reimbursement',
    amount: 15400.00,
    currency: 'INR',
    category: 'Returns',
    notes: 'Refund for flight ticket refund claim.',
    type: 'Account',
    documentName: 'reimbursement_invoice.pdf',
    documentSize: '1.1 MB',
    documentDate: 'Oct 05',
    date: 'Oct 05, 2023',
    status: 'VERIFIED',
    documentUrl: '/basic-text.pdf'
  }
];

interface CreditState {
  credits: CreditTransaction[];
  isLoading: boolean;
  error: string | null;
  fetchCredits: (filters?: { category?: string; startDate?: string; endDate?: string }) => Promise<void>;
  addCredit: (credit: Omit<CreditTransaction, 'id' | 'status' | 'currency'>, file?: File | null) => Promise<void>;
  updateCredit: (id: string, credit: Partial<CreditTransaction>, file?: File | null) => Promise<void>;
  deleteCredit: (id: string) => Promise<void>;
}

const mapDbBudgetToCredit = (dbBud: any): CreditTransaction => ({
  id: dbBud.id,
  title: dbBud.title || 'Credit Transaction',
  amount: typeof dbBud.amount === 'string' ? parseFloat(dbBud.amount) : dbBud.amount,
  currency: dbBud.currency?.code || 'INR',
  category: (dbBud.budgetDepositType?.name || 'Other') as any,
  notes: dbBud.notes || undefined,
  type: (dbBud.paymentType?.name || 'Account') as any,
  documentName: dbBud.documentFileName || undefined,
  documentSize: dbBud.documentSize ? `${(dbBud.documentSize / 1024).toFixed(0)} KB` : undefined,
  documentUrl: dbBud.documentUrl || undefined,
  date: formatDate(dbBud.date),
  status: 'VERIFIED',
});

const LOCAL_STORAGE_KEY = 'nexpo_credits_local';

const getLocalStorageCredits = (): CreditTransaction[] => {
  if (typeof window === 'undefined') return MOCK_CREDITS;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : MOCK_CREDITS;
  } catch (e) {
    return MOCK_CREDITS;
  }
};

const setLocalStorageCredits = (credits: CreditTransaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credits));
  } catch (e) {}
};

export const useCreditStore = create<CreditState>((set, get) => ({
  credits: [],
  isLoading: false,
  error: null,

  fetchCredits: async (filters?: { category?: string; startDate?: string; endDate?: string }) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const { category, startDate, endDate } = filters || {};
      const params = new URLSearchParams();
      params.set('pageSize', '1000');
      if (category) params.set('category', category);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await axios.get(`/api/user/deposits?${params.toString()}`);
      const items = response.data.items || response.data || [];
      const mapped = items.map(mapDbBudgetToCredit);
      set({ credits: mapped, isLoading: false });
      setLocalStorageCredits(mapped);
    } catch (err: any) {
      console.warn('API fetchCredits failed, falling back to local storage:', err);
      const local = getLocalStorageCredits();
      set({ credits: local, isLoading: false });
    }
  },

  addCredit: async (newCreditData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('title', newCreditData.title || '');
      formData.append('amount', String(Number(newCreditData.amount)));
      formData.append('currency', 'INR');
      formData.append('category', newCreditData.category || '');
      formData.append('type', newCreditData.type || '');
      formData.append('date', newCreditData.date || '');
      if (newCreditData.notes) formData.append('notes', newCreditData.notes);

      if (file) {
        formData.append('file', file);
      }

      await axios.post('/api/user/deposit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset isLoading before refetch so the guard allows it
      set({ isLoading: false });
      await get().fetchCredits();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to add credit' });
      throw err;
    }
  },

  updateCredit: async (id, updatedCreditData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      if (updatedCreditData.title) formData.append('title', updatedCreditData.title);
      if (updatedCreditData.amount !== undefined) formData.append('amount', String(Number(updatedCreditData.amount)));
      formData.append('currency', 'INR');
      if (updatedCreditData.category) formData.append('category', updatedCreditData.category);
      if (updatedCreditData.type) formData.append('type', updatedCreditData.type);
      if (updatedCreditData.date) formData.append('date', updatedCreditData.date);
      if (updatedCreditData.notes !== undefined) formData.append('notes', updatedCreditData.notes || '');

      if (file) {
        formData.append('file', file);
      }

      await axios.patch(`/api/user/deposit/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset isLoading before refetch so the guard allows it
      set({ isLoading: false });
      await get().fetchCredits();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to update credit' });
      throw err;
    }
  },

  deleteCredit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/api/user/deposit/${id}`);
      // Reset isLoading before refetch so the guard allows it
      set({ isLoading: false });
      await get().fetchCredits();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to delete credit' });
      throw err;
    }
  },
}));
