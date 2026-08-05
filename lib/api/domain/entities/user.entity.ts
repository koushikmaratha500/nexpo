import { Status, AuthProvider } from '@prisma/client';
import { Country, Currency } from './country.entity';

export interface User {
  id: string;
  email: string | null;
  passwordHash: string | null;
  mobile: string | null;
  firstName: string;
  lastName: string | null;
  profileImageUrl: string | null;
  emailVerified: boolean;
  mobileVerified: boolean;
  provider: AuthProvider;
  countryId: string | null;
  currencyId: string | null;
  country?: Country;
  currency?: Currency;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserParams {
  email?: string;
  passwordHash?: string;
  mobile?: string;
  firstName: string;
  lastName?: string | null;
  profileImageUrl?: string | null;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  provider?: AuthProvider;
  countryId?: string | null;
  currencyId?: string | null;
  status?: Status;
}

export interface UpdateUserParams {
  email?: string;
  passwordHash?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string | null;
  profileImageUrl?: string | null;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  provider?: AuthProvider;
  countryId?: string | null;
  currencyId?: string | null;
  status?: Status;
}
