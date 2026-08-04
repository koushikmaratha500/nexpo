import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from './useApi';
import { PaginatedResponse, TransactionResponse } from '@/types/api';

interface TransactionFilters {
  type?: 'DEBIT' | 'CREDIT';
  categoryId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export function useTransactions() {
  const [data, setData] = useState<PaginatedResponse<TransactionResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (filters: TransactionFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.append(key, String(value));
      });
      const result = await apiGet<PaginatedResponse<TransactionResponse>>(
        `/api/transactions?${params.toString()}`
      );
      setData(result);
      return result;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Failed to fetch transactions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = useCallback(async (body: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<TransactionResponse>('/api/transactions', body);
      return result;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Failed to create transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, body: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPatch<TransactionResponse>(`/api/transactions/${id}`, body);
      return result;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Failed to update transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiDelete<{ success: boolean }>(`/api/transactions/${id}`);
      return result;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Failed to delete transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
