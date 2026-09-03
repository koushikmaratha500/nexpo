'use client';

import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SplitService, type SplitMode } from '@/lib/api/services/split.service';
import type { GroupMemberItem } from './GroupMembersPanel';
import { MemberProfileLink, balanceMemberToUserRef, memberToUserRef } from './memberLinks';
import { UserProfileLink } from '@/components/features/users';
import {
  GroupTransactionActionsMenu,
  GroupTransactionDetailModal,
} from './GroupTransactionActionsMenu';

export function formatGroupAmount(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export interface GroupBalanceMember {
  userId: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  netOwed: number;
  netPaid: number;
  balance: number;
}

interface GroupBalancesPanelProps {
  groupId: string;
  members: GroupBalanceMember[];
  currencySymbol: string;
  isLoading?: boolean;
  readOnly?: boolean;
}

function memberLabel(member: GroupBalanceMember) {
  return (
    <UserProfileLink
      user={balanceMemberToUserRef(member)}
      fallback={member.userId.slice(0, 8)}
    />
  );
}

export function GroupBalancesPanel({
  groupId,
  members,
  currencySymbol,
  isLoading,
  readOnly = false,
}: GroupBalancesPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`/api/user/groups/${groupId}/settlements/export`, {
        responseType: 'blob',
      });
      const blob = response.data as Blob;
      const disposition = String(response.headers['content-disposition'] || '');
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'group-settlements.csv';
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-on-surface-variant">Loading balances...</div>;
  }

  return (
    <Card className="bg-surface-container-lowest overflow-x-auto" glass={false}>
      <div className="p-4 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-title-md text-title-md font-bold text-primary">Group balances</h3>
          <p className="font-body-md text-on-surface-variant mt-1">
            Positive balance means others owe this member. Negative means they owe the group pool.
          </p>
        </div>
        {!readOnly && (
          <Button variant="secondary" disabled={isExporting || members.length === 0} onClick={handleExport}>
            {isExporting ? 'Exporting...' : 'Export settlement CSV'}
          </Button>
        )}
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-label-md uppercase text-on-surface-variant border-b border-outline-variant/20">
            <th className="px-4 py-3 font-bold">Member</th>
            <th className="px-4 py-3 font-bold">Paid</th>
            <th className="px-4 py-3 font-bold">Share owed</th>
            <th className="px-4 py-3 font-bold">Balance</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.userId} className="border-b border-outline-variant/10">
              <td className="px-4 py-3 font-body-md">{memberLabel(member)}</td>
              <td className="px-4 py-3 font-body-md">
                {formatGroupAmount(member.netPaid, currencySymbol)}
              </td>
              <td className="px-4 py-3 font-body-md">
                {formatGroupAmount(member.netOwed, currencySymbol)}
              </td>
              <td
                className={`px-4 py-3 font-title-sm font-bold ${
                  member.balance > 0 ? 'text-primary' : member.balance < 0 ? 'text-error' : 'text-on-surface'
                }`}
              >
                {member.balance > 0 ? '+' : member.balance < 0 ? '−' : ''}
                {formatGroupAmount(Math.abs(member.balance), currencySymbol)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export interface GroupTransactionSplit {
  userId: string;
  included: boolean;
  shareAmount?: number | null;
  sharePercent?: number | null;
  computedAmount: number;
  user?: {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string | null;
  };
}

export interface GroupTransactionItem {
  id: string;
  title: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  transactionDate: string;
  splitMode?: SplitMode | null;
  createdByUserId?: string | null;
  userId: string;
  createdBy?: {
    id: string;
    username?: string | null;
    firstName: string;
  } | null;
  currency?: { code: string; symbol: string } | null;
  splits?: GroupTransactionSplit[];
}

interface GroupTransactionListProps {
  transactions: GroupTransactionItem[];
  members: GroupMemberItem[];
  myRole: 'ADMIN' | 'MEMBER';
  currentUserId?: string;
  currencySymbol?: string;
  onDelete: (transactionId: string) => Promise<void>;
  onConverted?: () => void;
}

function canModifyTransaction(
  txn: GroupTransactionItem,
  myRole: 'ADMIN' | 'MEMBER',
  currentUserId?: string,
) {
  return myRole === 'ADMIN' || txn.createdByUserId === currentUserId;
}

function memberName(members: GroupMemberItem[], userId: string) {
  return <MemberProfileLink members={members} userId={userId} />;
}

export function GroupTransactionList({
  transactions,
  members,
  myRole,
  currentUserId,
  currencySymbol = '₹',
  onDelete,
  onConverted,
}: GroupTransactionListProps) {
  const [viewingTransaction, setViewingTransaction] = useState<GroupTransactionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (transactionId: string) => {
    setDeletingId(transactionId);
    try {
      await onDelete(transactionId);
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-surface-container-lowest p-8 text-center" glass={false}>
        <p className="text-on-surface-variant font-body-md">No group expenses yet. Use the form below to add one.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {transactions.map((txn) => {
          const canModify = canModifyTransaction(txn, myRole, currentUserId);
          return (
            <Card
              key={txn.id}
              className="bg-surface-container-lowest p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/20 border border-transparent transition-colors"
              glass={false}
              onClick={() => setViewingTransaction(txn)}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <h4 className="font-title-md text-title-md font-bold text-primary">{txn.title}</h4>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    {new Date(txn.transactionDate).toLocaleDateString()} · Paid by{' '}
                    {memberName(members, txn.userId)}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 flex-wrap justify-end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="font-headline-sm font-black text-primary">
                    {formatGroupAmount(Number(txn.amount), txn.currency?.symbol || currencySymbol)}
                  </span>
                  <GroupTransactionActionsMenu
                    transaction={txn}
                    canModify={canModify}
                    onView={setViewingTransaction}
                    onDelete={handleDelete}
                    onConverted={onConverted}
                  />
                </div>
              </div>
              {txn.splits && txn.splits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {txn.splits
                    .filter((split) => split.included && split.computedAmount > 0)
                    .map((split) => (
                      <span
                        key={split.userId}
                        className="px-3 py-1 rounded-full bg-surface-container-low text-label-md font-bold text-on-surface-variant"
                      >
                        {memberName(members, split.userId)}:{' '}
                        {formatGroupAmount(split.computedAmount, txn.currency?.symbol || currencySymbol)}
                      </span>
                    ))}
                </div>
              )}
              {deletingId === txn.id ? (
                <p className="font-label-md text-on-surface-variant">Deleting...</p>
              ) : null}
            </Card>
          );
        })}
      </div>

      <GroupTransactionDetailModal
        transaction={viewingTransaction}
        members={members}
        currencySymbol={currencySymbol}
        open={viewingTransaction !== null}
        onClose={() => setViewingTransaction(null)}
      />
    </>
  );
}

interface SplitParticipantState {
  userId: string;
  included: boolean;
  shareAmount: string;
  sharePercent: string;
}

interface GroupTransactionFormProps {
  groupId: string;
  members: GroupMemberItem[];
  currentUserId?: string;
  currencySymbol?: string;
  onCreated: () => Promise<void>;
}

export function GroupTransactionForm({
  groupId,
  members,
  currentUserId,
  currencySymbol = '₹',
  onCreated,
}: GroupTransactionFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Food');
  const [paymentType, setPaymentType] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<SplitMode>('EQUAL_INCLUDED');
  const [participants, setParticipants] = useState<SplitParticipantState[]>(() =>
    members.map((member) => ({
      userId: member.userId,
      included: true,
      shareAmount: '',
      sharePercent: '',
    })),
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setParticipants((prev) => {
      const prevByUser = new Map(prev.map((row) => [row.userId, row]));
      return members.map((member) => {
        const existing = prevByUser.get(member.userId);
        return (
          existing ?? {
            userId: member.userId,
            included: true,
            shareAmount: '',
            sharePercent: '',
          }
        );
      });
    });
  }, [members]);

  const preview = useMemo(() => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return null;
    try {
      return SplitService.calculate(
        mode,
        parsedAmount,
        participants.map((participant) => ({
          userId: participant.userId,
          included: participant.included,
          shareAmount: participant.shareAmount ? parseFloat(participant.shareAmount) : undefined,
          sharePercent: participant.sharePercent ? parseFloat(participant.sharePercent) : undefined,
        })),
        currentUserId || members[0]?.userId || '',
      );
    } catch {
      return null;
    }
  }, [amount, mode, participants, currentUserId, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (!title.trim()) throw new Error('Title is required');
      if (!parsedAmount || parsedAmount <= 0) throw new Error('Amount must be positive');

      const splitParticipants = participants.map((participant) => ({
        userId: participant.userId,
        included: participant.included,
        ...(mode === 'CUSTOM_AMOUNT' && participant.included
          ? { shareAmount: parseFloat(participant.shareAmount) }
          : {}),
        ...(mode === 'CUSTOM_PERCENT' && participant.included
          ? { sharePercent: parseFloat(participant.sharePercent) }
          : {}),
      }));

      const payload = {
        type: 'DEBIT',
        title: title.trim(),
        amount: parsedAmount,
        transactionDate,
        category,
        paymentType,
        notes: notes.trim() || undefined,
        split: {
          mode,
          participants: splitParticipants,
        },
      };

      await axios.post(`/api/user/groups/${groupId}/transaction`, payload);

      setTitle('');
      setAmount('');
      setNotes('');
      await onCreated();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Failed to create group expense';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
      <div>
        <h3 className="font-title-md text-title-md font-bold text-primary">Add group expense</h3>
        <p className="font-body-md text-on-surface-variant mt-1">
          You are recorded as the payer. Split the total across included members.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-label-md font-bold text-on-surface-variant">Title</span>
            <input
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dinner, rent, groceries..."
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md font-bold text-on-surface-variant">Amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md font-bold text-on-surface-variant">Date</span>
            <input
              type="date"
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md font-bold text-on-surface-variant">Category</span>
            <input
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['EQUAL_INCLUDED', 'CUSTOM_AMOUNT', 'CUSTOM_PERCENT'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`px-3 py-1.5 rounded-full text-label-md font-bold ${
                mode === option ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {option === 'EQUAL_INCLUDED' ? 'Equal' : option === 'CUSTOM_AMOUNT' ? `Custom ${currencySymbol}` : 'Custom %'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {participants.map((participant) => {
            const member = members.find((row) => row.userId === participant.userId);
            const memberRef = member ? memberToUserRef(member) : { userId: participant.userId };
            return (
              <div
                key={participant.userId}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center border border-outline-variant/20 rounded-xl p-3"
              >
                <label className="flex items-center gap-2 font-body-md">
                  <input
                    type="checkbox"
                    checked={participant.included}
                    onChange={(e) =>
                      setParticipants((prev) =>
                        prev.map((row) =>
                          row.userId === participant.userId ? { ...row, included: e.target.checked } : row,
                        ),
                      )
                    }
                  />
                  <UserProfileLink user={memberRef} fallback={participant.userId.slice(0, 8)} />
                </label>
                {mode === 'CUSTOM_AMOUNT' && (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    disabled={!participant.included}
                    className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
                    value={participant.shareAmount}
                    onChange={(e) =>
                      setParticipants((prev) =>
                        prev.map((row) =>
                          row.userId === participant.userId ? { ...row, shareAmount: e.target.value } : row,
                        ),
                      )
                    }
                  />
                )}
                {mode === 'CUSTOM_PERCENT' && (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="%"
                    disabled={!participant.included}
                    className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
                    value={participant.sharePercent}
                    onChange={(e) =>
                      setParticipants((prev) =>
                        prev.map((row) =>
                          row.userId === participant.userId ? { ...row, sharePercent: e.target.value } : row,
                        ),
                      )
                    }
                  />
                )}
              </div>
            );
          })}
        </div>

        {preview && (
          <div className="rounded-xl bg-surface-container-low p-3 flex flex-wrap gap-2">
            {preview
              .filter((row) => row.included && row.computedAmount > 0)
              .map((row) => (
                <span key={row.userId} className="text-label-md font-bold text-on-surface-variant">
                  {memberName(members, row.userId)}: {formatGroupAmount(row.computedAmount, currencySymbol)}
                </span>
              ))}
          </div>
        )}

        {errorMsg && <p className="text-error font-body-md">{errorMsg}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add expense'}
        </Button>
      </form>
    </Card>
  );
}
