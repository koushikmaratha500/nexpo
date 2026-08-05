import { TransactionType } from '@prisma/client';

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'CUSTOMER';
    countryId?: string | null;
    currencyId?: string | null;
  };
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN';
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
  };
}

export interface VerifyResponse {
  success: boolean;
  message: string;
}

export interface ProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER';
  countryId?: string | null;
  currencyId?: string | null;
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: { code: string; name: string; symbol: string };
  category: { id: string; name: string; code: string } | null;
  paymentType: { id: string; name: string; code: string } | null;
  transactionDate: string;
  status: string;
  notes?: string | null;
  documentUrl?: string | null;
  documentFileName?: string | null;
  documentSize?: number | null;
  merchant?: string | null;
}

export interface DashboardMetricsResponse {
  totalSpend: number;
  totalBudget: number;
  totalTransactions: number;
  recentTransactions: TransactionResponse[];
}

export interface ReportDataPoint {
  date: string;
  amount: number;
  category: string;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}
