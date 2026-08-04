import { Status, AuthProvider, TransactionType, AuditAction } from '@prisma/client';

export { Status, AuthProvider, TransactionType, AuditAction };

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string | null;
  profileImageUrl: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  currencyId: string | null;
  categoryId: string | null;
  paymentTypeId: string | null;
  budgetDepositTypeId: string | null;
  budgetTypeId: string | null;
  user?: User;
  category?: Category;
  currency?: Currency;
  paymentType?: PaymentType;
  budgetDepositType?: BudgetDepositType;
  budgetType?: BudgetType;
  title: string;
  description: string | null;
  amount: number;
  transactionDate: Date;
  notes: string | null;
  documentUrl: string | null;
  documentFileName: string | null;
  documentMimeType: string | null;
  documentSize: number | null;
  merchant: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentType {
  id: string;
  name: string;
  code: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetType {
  id: string;
  name: string;
  code: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetDepositType {
  id: string;
  name: string;
  code: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  jwt: string;
  userId: string | null;
  adminId: string | null;
  user?: User;
  admin?: Admin;
  loginTime: Date;
  expiryTime: Date;
  logoutTime: Date | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  adminNotes: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetToken {
  id: string;
  token: string;
  email: string;
  adminId: string | null;
  userId: string | null;
  user?: User;
  admin?: Admin;
  expiresAt: Date;
  usedAt: Date | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAudit {
  id: string;
  userId: string;
  user?: User;
  action: AuditAction;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionAudit {
  id: string;
  transactionId: string;
  transaction?: Transaction;
  action: AuditAction;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
