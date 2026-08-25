'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  GroupMembersPanel,
  GroupBalancesPanel,
  type GroupMemberItem,
  type GroupBalanceMember,
} from '@/components/features/groups';
import { UserProfileLink } from '@/components/features/users';
import { useToast } from '@/hooks/useToast';

interface AdminGroupDetail {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string;
    email?: string | null;
  };
  members: GroupMemberItem[];
}

type AdminGroupTab = 'members' | 'balances';

export default function AdminGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const { addToast } = useToast();
  const groupId = params.id;

  const [group, setGroup] = useState<AdminGroupDetail | null>(null);
  const [balances, setBalances] = useState<{
    members: GroupBalanceMember[];
    currencySymbol: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<AdminGroupTab>('members');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const response = await axios.get<AdminGroupDetail>(`/api/admin/groups/${groupId}`);
      setGroup(response.data);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load group';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, groupId]);

  const loadBalances = useCallback(async () => {
    if (!groupId) return;
    setIsLoadingBalances(true);
    try {
      const response = await axios.get<{
        members: GroupBalanceMember[];
        currencySymbol: string;
      }>(`/api/admin/groups/${groupId}/balances`);
      setBalances(response.data);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load group balances';
      addToast(msg, 'error');
    } finally {
      setIsLoadingBalances(false);
    }
  }, [addToast, groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (activeTab === 'balances') {
      loadBalances();
    }
  }, [activeTab, loadBalances]);

  if (isLoading) {
    return <div className="py-16 text-center text-on-surface-variant">Loading group...</div>;
  }

  if (!group) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-4">
        <p className="text-on-surface-variant">Group not found.</p>
        <Link href="/admin/groups">
          <Button variant="secondary">Back to groups</Button>
        </Link>
      </div>
    );
  }

  const tabs: { id: AdminGroupTab; label: string }[] = [
    { id: 'members', label: 'Members' },
    { id: 'balances', label: 'Balances' },
  ];

  const creatorLabel = group.createdBy.username
    ? `@${group.createdBy.username}`
    : `${group.createdBy.firstName}${group.createdBy.lastName ? ` ${group.createdBy.lastName}` : ''}`;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <Link href="/admin/groups" className="text-primary font-bold hover:underline text-label-md">
            ← Back to groups
          </Link>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight mt-2">
            {group.name}
          </h2>
          {group.description && (
            <p className="font-body-lg text-on-surface-variant mt-1">{group.description}</p>
          )}
        </div>
      </div>

      <Card className="bg-surface-container-lowest flex flex-col gap-2" glass={false}>
        <p className="font-label-md text-on-surface-variant uppercase font-bold">Created by</p>
        <p className="font-title-md font-bold">
          <UserProfileLink user={group.createdBy} mode="always" linkClassName="text-primary font-bold hover:underline">
            {creatorLabel}
          </UserProfileLink>
        </p>
        {group.createdBy.email && (
          <p className="font-label-md text-on-surface-variant">
            <UserProfileLink
              user={{ id: group.createdBy.id, email: group.createdBy.email }}
              mode="always"
            />
          </p>
        )}
        <p className="font-label-md text-on-surface-variant">
          {group.members.length} member{group.members.length === 1 ? '' : 's'} · Created{' '}
          {new Date(group.createdAt).toLocaleDateString()}
        </p>
      </Card>

      <Card className="bg-primary-fixed/30 border border-primary/10 p-4 flex gap-3" glass={false}>
        <span className="material-symbols-outlined text-primary shrink-0">visibility</span>
        <p className="font-body-md text-on-surface-variant">
          Admin view is read-only. Transactions and reminders are managed in the customer portal.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full font-label-md font-bold ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' && <GroupMembersPanel members={group.members} readOnly />}

      {activeTab === 'balances' && (
        <GroupBalancesPanel
          groupId={groupId}
          members={balances?.members || []}
          currencySymbol={balances?.currencySymbol || '₹'}
          isLoading={isLoadingBalances}
          readOnly
        />
      )}
    </div>
  );
}
