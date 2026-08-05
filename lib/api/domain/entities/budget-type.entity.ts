import { Status } from '@prisma/client';

export interface BudgetType {
  id: string;
  name: string;
  code: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
