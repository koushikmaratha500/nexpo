import { Status, TransactionType } from '@prisma/client';

export interface Category {
  id: string;
  name: string;
  code: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
