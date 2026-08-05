import { create } from 'zustand';
import axios from 'axios';
import { Expense, MOCK_EXPENSES } from '@/mock/data';
import { formatDate } from '@/lib/date';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: (filters?: { categoryId?: string; startDate?: string; endDate?: string }) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'submittedBy' | 'status'>, file?: File | null) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>, file?: File | null) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

// Map database Prisma response to client Expense interface
const mapDbExpenseToExpense = (dbExp: any): Expense => ({
  id: dbExp.id,
  merchant: dbExp.title || dbExp.merchant || 'Expense Title',
  description: dbExp.description || dbExp.title || dbExp.merchant || 'Expense Title',
  category: dbExp.category?.name?.toUpperCase() || 'FOOD',
  date: formatDate(dbExp.expenseDate),
  status: 'PENDING',
  amount: typeof dbExp.amount === 'string' ? parseFloat(dbExp.amount) : dbExp.amount,
  submittedBy: 'Alex Sterling',
  paymentType: dbExp.paymentType?.name || 'Credit Card',
  currency: dbExp.currency?.code || 'INR',
  notes: dbExp.notes || undefined,
  receiptName: dbExp.receiptFileName || undefined,
  receiptSize: dbExp.receiptSize ? `${(dbExp.receiptSize / 1024).toFixed(0)} KB` : undefined,
  receiptUrl: dbExp.receiptUrl || undefined,
});

const LOCAL_STORAGE_KEY = 'nexpo_expenses_local';

const getLocalStorageExpenses = (): Expense[] => {
  if (typeof window === 'undefined') return MOCK_EXPENSES;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : MOCK_EXPENSES;
  } catch (e) {
    return MOCK_EXPENSES;
  }
};

const setLocalStorageExpenses = (expenses: Expense[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {}
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (filters?: { categoryId?: string; startDate?: string; endDate?: string }) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const { categoryId, startDate, endDate } = filters || {};
      const params = new URLSearchParams();
      params.set('pageSize', '1000');
      if (categoryId) params.set('categoryId', categoryId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await axios.get(`/api/user/expenses?${params.toString()}`);
      const items = response.data.items || response.data || [];
      const mapped = items.map(mapDbExpenseToExpense);
      set({ expenses: mapped, isLoading: false });
      setLocalStorageExpenses(mapped);
    } catch (err: any) {
      console.warn('API fetchExpenses failed, falling back to local storage:', err);
      const local = getLocalStorageExpenses();
      set({ expenses: local, isLoading: false });
    }
  },

  addExpense: async (newExpData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('title', newExpData.merchant || '');
      formData.append('category', newExpData.category || '');
      formData.append('amount', String(newExpData.amount));
      formData.append('expenseDate', newExpData.date || '');
      formData.append('paymentType', newExpData.paymentType || '');
      formData.append('notes', newExpData.notes || newExpData.merchant || '');
      formData.append('currency', newExpData.currency || 'INR');

      if (file) {
        formData.append('file', file);
      }

      await axios.post('/api/user/expense', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset isLoading before refetch so the guard allows it
      set({ isLoading: false });
      await get().fetchExpenses();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to add expense' });
      throw err;
    }
  },

  updateExpense: async (id, updatedExpData, file?: File | null) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      if (updatedExpData.merchant) formData.append('title', updatedExpData.merchant);
      if (updatedExpData.category) formData.append('category', updatedExpData.category);
      if (updatedExpData.amount !== undefined) formData.append('amount', String(updatedExpData.amount));
      if (updatedExpData.date) formData.append('expenseDate', updatedExpData.date);
      if (updatedExpData.paymentType) formData.append('paymentType', updatedExpData.paymentType);
      if (updatedExpData.notes !== undefined) formData.append('notes', updatedExpData.notes || '');
      if (updatedExpData.currency) formData.append('currency', updatedExpData.currency);

      if (file) {
        formData.append('file', file);
      }

      await axios.patch(`/api/user/expense/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset isLoading before refetch so the guard allows it
      set({ isLoading: false });
      await get().fetchExpenses();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to update expense' });
      throw err;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/api/user/expense/${id}`);
      // Reset isLoading before refetch so the guard allows it
      set({ isLoading: false });
      await get().fetchExpenses();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to delete expense' });
      throw err;
    }
  },
}));
