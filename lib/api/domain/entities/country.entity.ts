import { Status } from '@prisma/client';

export interface Country {
  id: string;
  name: string;
  isoCode: string;
  currencyId: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
