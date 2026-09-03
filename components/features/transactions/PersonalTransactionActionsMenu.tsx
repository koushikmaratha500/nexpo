'use client';

import { useState } from 'react';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu';
import { ShareReceiptMenu } from '@/components/features/share/ShareReceiptMenu';
import { ConvertTransactionModal } from '@/components/features/transactions/ConvertTransactionModal';
import type { Transaction } from '@/store/transactionStore';

interface PersonalTransactionActionsMenuProps {
  transaction: Transaction;
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onConverted?: () => void;
}

export function PersonalTransactionActionsMenu({
  transaction,
  onView,
  onEdit,
  onDelete,
  onConverted,
}: PersonalTransactionActionsMenuProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const items: ActionMenuItem[] = [
    { id: 'view', label: 'View', icon: 'visibility', onClick: () => onView(transaction) },
    { id: 'share', label: 'Share receipt', icon: 'share', onClick: () => setShareOpen(true) },
    { id: 'convert', label: 'Move to group', icon: 'group', onClick: () => setConvertOpen(true) },
    { id: 'edit', label: 'Edit', icon: 'edit', onClick: () => onEdit(transaction) },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      variant: 'danger',
      onClick: () => onDelete(transaction.id),
    },
  ];

  return (
    <>
      <ActionMenu items={items} ariaLabel="Transaction actions" />
      <ShareReceiptMenu
        transactionId={transaction.id}
        open={shareOpen}
        onOpenChange={setShareOpen}
        hideTrigger
      />
      <ConvertTransactionModal
        transactionId={transaction.id}
        mode="personal-to-group"
        onConverted={onConverted}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        hideTrigger
      />
    </>
  );
}
