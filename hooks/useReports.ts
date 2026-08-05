import { useState, useCallback } from 'react';
import { apiGet } from './useApi';
import { TransactionResponse } from '@/types/api';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportData {
  expenses: { items: TransactionResponse[]; total: number };
  budgets: { items: TransactionResponse[]; total: number };
}

export function useReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (filters: ReportFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.append(key, String(value));
      });
      const result = await apiGet<ReportData>(`/api/admin/reports?${params.toString()}`);
      setData(result);
      return result;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Failed to fetch reports');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchReports };
}
