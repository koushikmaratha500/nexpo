'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu';
import { ShareReceiptMenu } from '@/components/features/share/ShareReceiptMenu';
import { ConvertTransactionModal } from '@/components/features/transactions/ConvertTransactionModal';
import { formatGroupAmount, type GroupTransactionItem } from './GroupTransactionsPanel';
import { MemberProfileLink } from './memberLinks';
import type { GroupMemberItem } from './GroupMembersPanel';

interface GroupTransactionDetailModalProps {
  transaction: GroupTransactionItem | null;
  members: GroupMemberItem[];
  currencySymbol: string;
  open: boolean;
  onClose: () => void;
}

function DetailField({
  label,
  value,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-label-md font-bold uppercase text-on-surface-variant">{label}</p>
      <div className="mt-1 font-body-md text-on-surface whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export function GroupTransactionDetailModal({
  transaction,
  members,
  currencySymbol,
  open,
  onClose,
}: GroupTransactionDetailModalProps) {
  if (!transaction) return null;

  const symbol = transaction.currency?.symbol || currencySymbol;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={transaction.title}
      subtitle="Group expense details"
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailField label="Amount" value={formatGroupAmount(Number(transaction.amount), symbol)} />
        <DetailField label="Type" value={transaction.type} />
        <DetailField label="Date" value={new Date(transaction.transactionDate).toLocaleDateString()} />
        <DetailField
          label="Paid by"
          value={<MemberProfileLink members={members} userId={transaction.userId} />}
        />
        <DetailField label="Split mode" value={transaction.splitMode || '—'} className="sm:col-span-2" />
        <DetailField
          label="Splits"
          value={
            transaction.splits && transaction.splits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {transaction.splits
                  .filter((split) => split.included && split.computedAmount > 0)
                  .map((split) => (
                    <span
                      key={split.userId}
                      className="px-3 py-1 rounded-full bg-surface-container-low text-label-md font-bold text-on-surface-variant"
                    >
                      <MemberProfileLink members={members} userId={split.userId} />:{' '}
                      {formatGroupAmount(split.computedAmount, symbol)}
                    </span>
                  ))}
              </div>
            ) : (
              '—'
            )
          }
          className="sm:col-span-2"
        />
      </div>
    </Modal>
  );
}

interface GroupTransactionActionsMenuProps {
  transaction: GroupTransactionItem;
  canModify: boolean;
  onView: (transaction: GroupTransactionItem) => void;
  onDelete: (transactionId: string) => void;
  onConverted?: () => void;
}

export function GroupTransactionActionsMenu({
  transaction,
  canModify,
  onView,
  onDelete,
  onConverted,
}: GroupTransactionActionsMenuProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const items: ActionMenuItem[] = [
    { id: 'view', label: 'View', icon: 'visibility', onClick: () => onView(transaction) },
    { id: 'share', label: 'Share receipt', icon: 'share', onClick: () => setShareOpen(true) },
  ];

  if (canModify) {
    items.push(
      { id: 'convert', label: 'Move to personal', icon: 'person', onClick: () => setConvertOpen(true) },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        onClick: () => onDelete(transaction.id),
      },
    );
  }

  return (
    <>
      <ActionMenu items={items} ariaLabel="Group transaction actions" />
      <ShareReceiptMenu
        transactionId={transaction.id}
        open={shareOpen}
        onOpenChange={setShareOpen}
        hideTrigger
      />
      {canModify ? (
        <ConvertTransactionModal
          transactionId={transaction.id}
          mode="group-to-personal"
          onConverted={onConverted}
          open={convertOpen}
          onOpenChange={setConvertOpen}
          hideTrigger
        />
      ) : null}
    </>
  );
}
