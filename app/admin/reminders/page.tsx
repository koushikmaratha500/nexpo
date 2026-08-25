'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TablePagination } from '@/components/ui/TablePagination';
import {
  AdminReminderList,
  AdminReminderDetailModal,
  type AdminReminderListItem,
  type AdminReminderDetail,
} from '@/components/features/admin/reminders';
import { useToast } from '@/hooks/useToast';

const SCOPE_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'GROUP', label: 'Group' },
] as const;

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SNOOZED', label: 'Snoozed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export default function AdminRemindersPage() {
  const { addToast } = useToast();
  const [reminders, setReminders] = useState<AdminReminderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [scopeFilter, setScopeFilter] = useState<(typeof SCOPE_FILTERS)[number]['value']>('ALL');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<AdminReminderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/reminders', {
        params: {
          page: currentPage,
          pageSize: itemsPerPage,
          scope: scopeFilter,
          ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        },
      });
      setReminders(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load reminders';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, currentPage, itemsPerPage, scopeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleViewReminder = async (reminder: AdminReminderListItem) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setSelectedReminder(reminder);
    try {
      const response = await axios.get<AdminReminderDetail>(`/api/admin/reminders/${reminder.id}`);
      setSelectedReminder(response.data);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load reminder details';
      addToast(msg, 'error');
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Reminders</h2>
          <p className="font-body-lg text-on-surface-variant mt-1">
            Review personal and group payment reminders across the platform.
          </p>
        </div>
        <Button variant="secondary" onClick={loadReminders} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <Card className="bg-surface-container-lowest p-4 flex flex-col gap-4" glass={false}>
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Search title or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md focus:outline-none focus:border-primary text-on-surface"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SCOPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setScopeFilter(filter.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-label-md font-bold ${
                scopeFilter === filter.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setStatusFilter(filter.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-label-md font-bold ${
                statusFilter === filter.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="px-6 py-4 border-b border-outline-variant/30">
          <p className="font-label-md text-on-surface-variant">{total} reminder{total === 1 ? '' : 's'}</p>
        </div>
        <div className="px-2 sm:px-4 py-2">
          <AdminReminderList reminders={reminders} isLoading={isLoading} onView={handleViewReminder} />
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

      <AdminReminderDetailModal
        reminder={selectedReminder}
        isOpen={isDetailOpen}
        isLoading={isDetailLoading}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReminder(null);
        }}
      />
    </div>
  );
}
