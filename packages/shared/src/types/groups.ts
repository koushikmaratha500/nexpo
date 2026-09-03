import type { SplitMode } from '../utils/split';

export type { SplitMode };

export type GroupMemberRole = 'ADMIN' | 'MEMBER';

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  myRole: GroupMemberRole;
  createdAt: string;
}

export interface GroupListResponse {
  items: GroupSummary[];
  total: number;
}

export interface GroupMemberItem {
  memberId: string;
  userId: string;
  username?: string | null;
  firstName: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  role: GroupMemberRole;
  joinedAt: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  description?: string | null;
  myRole: GroupMemberRole;
  members: GroupMemberItem[];
}

export interface GroupBalanceMember {
  userId: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  netOwed: number;
  netPaid: number;
  balance: number;
}

export interface GroupBalancesResponse {
  members: GroupBalanceMember[];
  currencyCode: string;
  currencySymbol: string;
}

export interface GroupTransactionSplit {
  userId: string;
  included: boolean;
  shareAmount?: number | null;
  sharePercent?: number | null;
  computedAmount: number;
  user?: {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string | null;
  };
}

export interface GroupTransactionItem {
  id: string;
  title: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  transactionDate: string;
  splitMode?: SplitMode | null;
  createdByUserId?: string | null;
  userId: string;
  createdBy?: {
    id: string;
    username?: string | null;
    firstName: string;
  } | null;
  currency?: { code: string; symbol: string } | null;
  splits?: GroupTransactionSplit[];
}
