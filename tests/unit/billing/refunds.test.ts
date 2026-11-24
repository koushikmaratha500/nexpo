import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingInterval, BillingPlan, CheckoutSku, PaymentProvider, PaymentStatus, PlanStatus } from '@prisma/client';
import { parseRazorpayWebhookEvent } from '@/lib/billing/gateway/razorpay.gateway';
import { BillingService } from '@/lib/api/services/billing.service';
import { BillingRepository } from '@/lib/api/repositories/billing.repository';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { EmailService } from '@/lib/api/services/email.service';

vi.mock('@/lib/api/repositories/billing.repository', () => ({
  BillingRepository: {
    findPaymentByProvider: vi.fn(),
    recordRefund: vi.fn(),
    findLatestActivePaymentForUser: vi.fn(),
  },
}));
vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: { findById: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/api/services/invoice.service', () => ({ InvoiceService: { issueForPayment: vi.fn() } }));
vi.mock('@/lib/api/services/email.service', () => ({
  EmailService: { sendRefundEmail: vi.fn().mockResolvedValue({ success: true }) },
}));
const cancelSubscription = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/billing/gateway', () => ({
  getGateway: vi.fn(() => ({ cancelSubscription })),
  getConfiguredGateways: vi.fn(() => []),
}));

const findPayment = vi.mocked(BillingRepository.findPaymentByProvider);
const recordRefund = vi.mocked(BillingRepository.recordRefund);
const findLatest = vi.mocked(BillingRepository.findLatestActivePaymentForUser);
const findUser = vi.mocked(UserRepository.findById);
const updateUser = vi.mocked(UserRepository.update);

const paidAt = new Date('2026-11-24T03:00:00.000Z');
function payment(sku: CheckoutSku, overrides: Record<string, unknown> = {}) {
  return {
    id: 'bp-1',
    userId: 'user-1',
    provider: PaymentProvider.RAZORPAY,
    providerPaymentId: 'pay_1',
    amountPaise: sku === CheckoutSku.PRO_LIFETIME ? 1180000 : 11800,
    refundedPaise: 0,
    sku,
    createdAt: paidAt,
    invoice: { invoiceNumber: 'PS-2026-00001' },
    ...overrides,
  } as never;
}

function refundEvent(amountRefunded: number) {
  return {
    type: 'payment_refunded' as const,
    provider: PaymentProvider.RAZORPAY,
    providerPaymentId: 'pay_1',
    refundedTotalPaise: amountRefunded,
  };
}

describe('Razorpay refund webhook parsing', () => {
  it('maps refund.processed using the payment cumulative refunded amount', () => {
    const raw = JSON.stringify({
      event: 'refund.processed',
      payload: {
        refund: { entity: { id: 'rfnd_1', payment_id: 'pay_1', amount: 5000 } },
        payment: { entity: { id: 'pay_1', amount: 11800, amount_refunded: 8000 } },
      },
    });
    expect(parseRazorpayWebhookEvent(raw)).toEqual({
      type: 'payment_refunded',
      provider: PaymentProvider.RAZORPAY,
      providerPaymentId: 'pay_1',
      refundedTotalPaise: 8000,
      paymentAmountPaise: 11800,
    });
  });
});

describe('BillingService refunds', () => {
  beforeEach(() => vi.clearAllMocks());

  it('full refund of Pro lifetime ends the plan and emails the customer', async () => {
    findPayment.mockResolvedValue(payment(CheckoutSku.PRO_LIFETIME));
    findUser.mockResolvedValue({ id: 'user-1', plan: BillingPlan.PRO, email: 'a@b.c', firstName: 'A' } as never);
    findLatest.mockResolvedValue(null);

    await BillingService.processWebhookEvent(refundEvent(1180000));

    expect(recordRefund).toHaveBeenCalledWith('bp-1', expect.objectContaining({ refundedPaise: 1180000, status: PaymentStatus.REFUNDED }));
    expect(updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      plan: BillingPlan.FREEMIUM,
      planStatus: PlanStatus.EXPIRED,
      billingInterval: BillingInterval.NONE,
    }));
    expect(EmailService.sendRefundEmail).toHaveBeenCalledWith('a@b.c', expect.objectContaining({ fullRefund: true }));
  });

  it('full refund of the active Starter payment cancels the subscription and expires access', async () => {
    findPayment.mockResolvedValue(payment(CheckoutSku.STARTER_MONTHLY));
    findUser.mockResolvedValue({
      id: 'user-1', plan: BillingPlan.STARTER, paymentProvider: PaymentProvider.RAZORPAY, razorpaySubscriptionId: 'sub_1', email: null,
    } as never);
    findLatest.mockResolvedValue(null);

    await BillingService.processWebhookEvent(refundEvent(11800));

    expect(cancelSubscription).toHaveBeenCalledWith('sub_1', false);
    expect(updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({ planStatus: PlanStatus.EXPIRED, razorpaySubscriptionId: null }));
  });

  it('partial refund keeps the plan', async () => {
    findPayment.mockResolvedValue(payment(CheckoutSku.PRO_LIFETIME));
    findUser.mockResolvedValue({ id: 'user-1', plan: BillingPlan.PRO, email: null } as never);

    await BillingService.processWebhookEvent(refundEvent(50000));

    expect(recordRefund).toHaveBeenCalledWith('bp-1', expect.objectContaining({ status: PaymentStatus.PARTIALLY_REFUNDED }));
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('refunding an old Starter payment does not touch a newer Pro purchase', async () => {
    findPayment.mockResolvedValue(payment(CheckoutSku.STARTER_MONTHLY));
    findUser.mockResolvedValue({ id: 'user-1', plan: BillingPlan.PRO, email: null } as never);
    findLatest.mockResolvedValue({ createdAt: new Date('2026-11-25T00:00:00.000Z') } as never);

    await BillingService.processWebhookEvent(refundEvent(11800));

    expect(updateUser).not.toHaveBeenCalled();
    expect(cancelSubscription).not.toHaveBeenCalled();
  });

  it('ignores a redelivered refund that is already recorded', async () => {
    findPayment.mockResolvedValue(payment(CheckoutSku.PRO_LIFETIME, { refundedPaise: 1180000 }));

    await BillingService.processWebhookEvent(refundEvent(1180000));

    expect(recordRefund).not.toHaveBeenCalled();
    expect(EmailService.sendRefundEmail).not.toHaveBeenCalled();
  });
});
