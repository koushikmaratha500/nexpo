import { createHash } from 'crypto';

export function computeSmsMessageHash(params: {
  userId: string;
  sender: string;
  body: string;
  receivedAt: string | Date;
}): string {
  const received =
    params.receivedAt instanceof Date
      ? params.receivedAt.toISOString()
      : new Date(params.receivedAt).toISOString();
  const payload = `${params.userId}|${params.sender.trim()}|${params.body.trim()}|${received}`;
  return createHash('sha256').update(payload).digest('hex');
}

export function computeTransactionImportFingerprint(params: {
  userId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  transactionDate: Date;
  title: string;
}): string {
  const day = params.transactionDate.toISOString().slice(0, 10);
  const amount = params.amount.toFixed(2);
  const title = params.title.trim().toLowerCase();
  const payload = `${params.userId}|${params.type}|${amount}|${day}|${title}`;
  return createHash('sha256').update(payload).digest('hex');
}
