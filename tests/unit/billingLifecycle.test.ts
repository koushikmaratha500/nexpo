import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingInterval, BillingPlan, CheckoutSku, PaymentProvider, PlanStatus } from '@prisma/client';
import { BillingService } from '@/lib/api/services/billing.service';
import { BillingRepository } from '@/lib/api/repositories/billing.repository';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { InvoiceService } from '@/lib/api/services/invoice.service';

vi.mock('@/lib/api/repositories/billing.repository', () => ({
  BillingRepository: {
    markSessionCompleted: vi.fn(),
    recordRenewalPayment: vi.fn(),
    findUserByStripeSubscriptionId: vi.fn(),
    findUserByRazorpaySubscriptionId: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: { findById: vi.fn(), update: vi.fn() },
}));

vi.mock('@/lib/api/services/invoice.service', () => ({
  InvoiceService: { issueForPayment: vi.fn() },
}));

vi.mock('@/lib/api/services/email.service', () => ({
  EmailService: {
    sendPlanWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPaymentFailedEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('@/lib/billing/gateway', () => ({
  getGateway: vi.fn(() => ({
    cancelSubscription: vi.fn().mockResolvedValue(undefined),
  })),
  getConfiguredGateways: vi.fn(() => []),
}));

const mockedMarkCompleted = vi.mocked(BillingRepository.markSessionCompleted);
const mockedRecordRenewal = vi.mocked(BillingRepository.recordRenewalPayment);
const mockedFindUser = vi.mocked(UserRepository.findById);
const mockedUpdateUser = vi.mocked(UserRepository.update);
const mockedFindStripeUser = vi.mocked(BillingRepository.findUserByStripeSubscriptionId);
const mockedIssueInvoice = vi.mocked(InvoiceService.issueForPayment);

describe('BillingService lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extends Starter period on renewal webhook', async () => {
    const periodEnd = new Date('2026-10-01T00:00:00.000Z');
    mockedFindStripeUser.mockResolvedValue({
      id: 'user-1',
      billingInterval: BillingInterval.MONTH,
      currentPeriodEndsAt: periodEnd,
      plan: BillingPlan.STARTER,
    } as never);

    mockedFindUser.mockResolvedValue({
      id: 'user-1',
      billingInterval: BillingInterval.MONTH,
      currentPeriodEndsAt: periodEnd,
      plan: BillingPlan.STARTER,
    } as never);

    mockedRecordRenewal.mockResolvedValue({
      created: true,
      payment: { id: 'pay-1', userId: 'user-1' } as never,
      session: {} as never,
    });

    await BillingService.processWebhookEvent({
      type: 'renewal_paid',
      provider: PaymentProvider.STRIPE,
      providerPaymentId: 'pi_renew_1',
      providerSubscriptionId: 'sub_123',
      amountPaise: 11800,
      sku: CheckoutSku.STARTER_MONTHLY,
    });

    expect(mockedRecordRenewal).toHaveBeenCalled();
    expect(mockedUpdateUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        planStatus: PlanStatus.ACTIVE,
        plan: BillingPlan.STARTER,
      }),
    );
    expect(mockedIssueInvoice).toHaveBeenCalledWith('pay-1');
  });

  it('marks subscription canceled at period end', async () => {
    mockedFindStripeUser.mockResolvedValue({ id: 'user-1' } as never);

    await BillingService.processWebhookEvent({
      type: 'subscription_canceled',
      provider: PaymentProvider.STRIPE,
      providerSubscriptionId: 'sub_123',
      immediate: false,
    });

    expect(mockedUpdateUser).toHaveBeenCalledWith('user-1', {
      planStatus: PlanStatus.CANCELED,
    });
  });

  it('marks payment failed as past due', async () => {
    mockedFindStripeUser.mockResolvedValue({ id: 'user-1', plan: BillingPlan.STARTER } as never);
    mockedFindUser.mockResolvedValue({ id: 'user-1', plan: BillingPlan.STARTER } as never);

    await BillingService.processWebhookEvent({
      type: 'payment_failed',
      provider: PaymentProvider.STRIPE,
      providerSubscriptionId: 'sub_123',
    });

    expect(mockedUpdateUser).toHaveBeenCalledWith('user-1', {
      planStatus: PlanStatus.PAST_DUE,
    });
  });
});
