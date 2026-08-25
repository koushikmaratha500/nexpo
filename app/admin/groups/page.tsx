'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TablePagination } from '@/components/ui/TablePagination';
import { AdminGroupList, type AdminGroupListItem } from '@/components/features/admin/groups';
import { useToast } from '@/hooks/useToast';

export default function AdminGroupsPage() {
  const { addToast } = useToast();
  const [groups, setGroups] = useState<AdminGroupListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/groups', {
        params: {
          page: currentPage,
          pageSize: itemsPerPage,
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        },
      });
      setGroups(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load groups';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Groups</h2>
          <p className="font-body-lg text-on-surface-variant mt-1">
            View customer expense groups, members, and balances. Admin access is read-only.
          </p>
        </div>
        <Button variant="secondary" onClick={loadGroups} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
          search
        </span>
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md focus:outline-none focus:border-primary text-on-surface"
        />
      </div>

      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="px-6 py-4 border-b border-outline-variant/30">
          <p className="font-label-md text-on-surface-variant">{total} group{total === 1 ? '' : 's'}</p>
        </div>
        <div className="p-4">
          <AdminGroupList groups={groups} isLoading={isLoading} />
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
    </div>
  );
}
