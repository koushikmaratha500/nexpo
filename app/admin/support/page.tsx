'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TablePagination } from '@/components/ui/TablePagination';
import { SupportTicketList, type SupportTicketListItem } from '@/components/features/support';
import { useToast } from '@/hooks/useToast';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All tickets' },
  { value: 'A', label: 'Open' },
  { value: 'I', label: 'Closed' },
];

export default function AdminSupportPage() {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/support', {
        params: {
          page: currentPage,
          pageSize: itemsPerPage,
          ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        },
      });
      const items = (response.data.items || []) as SupportTicketListItem[];
      setTickets(items);
      setTotal(response.data.total || 0);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load support tickets';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, currentPage, itemsPerPage, statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Support Inbox</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Review customer requests, add triage notes, and close resolved tickets.
          </p>
        </div>
        <Button variant="secondary" onClick={loadTickets} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="px-6 py-4 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatusFilter(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-label-md font-bold transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <p className="font-label-md text-on-surface-variant">
            {total} ticket{total === 1 ? '' : 's'}
          </p>
        </div>

        <div className="px-2 sm:px-4">
          <SupportTicketList tickets={tickets} isLoading={isLoading} />
        </div>

        <div className="px-4 pb-4">
          <TablePagination
            currentPage={currentPage}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </Card>

      <div className="text-label-md text-on-surface-variant">
        Need policy changes?{' '}
        <Link href="/admin/settings" className="text-primary font-bold hover:underline">
          Open system settings
        </Link>
      </div>
    </div>
  );
}
