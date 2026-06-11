import { create } from 'zustand';
import axios from 'axios';
import { Expense, MOCK_EXPENSES } from '@/mock/data';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'submittedBy' | 'status'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

// Map database Prisma response to client Expense interface
const mapDbExpenseToExpense = (dbExp: any): Expense => ({
  id: dbExp.id,
  merchant: dbExp.notes || 'Expense Title',
  description: dbExp.notes || 'Expense Title',
  category: dbExp.category?.name?.toUpperCase() || 'FOOD',
  date: new Date(dbExp.expenseDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
  status: 'PENDING',
  amount: typeof dbExp.amount === 'string' ? parseFloat(dbExp.amount) : dbExp.amount,
  submittedBy: 'Alex Sterling',
  paymentType: dbExp.paymentType || 'Credit Card',
  currency: dbExp.currency?.code || 'INR',
  notes: dbExp.notes || undefined,
  receiptName: dbExp.receiptFileName || undefined,
  receiptSize: dbExp.receiptSize ? `${(dbExp.receiptSize / 1024).toFixed(0)} KB` : undefined,
  receiptUrl: dbExp.receiptUrl || undefined,
});

const LOCAL_STORAGE_KEY = 'nexpo_expenses_local';

// Safe localStorage getter
const getLocalStorageExpenses = (): Expense[] => {
  if (typeof window === 'undefined') return MOCK_EXPENSES;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : MOCK_EXPENSES;
  } catch (e) {
    return MOCK_EXPENSES;
  }
};

// Safe localStorage setter
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

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/expenses');
      const mapped = response.data.map(mapDbExpenseToExpense);
      set({ expenses: mapped, isLoading: false });
      // Keep local storage in sync
      setLocalStorageExpenses(mapped);
    } catch (err: any) {
      console.warn('API fetchExpenses failed, falling back to local storage:', err);
      // Fallback
      const local = getLocalStorageExpenses();
      set({ expenses: local, isLoading: false });
    }
  },

  addExpense: async (newExpData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        merchant: newExpData.merchant,
        categoryName: newExpData.category,
        amount: newExpData.amount,
        date: newExpData.date,
        paymentType: newExpData.paymentType,
        notes: newExpData.notes || newExpData.merchant,
        currencyCode: newExpData.currency || 'INR',
      };
      const response = await axios.post('/api/expenses', payload);
      const mapped = mapDbExpenseToExpense(response.data);
      set((state) => {
        const updated = [mapped, ...state.expenses];
        setLocalStorageExpenses(updated);
        return { expenses: updated, isLoading: false };
      });
    } catch (err: any) {
      console.warn('API addExpense failed, writing locally:', err);
      // Fallback to local
      set((state) => {
        const localNew: Expense = {
          id: `local-exp-${Date.now()}`,
          merchant: newExpData.merchant,
          description: newExpData.merchant,
          category: newExpData.category,
          date: new Date(newExpData.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: 'PENDING',
          amount: Number(newExpData.amount),
          submittedBy: 'Alex Sterling',
          paymentType: newExpData.paymentType || 'Credit Card',
          currency: newExpData.currency || 'INR',
          notes: newExpData.notes,
          receiptName: newExpData.receiptName,
          receiptSize: newExpData.receiptSize,
          receiptUrl: newExpData.receiptUrl,
        };
        const updated = [localNew, ...state.expenses];
        setLocalStorageExpenses(updated);
        return { expenses: updated, isLoading: false };
      });
    }
  },

  updateExpense: async (id, updatedExpData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        merchant: updatedExpData.merchant,
        categoryName: updatedExpData.category,
        amount: updatedExpData.amount,
        date: updatedExpData.date,
        paymentType: updatedExpData.paymentType,
        notes: updatedExpData.notes || updatedExpData.merchant,
        currencyCode: updatedExpData.currency || 'INR',
      };
      const response = await axios.put(`/api/expenses/${id}`, payload);
      const mapped = mapDbExpenseToExpense(response.data);
      set((state) => {
        const updated = state.expenses.map((e) => (e.id === id ? mapped : e));
        setLocalStorageExpenses(updated);
        return { expenses: updated, isLoading: false };
      });
    } catch (err: any) {
      console.warn('API updateExpense failed, updating locally:', err);
      set((state) => {
        const updated = state.expenses.map((e) => {
          if (e.id === id) {
            return {
              ...e,
              ...updatedExpData,
              // Format date nicely if date changed
              date: updatedExpData.date
                ? new Date(updatedExpData.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                : e.date,
            };
          }
          return e;
        });
        setLocalStorageExpenses(updated);
        return { expenses: updated, isLoading: false };
      });
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/api/expenses/${id}`);
      set((state) => {
        const updated = state.expenses.filter((e) => e.id !== id);
        setLocalStorageExpenses(updated);
        return { expenses: updated, isLoading: false };
      });
    } catch (err: any) {
      console.warn('API deleteExpense failed, removing locally:', err);
      set((state) => {
        const updated = state.expenses.filter((e) => e.id !== id);
        setLocalStorageExpenses(updated);
        return { expenses: updated, isLoading: false };
      });
    }
  },
}));
