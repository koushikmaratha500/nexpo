'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { TransactionResponse } from '@/types/api';

export interface TransactionListProps {
  type?: 'DEBIT' | 'CREDIT';
  showActions?: boolean;
  onEdit?: (transaction: TransactionResponse) => void;
  onDelete?: (transaction: TransactionResponse) => void;
  autoFetch?: boolean;
}

export function TransactionList({
  type,
  showActions = false,
  onEdit,
  onDelete,
  autoFetch = true,
}: TransactionListProps) {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const {
    data: listData,
    loading,
    error,
    fetchTransactions,
    deleteTransaction,
  } = useTransactions();

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions({ type, page, pageSize: itemsPerPage }).catch(() => {});
    }
  }, [autoFetch, type, page, fetchTransactions, itemsPerPage]);

  const handleDelete = async (transaction: TransactionResponse) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(transaction.id);
      addToast('Transaction deleted', 'success');
      fetchTransactions({ type, page, pageSize: itemsPerPage }).catch(() => {});
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      addToast(e.response?.data?.error || e.message || 'Failed to delete', 'error');
    }
  };

  const items = listData?.items || [];

  return (
    <Card>
      {error && <div className="text-error p-4">{error}</div>}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={showActions ? 5 : 4}>Loading...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 5 : 4} className="text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              items.map((t: TransactionResponse) => (
                <TableRow key={t.id}>
                  <TableCell>{t.title || t.merchant}</TableCell>
                  <TableCell>{t.amount}</TableCell>
                  <TableCell>{t.transactionDate}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  {showActions && onEdit && onDelete && (
                    <TableCell className="text-right">
                      <button
                        onClick={() => onEdit(t)}
                        className="text-primary hover:text-primary/80 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="text-error hover:text-error/80"
                      >
                        Delete
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {listData?.total && listData.total > itemsPerPage && (
        <TablePagination
          currentPage={page}
          totalItems={listData.total}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
        />
      )}
    </Card>
  );
}
