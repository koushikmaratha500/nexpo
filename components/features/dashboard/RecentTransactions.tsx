'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { TransactionDetailModal } from '@/components/features/transactions/TransactionDetailModal';
import type { Transaction } from '@/store/transactionStore';

export interface RecentTransactionsProps {
  transactions: Transaction[];
}

function getIconName(item: Transaction): string {
  if (item.category === 'FOOD') return 'restaurant';
  if (item.category === 'TRAVEL') return 'flight';
  if (item.type === 'CREDIT') return 'account_balance_wallet';
  return 'payments';
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

  return (
    <div className="col-span-12">
      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="p-6 flex items-center justify-between border-b border-outline-variant bg-white/40">
          <h4 className="font-title-md text-title-md font-bold text-primary">Recent Transactions</h4>
          <Link
            href="/customer/transactions"
            className="text-primary font-label-md hover:underline decoration-2 underline-offset-4"
          >
            View All Activity
          </Link>
        </div>

        <div className="w-full overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => setViewingTransaction(item)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/30 ${
                        item.type === 'CREDIT'
                          ? 'bg-secondary-container/20 text-secondary'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        <span className="material-symbols-outlined text-sm">{getIconName(item)}</span>
                      </div>
                      <div>
                        <p className="font-body-md text-body-md font-bold text-primary">{item.title || item.merchant}</p>
                        <p className="font-label-md text-on-surface-variant">{item.description || item.merchant}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="px-2 py-1 bg-secondary-container/10 text-on-secondary-container rounded-full text-[10px] font-bold inline-block w-fit">
                        {item.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block w-fit ${
                        item.type === 'CREDIT'
                          ? 'bg-secondary-container/20 text-secondary'
                          : 'bg-error-container/30 text-error'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-label-md text-on-surface-variant">{item.date}</TableCell>
                  <TableCell align="right" className={`font-mono-data text-mono-data text-right font-bold ${
                    item.type === 'CREDIT' ? 'text-secondary' : 'text-primary'
                  }`}>
                    {item.type === 'CREDIT' ? '+' : '-'}{item.currency} {item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-on-surface-variant italic">
                    No transactions recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <TransactionDetailModal
        transaction={viewingTransaction}
        open={viewingTransaction !== null}
        onClose={() => setViewingTransaction(null)}
      />
    </div>
  );
}
