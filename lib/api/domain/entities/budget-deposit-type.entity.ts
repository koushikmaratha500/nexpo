import { Status } from '@prisma/client';

export interface BudgetDepositType {
  id: string;
  name: string;
  code: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
