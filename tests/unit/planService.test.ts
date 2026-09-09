import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingInterval, BillingPlan, PlanStatus } from '@prisma/client';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { PlanService } from '@/lib/api/services/plan.service';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';
import { GroupRepository } from '@/lib/api/repositories/group.repository';
import { ReminderRepository } from '@/lib/api/repositories/reminder.repository';
import { AiUsageRepository } from '@/lib/api/repositories/aiUsage.repository';
import { PLAN_PRICES_INR } from '@/lib/billing/catalog';

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: { findById: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/api/repositories/transaction.repository', () => ({
  TransactionRepository: { countPersonalByUser: vi.fn() },
}));
vi.mock('@/lib/api/repositories/group.repository', () => ({
  GroupRepository: { countActiveMemberships: vi.fn(), countMembers: vi.fn() },
}));
vi.mock('@/lib/api/repositories/reminder.repository', () => ({
  ReminderRepository: { countActivePersonal: vi.fn() },
}));
vi.mock('@/lib/api/repositories/aiUsage.repository', () => ({
  AiUsageRepository: { countSuccessfulByFeatures: vi.fn() },
}));
vi.mock('@/lib/api/services/billing.service', () => ({
  BillingService: {
    getCheckoutStatus: vi.fn().mockResolvedValue({
      checkoutAvailable: false,
      activeProvider: 'razorpay',
      configuredProviders: [],
      razorpayKeyId: null,
    }),
  },
}));

const mockedFindById = vi.mocked(UserRepository.findById);
const mockedUpdate = vi.mocked(UserRepository.update);
const mockedTxnCount = vi.mocked(TransactionRepository.countPersonalByUser);
const mockedGroupCount = vi.mocked(GroupRepository.countActiveMemberships);
const mockedReminderCount = vi.mocked(ReminderRepository.countActivePersonal);
const mockedAiCount = vi.mocked(AiUsageRepository.countSuccessfulByFeatures);

function usageZeros() {
  mockedTxnCount.mockResolvedValue(0);
  mockedGroupCount.mockResolvedValue(0);
  mockedReminderCount.mockResolvedValue(0);
  mockedAiCount.mockResolvedValue(0);
}

describe('PlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usageZeros();
  });

  it('exposes locked INR catalog prices', async () => {
    const catalog = await PlanService.catalog();
    expect(catalog.pricesInr).toEqual(PLAN_PRICES_INR);
    expect(PLAN_PRICES_INR.starterMonthly).toBe(100);
    expect(PLAN_PRICES_INR.starterYearly).toBe(1000);
    expect(PLAN_PRICES_INR.proLifetime).toBe(10000);
  });

  it('keeps writes open during an active Freemium trial', async () => {
    mockedFindById.mockResolvedValue({
      id: 'u1',
      plan: BillingPlan.FREEMIUM,
      planStatus: PlanStatus.TRIALING,
      billingInterval: BillingInterval.NONE,
      trialEndsAt: new Date('2026-09-16T00:00:00.000Z'),
      currentPeriodEndsAt: null,
      createdAt: new Date('2026-09-09T00:00:00.000Z'),
    } as never);

    const entitlement = await PlanService.getEntitlement('u1', new Date('2026-09-10T12:00:00.000Z'));
    expect(entitlement.writesLocked).toBe(false);
    expect(entitlement.features.ai).toBe(true);
    expect(entitlement.trialDaysLeft).toBeGreaterThan(0);
  });

  it('locks writes after the 7-day trial', async () => {
    mockedFindById.mockResolvedValue({
      id: 'u1',
      plan: BillingPlan.FREEMIUM,
      planStatus: PlanStatus.TRIALING,
      billingInterval: BillingInterval.NONE,
      trialEndsAt: new Date('2026-09-08T00:00:00.000Z'),
      currentPeriodEndsAt: null,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    } as never);

    const entitlement = await PlanService.getEntitlement('u1', new Date('2026-09-10T12:00:00.000Z'));
    expect(entitlement.writesLocked).toBe(true);
    expect(mockedUpdate).toHaveBeenCalledWith('u1', { planStatus: PlanStatus.EXPIRED });

    await expect(PlanService.assertWritesAllowed('u1')).rejects.toBeInstanceOf(HttpError);
  });

  it('locks writes when Starter period has ended', async () => {
    mockedFindById.mockResolvedValue({
      id: 'u1',
      plan: BillingPlan.STARTER,
      planStatus: PlanStatus.ACTIVE,
      billingInterval: BillingInterval.MONTH,
      trialEndsAt: new Date('2026-08-01T00:00:00.000Z'),
      currentPeriodEndsAt: new Date('2026-09-01T00:00:00.000Z'),
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    } as never);

    const entitlement = await PlanService.getEntitlement('u1', new Date('2026-09-10T12:00:00.000Z'));
    expect(entitlement.writesLocked).toBe(true);
    expect(mockedUpdate).toHaveBeenCalledWith('u1', {
      planStatus: PlanStatus.EXPIRED,
      razorpaySubscriptionId: null,
      stripeSubscriptionId: null,
    });
  });

  it('does not lock Starter or Pro', async () => {
    mockedFindById.mockResolvedValue({
      id: 'u1',
      plan: BillingPlan.STARTER,
      planStatus: PlanStatus.ACTIVE,
      billingInterval: BillingInterval.MONTH,
      trialEndsAt: new Date('2026-09-01T00:00:00.000Z'),
      currentPeriodEndsAt: new Date('2026-10-09T00:00:00.000Z'),
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    } as never);

    const entitlement = await PlanService.getEntitlement('u1', new Date('2026-09-10T12:00:00.000Z'));
    expect(entitlement.writesLocked).toBe(false);
    expect(entitlement.features.ai).toBe(true);
    expect(entitlement.features.csvExport).toBe(true);
    expect(entitlement.limits).toBeNull();
  });

  it('grandfathers users missing trialEndsAt with a fresh 7-day trial', async () => {
    mockedFindById.mockResolvedValue({
      id: 'u1',
      plan: BillingPlan.FREEMIUM,
      planStatus: PlanStatus.TRIALING,
      billingInterval: BillingInterval.NONE,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    } as never);

    const now = new Date('2026-09-09T00:00:00.000Z');
    const entitlement = await PlanService.getEntitlement('u1', now);
    expect(mockedUpdate).toHaveBeenCalled();
    expect(entitlement.writesLocked).toBe(false);
  });
});
