import type { BillingInterval, BillingPlan, PlanStatus } from '@prisma/client';
import { FREEMIUM_LIMITS } from './catalog';

export type PlanLimitKey = keyof typeof FREEMIUM_LIMITS;

export interface PlanUsage {
  personalTransactions: number;
  ocr: number;
  groups: number;
  activeReminders: number;
  aiMessages: number;
}

export interface PlanEntitlement {
  plan: BillingPlan;
  status: PlanStatus;
  billingInterval: BillingInterval;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  trialDaysLeft: number;
  writesLocked: boolean;
  isPaid: boolean;
  features: {
    csvExport: boolean;
    ai: boolean;
    ocr: boolean;
    groups: boolean;
    reminders: boolean;
    receiptShare: boolean;
  };
  limits: typeof FREEMIUM_LIMITS | null;
  usage: PlanUsage;
}

export const PLAN_ERROR_CODES = {
  WRITE_LOCKED: 'PLAN_WRITE_LOCKED',
  LIMIT: 'PLAN_LIMIT',
  FEATURE: 'PLAN_FEATURE',
} as const;
