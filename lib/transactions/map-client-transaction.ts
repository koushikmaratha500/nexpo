import { formatDate } from '@/lib/date';
import { parseTransactionAmount } from '@/lib/transactions/ledger';

export type ClientTransactionType = 'DEBIT' | 'CREDIT';

export interface ClientTransaction {
  id: string;
  type: ClientTransactionType;
  title: string;
  merchant?: string;
  description?: string;
  category: string;
  date: string;
  status: 'VERIFIED' | 'PENDING' | 'DECLINED';
  amount: number;
  submittedBy: string;
  paymentType: string;
  currency: string;
  notes?: string;
  documentName?: string;
  documentSize?: string;
  documentDate?: string;
  documentUrl?: string;
  receiptName?: string;
  receiptSize?: string;
  receiptUrl?: string;
  receiptDate?: string;
  depositType?: 'Cash' | 'Account';
  isRecurring?: boolean;
  recurringDay?: number | null;
  categoryType?: ClientTransactionType;
}

/** Map a Prisma transaction row (with standard includes) to the web/mobile client shape. */
export function mapDbTransactionToClient(dbTxn: Record<string, unknown>): ClientTransaction {
  const isCredit = dbTxn.type === 'CREDIT';
  const category = dbTxn.category as { type?: string; name?: string; code?: string } | null | undefined;
  const user = dbTxn.user as { firstName?: string; lastName?: string } | null | undefined;
  const paymentType = dbTxn.paymentType as { name?: string } | null | undefined;
  const currency = dbTxn.currency as { code?: string } | null | undefined;

  return {
    id: String(dbTxn.id),
    type: String(dbTxn.type).toUpperCase() as ClientTransactionType,
    categoryType: category?.type
      ? (String(category.type).toUpperCase() as ClientTransactionType)
      : undefined,
    title: String(dbTxn.title || dbTxn.merchant || 'Transaction Title'),
    merchant: dbTxn.merchant ? String(dbTxn.merchant) : undefined,
    description: dbTxn.description ? String(dbTxn.description) : dbTxn.merchant ? String(dbTxn.merchant) : undefined,
    category: isCredit
      ? (category?.name || category?.code || 'Other')
      : (category?.name || category?.code || 'Food'),
    date: formatDate((dbTxn.transactionDate || dbTxn.date) as string | Date),
    status: (isCredit ? 'VERIFIED' : 'PENDING') as 'VERIFIED' | 'PENDING' | 'DECLINED',
    amount: parseTransactionAmount(dbTxn.amount),
    submittedBy: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Alex Sterling',
    paymentType: paymentType?.name || (isCredit ? 'Account' : 'Credit Card'),
    currency: currency?.code || 'INR',
    notes: dbTxn.notes ? String(dbTxn.notes) : undefined,
    documentName: dbTxn.documentFileName ? String(dbTxn.documentFileName) : dbTxn.receiptFileName ? String(dbTxn.receiptFileName) : undefined,
    documentSize:
      typeof dbTxn.documentSize === 'number'
        ? `${(dbTxn.documentSize / 1024).toFixed(0)} KB`
        : undefined,
    documentDate: dbTxn.documentFileName
      ? formatDate((dbTxn.transactionDate || dbTxn.date) as string | Date)
      : undefined,
    documentUrl: dbTxn.documentUrl ? String(dbTxn.documentUrl) : dbTxn.receiptUrl ? String(dbTxn.receiptUrl) : undefined,
    receiptName: dbTxn.documentFileName ? String(dbTxn.documentFileName) : dbTxn.receiptFileName ? String(dbTxn.receiptFileName) : undefined,
    receiptSize:
      typeof dbTxn.documentSize === 'number'
        ? `${(dbTxn.documentSize / 1024).toFixed(0)} KB`
        : undefined,
    receiptUrl: dbTxn.documentUrl ? String(dbTxn.documentUrl) : dbTxn.receiptUrl ? String(dbTxn.receiptUrl) : undefined,
    receiptDate: dbTxn.documentFileName
      ? formatDate((dbTxn.transactionDate || dbTxn.date) as string | Date)
      : undefined,
    depositType: isCredit ? ((paymentType?.name || 'Account') as 'Cash' | 'Account') : undefined,
    isRecurring: Boolean(dbTxn.isRecurring),
    recurringDay: dbTxn.recurringDay != null ? Number(dbTxn.recurringDay) : null,
  };
}
