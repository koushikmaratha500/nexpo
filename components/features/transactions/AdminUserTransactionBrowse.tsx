'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { Button } from '@/components/ui/Button';
import { useTransactionBrowse } from '@/hooks/useTransactionBrowse';
import { TransactionBrowseToolbar } from './TransactionBrowseToolbar';
import { TransactionCalendarGrid } from './TransactionCalendarGrid';
import type { Transaction, TransactionType } from '@/store/transactionStore';

export interface AdminUserTransactionBrowseProps {
  userId: string;
  onViewTransaction?: (transaction: Transaction) => void;
}

export function AdminUserTransactionBrowse({ userId, onViewTransaction }: AdminUserTransactionBrowseProps) {
  const browse = useTransactionBrowse({
    apiBasePath: `/api/admin/user/${userId}/transactions`,
  });
  const [activeFilter, setActiveFilter] = useState<'ALL' | TransactionType>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    browse.setFilters({
      type: activeFilter === 'ALL' ? undefined : activeFilter,
      search,
    });
    browse.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      browse.setFilters({
        type: activeFilter === 'ALL' ? undefined : activeFilter,
        search,
      });
      browse.setPage(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      <TransactionBrowseToolbar
        periodMode={browse.periodMode}
        onPeriodChange={browse.setPeriodMode}
        displayMode={browse.displayMode}
        onDisplayModeChange={browse.setDisplayMode}
        periodRange={browse.periodRange}
        onNavigate={browse.navigatePeriod}
        canNavigateForward={browse.periodMode !== 'ytd'}
      />

      <Card className="bg-surface-container-lowest flex flex-col lg:flex-row gap-4 items-stretch lg:items-center px-lg py-md" glass={false}>
        <div className="flex items-center gap-2">
          {(['ALL', 'DEBIT', 'CREDIT'] as const).map((f) => (
            <Button
              key={f}
              variant={activeFilter === f ? 'primary' : 'secondary'}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-2"
            >
              {f === 'ALL' ? 'All' : f}
            </Button>
          ))}
        </div>
        <input
          type="search"
          aria-label="Search transactions"
          placeholder="Search title, merchant, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg"
        />
        <div className="text-sm whitespace-nowrap">
          <span className="text-error font-bold mr-3">Debit {browse.totalDebit.toFixed(2)}</span>
          <span className="text-secondary font-bold">Credit {browse.totalCredit.toFixed(2)}</span>
        </div>
      </Card>

      {browse.displayMode === 'calendar' ? (
        <TransactionCalendarGrid
          monthAnchor={browse.anchorDate}
          transactions={browse.calendarItems}
          onSelectTransaction={onViewTransaction}
        />
      ) : (
        <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead align="center">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {browse.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : browse.tableItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-on-surface-variant">
                    No transactions in this period.
                  </TableCell>
                </TableRow>
              ) : (
                browse.tableItems.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-primary">{t.title}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{t.date}</TableCell>
                    <TableCell align="right" className="font-mono-data">
                      {t.amount.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <button
                        type="button"
                        className="p-1 rounded-full hover:bg-surface-container"
                        aria-label={`View ${t.title}`}
                        onClick={() => onViewTransaction?.(t)}
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={browse.page}
            totalItems={browse.total}
            itemsPerPage={browse.itemsPerPage}
            onPageChange={browse.setPage}
            onItemsPerPageChange={browse.setItemsPerPage}
          />
        </Card>
      )}
    </div>
  );
}
