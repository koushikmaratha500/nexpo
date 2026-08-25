'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { GroupCreateForm, GroupList, type GroupListItem } from '@/components/features/groups';
import { useToast } from '@/hooks/useToast';

export default function CustomerGroupsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/user/groups');
      setGroups(response.data.items || []);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load groups';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleCreate = async (payload: { name: string; description?: string }) => {
    try {
      const response = await axios.post('/api/user/groups', payload);
      addToast('Group created successfully.', 'success');
      setIsCreateOpen(false);
      await loadGroups();
      if (response.data?.id) {
        router.push(`/customer/groups/${response.data.id}`);
      }
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to create group';
      addToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const adminCount = groups.filter((group) => group.myRole === 'ADMIN').length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Groups</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Split shared expenses with roommates, trips, and teams. Group transactions are separate from your personal ledger.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <span className="material-symbols-outlined text-sm">add</span>
          Create Group
        </Button>
      </div>

      {!isLoading && groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-surface-container-lowest p-4" glass={false}>
            <p className="font-label-md text-on-surface-variant uppercase font-bold">Your groups</p>
            <p className="font-headline-sm font-black text-primary mt-1">{groups.length}</p>
          </Card>
          <Card className="bg-surface-container-lowest p-4" glass={false}>
            <p className="font-label-md text-on-surface-variant uppercase font-bold">Admin of</p>
            <p className="font-headline-sm font-black text-primary mt-1">{adminCount}</p>
          </Card>
          <Card className="bg-surface-container-lowest p-4" glass={false}>
            <p className="font-label-md text-on-surface-variant uppercase font-bold">Total members</p>
            <p className="font-headline-sm font-black text-primary mt-1">
              {groups.reduce((sum, group) => sum + group.memberCount, 0)}
            </p>
          </Card>
        </div>
      )}

      {groups.length > 0 && (
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md focus:outline-none focus:border-primary text-on-surface"
          />
        </div>
      )}

      <GroupList groups={groups} isLoading={isLoading} searchQuery={searchQuery} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Group">
        <GroupCreateForm onCreate={handleCreate} onCancel={() => setIsCreateOpen(false)} />
      </Modal>
    </div>
  );
}
