'use client';

import { Modal } from '@/components/ui/Modal';
import type { Transaction } from '@/store/transactionStore';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
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

export function TransactionDetailModal({ transaction, open, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const documentUrl = transaction.documentUrl || transaction.receiptUrl;
  const documentName = transaction.documentName || transaction.receiptName;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={transaction.title}
      subtitle="Transaction details"
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailField label="Type" value={transaction.type} />
        <DetailField
          label="Amount"
          value={`${transaction.type === 'DEBIT' ? '−' : '+'}${transaction.currency} ${transaction.amount.toFixed(2)}`}
        />
        <DetailField label="Category" value={transaction.category} />
        <DetailField label="Date" value={transaction.date} />
        <DetailField label="Merchant" value={transaction.merchant || '—'} />
        <DetailField label="Payment type" value={transaction.paymentType || '—'} />
        {transaction.type === 'CREDIT' ? (
          <DetailField label="Deposit type" value={transaction.depositType || '—'} />
        ) : null}
        <DetailField
          label="Recurring"
          value={
            transaction.isRecurring
              ? `Yes · day ${transaction.recurringDay ?? '—'} of month`
              : 'No'
          }
        />
        <DetailField label="Notes" value={transaction.notes || '—'} className="sm:col-span-2" />
        <DetailField
          label="Receipt"
          value={
            documentUrl ? (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                {documentName || 'View attachment'}
              </a>
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
