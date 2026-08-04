import { Status } from '@prisma/client';

export interface PaymentType {
  id: string;
  name: string;
  code: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
