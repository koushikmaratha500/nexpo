'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  GroupMembersPanel,
  GroupTransactionForm,
  GroupTransactionList,
  GroupBalancesPanel,
  formatGroupAmount,
  type GroupMemberItem,
  type GroupTransactionItem,
  type GroupBalanceMember,
} from '@/components/features/groups';
import { GroupRemindersPanel } from '@/components/features/reminders';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/useToast';

interface GroupDetail {
  id: string;
  name: string;
  description?: string | null;
  myRole: 'ADMIN' | 'MEMBER';
  members: GroupMemberItem[];
}

type GroupTab = 'members' | 'transactions' | 'balances' | 'reminders';

export default function CustomerGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const groupId = params.id;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [transactions, setTransactions] = useState<GroupTransactionItem[]>([]);
  const [balances, setBalances] = useState<{
    members: GroupBalanceMember[];
    currencyCode: string;
    currencySymbol: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<GroupTab>('transactions');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const response = await axios.get<GroupDetail>(`/api/user/groups/${groupId}`);
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

  const loadTransactions = useCallback(async () => {
    if (!groupId) return;
    setIsLoadingTransactions(true);
    try {
      const response = await axios.get<{ items: GroupTransactionItem[] }>(
        `/api/user/groups/${groupId}/transactions`,
      );
      setTransactions(response.data.items || []);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load group transactions';
      addToast(msg, 'error');
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [addToast, groupId]);

  const loadBalances = useCallback(async () => {
    if (!groupId) return;
    setIsLoadingBalances(true);
    try {
      const response = await axios.get<{
        members: GroupBalanceMember[];
        currencyCode: string;
        currencySymbol: string;
      }>(`/api/user/groups/${groupId}/balances`);
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
    loadBalances();
  }, [loadGroup, loadBalances]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
    if (activeTab === 'balances') {
      loadBalances();
    }
  }, [activeTab, loadTransactions, loadBalances]);

  const handleInvite = async (payload: { username?: string; email?: string; phone?: string }) => {
    try {
      const response = await axios.post(`/api/user/groups/${groupId}/members`, payload);
      addToast(
        response.data.status === 'joined' ? 'Member added to the group.' : 'Invite recorded for future signup.',
        'success',
      );
      await loadGroup();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to invite member';
      addToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const handlePromote = async (memberId: string) => {
    try {
      await axios.post(`/api/user/groups/${groupId}/members/${memberId}/promote`);
      addToast('Member promoted to admin.', 'success');
      await loadGroup();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to promote member';
      addToast(msg, 'error');
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      const removedMember = group?.members.find((member) => member.memberId === memberId);
      const removedSelf =
        (user?.email && removedMember?.email === user.email) ||
        (user?.username && removedMember?.username === user.username);

      await axios.delete(`/api/user/groups/${groupId}/members/${memberId}`);
      addToast('Member removed from group.', 'success');

      if (removedSelf) {
        router.push('/customer/groups');
        return;
      }
      await loadGroup();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to remove member';
      addToast(msg, 'error');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await axios.delete(`/api/user/groups/${groupId}/transaction/${transactionId}`);
      addToast('Group expense deleted.', 'success');
      await Promise.all([loadTransactions(), loadBalances()]);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to delete group expense';
      addToast(msg, 'error');
    }
  };

  const handleTransactionCreated = async () => {
    addToast('Group expense added.', 'success');
    await Promise.all([loadTransactions(), loadBalances()]);
  };

  if (isLoading) {
    return <div className="py-16 text-center text-on-surface-variant">Loading group...</div>;
  }

  if (!group) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-4">
        <p className="text-on-surface-variant">Group not found or access denied.</p>
        <Link href="/customer/groups">
          <Button variant="secondary">Back to groups</Button>
        </Link>
      </div>
    );
  }

  const currentMember = group.members.find(
    (member) =>
      (user?.email && member.email === user.email) ||
      (user?.username && member.username === user.username),
  );
  const currentUserId = currentMember?.userId;
  const myBalance = balances?.members.find((member) => member.userId === currentUserId);
  const currencySymbol = balances?.currencySymbol || '₹';

  const balanceSummary = (() => {
    if (isLoadingBalances && !balances) {
      return { label: 'You owe', value: 'Loading...', tone: 'neutral' as const };
    }
    const owedAmount = myBalance && myBalance.balance < 0 ? Math.abs(myBalance.balance) : 0;
    return {
      label: 'You owe',
      value: formatGroupAmount(owedAmount, currencySymbol),
      tone: owedAmount > 0 ? ('owe' as const) : ('settled' as const),
    };
  })();

  const tabs: { id: GroupTab; label: string }[] = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'balances', label: 'Balances' },
    { id: 'members', label: 'Members' },
    { id: 'reminders', label: 'Reminders' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <Link href="/customer/groups" className="text-primary font-bold hover:underline text-label-md">
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
        <p className="font-label-md text-on-surface-variant uppercase font-bold">{balanceSummary.label}</p>
        <p
          className={`font-title-md font-bold ${
            balanceSummary.tone === 'owe' ? 'text-error' : 'text-on-surface'
          }`}
        >
          {balanceSummary.value}
        </p>
        {myBalance && (
          <p className="font-label-md text-on-surface-variant">
            {myBalance.balance > 0
              ? `Others owe you ${formatGroupAmount(myBalance.balance, currencySymbol)} in this group`
              : `Paid ${formatGroupAmount(myBalance.netPaid, currencySymbol)} · Your share ${formatGroupAmount(myBalance.netOwed, currencySymbol)}`}
          </p>
        )}
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

      {activeTab === 'members' && (
        <GroupMembersPanel
          members={group.members}
          myRole={group.myRole}
          currentUserEmail={user?.email}
          currentUserUsername={user?.username}
          onInvite={handleInvite}
          onPromote={handlePromote}
          onRemove={handleRemove}
        />
      )}

      {activeTab === 'transactions' && (
        <div className="flex flex-col gap-6">
          <Card className="bg-primary-fixed/30 border border-primary/10 p-4 flex gap-3" glass={false}>
            <span className="material-symbols-outlined text-primary shrink-0">info</span>
            <p className="font-body-md text-on-surface-variant">
              Group expenses are tracked here only. They do not appear in your{' '}
              <Link href="/customer/transactions" className="text-primary font-bold hover:underline">
                personal transactions
              </Link>{' '}
              ledger.
            </p>
          </Card>

          {isLoadingTransactions ? (
            <div className="py-8 text-center text-on-surface-variant">Loading transactions...</div>
          ) : (
            <GroupTransactionList
              transactions={transactions}
              members={group.members}
              myRole={group.myRole}
              currentUserId={currentUserId}
              currencySymbol={currencySymbol}
              onDelete={handleDeleteTransaction}
            />
          )}

          <GroupTransactionForm
            groupId={groupId}
            members={group.members}
            currentUserId={currentUserId}
            currencySymbol={currencySymbol}
            onCreated={handleTransactionCreated}
          />
        </div>
      )}

      {activeTab === 'balances' && (
        <GroupBalancesPanel
          groupId={groupId}
          members={balances?.members || []}
          currencySymbol={currencySymbol}
          isLoading={isLoadingBalances}
        />
      )}

      {activeTab === 'reminders' && (
        <GroupRemindersPanel groupId={groupId} myRole={group.myRole} />
      )}
    </div>
  );
}
