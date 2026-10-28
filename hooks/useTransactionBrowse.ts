'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  resolveTransactionPeriodRange,
  shiftPeriodAnchor,
  periodRangeToQueryParams,
  type TransactionPeriodMode,
} from '@/lib/transactions/period-range';
import { mapDbTransactionToClient } from '@/lib/transactions/map-client-transaction';
import type { Transaction, TransactionType } from '@/store/transactionStore';

export type TransactionDisplayMode = 'table' | 'calendar';

export interface TransactionBrowseFilters {
  type?: TransactionType;
  category?: string;
  search?: string;
}

export interface UseTransactionBrowseOptions {
  apiBasePath?: string;
  initialPeriod?: TransactionPeriodMode;
  initialDisplayMode?: TransactionDisplayMode;
}

export function useTransactionBrowse(options: UseTransactionBrowseOptions = {}) {
  const apiBasePath = options.apiBasePath ?? '/api/user/transactions';
  const [periodMode, setPeriodMode] = useState<TransactionPeriodMode>(
    options.initialPeriod ?? 'month',
  );
  const [displayMode, setDisplayMode] = useState<TransactionDisplayMode>(
    options.initialDisplayMode ?? 'table',
  );
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [filters, setFilters] = useState<TransactionBrowseFilters>({});
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<Transaction[]>([]);
  const [calendarItems, setCalendarItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRequestRef = useRef(0);
  const calendarRequestRef = useRef(0);

  const periodRange = useMemo(
    () => resolveTransactionPeriodRange(periodMode, anchorDate),
    [periodMode, anchorDate],
  );

  const queryRange = useMemo(() => periodRangeToQueryParams(periodRange), [periodRange]);

  const buildParams = useCallback(
    (pageNum: number, pageSize: number) => {
      const params = new URLSearchParams();
      params.set('includeTotals', 'true');
      params.set('page', String(pageNum));
      params.set('pageSize', String(pageSize));
      params.set('startDate', queryRange.startDate);
      params.set('endExclusive', queryRange.endExclusive);
      if (filters.type) params.set('type', filters.type);
      if (filters.category) params.set('category', filters.category);
      if (filters.search?.trim()) params.set('search', filters.search.trim());
      return params;
    },
    [filters.category, filters.search, filters.type, queryRange.endExclusive, queryRange.startDate],
  );

  const loadTablePage = useCallback(async () => {
    const reqId = ++listRequestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const params = buildParams(page, itemsPerPage);
      const res = await axios.get<{
        items: unknown[];
        total: number;
        totalDebit?: number;
        totalCredit?: number;
      }>(`${apiBasePath}?${params.toString()}`);
      if (reqId !== listRequestRef.current) return;
      const mapped = (res.data.items || []).map(
        (row) => mapDbTransactionToClient(row as Record<string, unknown>) as Transaction,
      );
      setItems(mapped);
      setTotal(res.data.total ?? mapped.length);
      setTotalDebit(res.data.totalDebit ?? 0);
      setTotalCredit(res.data.totalCredit ?? 0);
    } catch (err: unknown) {
      if (reqId !== listRequestRef.current) return;
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : 'Failed to load transactions';
      setError(message);
    } finally {
      if (reqId === listRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiBasePath, buildParams, itemsPerPage, page]);

  const loadCalendarRange = useCallback(async () => {
    const reqId = ++calendarRequestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const params = buildParams(1, 500);
      const res = await axios.get<{
        items: unknown[];
        total: number;
        totalDebit?: number;
        totalCredit?: number;
      }>(`${apiBasePath}?${params.toString()}`);
      if (reqId !== calendarRequestRef.current) return;
      let mapped = (res.data.items || []).map(
        (row) => mapDbTransactionToClient(row as Record<string, unknown>) as Transaction,
      );
      const reportedTotal = res.data.total ?? mapped.length;
      if (reportedTotal > mapped.length) {
        const all: Transaction[] = [...mapped];
        let nextPage = 2;
        while (all.length < reportedTotal && nextPage <= 20) {
          const p = buildParams(nextPage, 500);
          const more = await axios.get<{ items: unknown[] }>(`${apiBasePath}?${p.toString()}`);
          if (reqId !== calendarRequestRef.current) return;
          all.push(
            ...(more.data.items || []).map(
              (row) => mapDbTransactionToClient(row as Record<string, unknown>) as Transaction,
            ),
          );
          nextPage += 1;
        }
        mapped = all;
      }
      setCalendarItems(mapped);
      setTotalDebit(res.data.totalDebit ?? 0);
      setTotalCredit(res.data.totalCredit ?? 0);
      setTotal(reportedTotal);
    } catch (err: unknown) {
      if (reqId !== calendarRequestRef.current) return;
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : 'Failed to load calendar transactions';
      setError(message);
    } finally {
      if (reqId === calendarRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiBasePath, buildParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (displayMode === 'table') {
        void loadTablePage();
      } else {
        void loadCalendarRange();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [displayMode, loadCalendarRange, loadTablePage]);

  const setPeriodModeAndReset = useCallback((mode: TransactionPeriodMode) => {
    setPeriodMode(mode);
    setAnchorDate(new Date());
    setPage(1);
  }, []);

  const navigatePeriod = useCallback(
    (direction: -1 | 1) => {
      setAnchorDate((prev) => shiftPeriodAnchor(periodMode, prev, direction));
      setPage(1);
    },
    [periodMode],
  );

  const refresh = useCallback(() => {
    if (displayMode === 'table') {
      void loadTablePage();
    } else {
      void loadCalendarRange();
    }
  }, [displayMode, loadCalendarRange, loadTablePage]);

  return {
    periodMode,
    setPeriodMode: setPeriodModeAndReset,
    displayMode,
    setDisplayMode,
    periodRange,
    anchorDate,
    navigatePeriod,
    filters,
    setFilters,
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage: (n: number) => {
      setItemsPerPage(n);
      setPage(1);
    },
    items: displayMode === 'table' ? items : calendarItems,
    tableItems: items,
    calendarItems,
    total,
    totalDebit,
    totalCredit,
    isLoading,
    error,
    refresh,
  };
}
