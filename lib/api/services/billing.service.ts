import {
  BillingInterval,
  BillingPlan,
  CheckoutSessionStatus,
  CheckoutSku,
  PaymentProvider,
  PlanStatus,
} from '@prisma/client';
import crypto from 'crypto';
import { HttpError } from '../middleware/errorHandler';
import { BillingRepository } from '../repositories/billing.repository';
import { UserRepository } from '../repositories/user.repository';
import { InvoiceService } from './invoice.service';
import { SettingsService } from './settings.service';
import { computeGstBreakdown, getAppBaseUrl, isProviderConfigured } from '@/lib/billing/config';
import { getGateway, getConfiguredGateways } from '@/lib/billing/gateway';
import { validateCheckoutSku } from '@/lib/billing/checkout-rules';
import { getSkuDefinition, parseCheckoutSku } from '@/lib/billing/skus';
import type { BillingWebhookEvent } from '@/lib/billing/webhook-events';
import { EmailService } from './email.service';

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function periodDays(interval: BillingInterval): number {
  return interval === BillingInterval.YEAR ? 365 : 30;
}

function skuForInterval(interval: BillingInterval): CheckoutSku {
  return interval === BillingInterval.YEAR
    ? CheckoutSku.STARTER_YEARLY
    : CheckoutSku.STARTER_MONTHLY;
}

export class BillingService {
  static async getCheckoutStatus() {
    const settings = await SettingsService.getSettings();
    const activeProvider = settings.billing.checkoutProvider;
    const provider =
      activeProvider === 'stripe' ? PaymentProvider.STRIPE : PaymentProvider.RAZORPAY;
    const providers = getConfiguredGateways();

    return {
      checkoutAvailable: providers.length > 0 && isProviderConfigured(provider),
      activeProvider: settings.billing.checkoutProvider,
      configuredProviders: providers.map((p) => p.toLowerCase()),
      razorpayKeyId: process.env.RAZORPAY_KEY_ID?.trim() ?? null,
    };
  }

  static async getSubscriptionSummary(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const subscriptionId =
      user.paymentProvider === PaymentProvider.STRIPE
        ? user.stripeSubscriptionId
        : user.razorpaySubscriptionId;

    return {
      plan: user.plan,
      planStatus: user.planStatus,
      billingInterval: user.billingInterval,
      currentPeriodEndsAt: user.currentPeriodEndsAt?.toISOString() ?? null,
      paymentProvider: user.paymentProvider?.toLowerCase() ?? null,
      subscriptionId,
      billingGstin: user.billingGstin ?? null,
      canCancel:
        user.plan === BillingPlan.STARTER &&
        Boolean(subscriptionId) &&
        user.planStatus !== PlanStatus.EXPIRED &&
        user.planStatus !== PlanStatus.CANCELED,
    };
  }

  static async updateBillingProfile(userId: string, billingGstin?: string | null) {
    const normalized = billingGstin?.trim().toUpperCase() || null;
    if (normalized && !/^[0-9]{2}[A-Z0-9]{13}$/.test(normalized)) {
      throw new HttpError(400, 'Enter a valid 15-character GSTIN');
    }
    await UserRepository.update(userId, { billingGstin: normalized });
    return { billingGstin: normalized };
  }

  static async cancelSubscription(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    if (user.plan !== BillingPlan.STARTER) {
      throw new HttpError(400, 'Only Starter subscriptions can be canceled');
    }

    const provider = user.paymentProvider;
    const subscriptionId =
      provider === PaymentProvider.STRIPE
        ? user.stripeSubscriptionId
        : user.razorpaySubscriptionId;

    if (!provider || !subscriptionId) {
      throw new HttpError(400, 'No active subscription found to cancel');
    }

    const gateway = getGateway(provider);
    await gateway.cancelSubscription(subscriptionId, true);

    await UserRepository.update(userId, { planStatus: PlanStatus.CANCELED });

    return {
      canceled: true,
      effectiveUntil: user.currentPeriodEndsAt?.toISOString() ?? null,
    };
  }

  static async createCheckout(userId: string, skuInput: string) {
    const sku = parseCheckoutSku(skuInput);
    if (!sku) {
      throw new HttpError(400, 'Invalid checkout SKU');
    }

    const settings = await SettingsService.getSettings();
    const providerSetting = settings.billing.checkoutProvider;
    const provider =
      providerSetting === 'stripe' ? PaymentProvider.STRIPE : PaymentProvider.RAZORPAY;

    if (!isProviderConfigured(provider)) {
      throw new HttpError(503, `${providerSetting} checkout is not configured`);
    }

    const user = await UserRepository.findById(userId);
    if (!user?.email) {
      throw new HttpError(400, 'Add a verified email before checkout');
    }

    validateCheckoutSku(user, sku);

    const skuDef = getSkuDefinition(sku);
    const breakdown = computeGstBreakdown(skuDef.subtotalPaise);
    const gateway = getGateway(provider);
    const baseUrl = getAppBaseUrl();

    const session = await BillingRepository.createCheckoutSession({
      userId,
      sku,
      provider,
      status: CheckoutSessionStatus.CREATED,
      subtotalPaise: breakdown.subtotalPaise,
      gstPaise: breakdown.gstPaise,
      totalPaise: breakdown.totalPaise,
      currency: 'INR',
    });

    const customerName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

    const checkout = await gateway.createCheckout({
      sessionId: session.id,
      sku,
      subtotalPaise: breakdown.subtotalPaise,
      gstPaise: breakdown.gstPaise,
      totalPaise: breakdown.totalPaise,
      currency: 'INR',
      customer: {
        userId,
        email: user.email,
        name: customerName,
        razorpayCustomerId: user.razorpayCustomerId,
        stripeCustomerId: user.stripeCustomerId,
      },
      successUrl: `${baseUrl}/customer/settings?checkout=success`,
      cancelUrl: `${baseUrl}/customer/settings?checkout=cancel`,
    });

    await BillingRepository.updateCheckoutSession(session.id, {
      providerSessionId: checkout.providerSessionId,
      providerSubscriptionId: checkout.providerSubscriptionId,
      expiresAt: checkout.expiresAt,
    });

    if (checkout.stripeCustomerId && !user.stripeCustomerId) {
      await UserRepository.update(userId, { stripeCustomerId: checkout.stripeCustomerId });
    }

    return {
      sessionId: session.id,
      provider: provider.toLowerCase(),
      sku,
      subtotalPaise: breakdown.subtotalPaise,
      gstPaise: breakdown.gstPaise,
      totalPaise: breakdown.totalPaise,
      client: checkout.clientPayload,
    };
  }

  static async verifyRazorpayPayment(
    userId: string,
    params: {
      checkoutSessionId: string;
      razorpayPaymentId: string;
      razorpayOrderId?: string;
      razorpaySubscriptionId?: string;
      razorpaySignature: string;
    },
  ) {
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!secret) {
      throw new HttpError(503, 'Razorpay is not configured');
    }

    const session = await BillingRepository.findCheckoutSessionById(params.checkoutSessionId);
    if (!session || session.userId !== userId) {
      throw new HttpError(404, 'Checkout session not found');
    }
    if (session.status === CheckoutSessionStatus.COMPLETED) {
      return { alreadyCompleted: true };
    }

    const payload = params.razorpaySubscriptionId
      ? `${params.razorpayPaymentId}|${params.razorpaySubscriptionId}`
      : `${params.razorpayOrderId}|${params.razorpayPaymentId}`;

    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (expected !== params.razorpaySignature) {
      throw new HttpError(400, 'Invalid payment signature');
    }

    await this.fulfillCheckout({
      checkoutSessionId: session.id,
      provider: PaymentProvider.RAZORPAY,
      providerPaymentId: params.razorpayPaymentId,
      providerSubscriptionId: params.razorpaySubscriptionId,
      amountPaise: session.totalPaise,
      sku: session.sku,
    });

    return { success: true };
  }

  static async handleWebhook(provider: PaymentProvider, rawBody: string, signature: string) {
    const gateway = getGateway(provider);
    if (!gateway.verifyWebhookSignature(rawBody, signature)) {
      throw new HttpError(400, 'Invalid webhook signature');
    }

    const event = await gateway.parseWebhookEvent(rawBody, signature);
    if (!event) {
      return { handled: false };
    }

    await this.processWebhookEvent(event);
    return { handled: true, type: event.type };
  }

  static async processWebhookEvent(event: BillingWebhookEvent) {
    switch (event.type) {
      case 'checkout_completed':
        await this.fulfillCheckout({
          checkoutSessionId: event.checkoutSessionId,
          provider: event.provider,
          providerPaymentId: event.providerPaymentId,
          providerSubscriptionId: event.providerSubscriptionId,
          amountPaise: event.amountPaise,
          sku: event.sku,
        });
        break;
      case 'renewal_paid':
        await this.processRenewal(event);
        break;
      case 'subscription_canceled':
        await this.processSubscriptionCanceled(event);
        break;
      case 'payment_failed':
        await this.processPaymentFailed(event);
        break;
      default:
        break;
    }
  }

  private static async resolveUserId(
    provider: PaymentProvider,
    userId?: string,
    subscriptionId?: string,
  ) {
    if (userId) return userId;
    if (!subscriptionId) return null;
    const user =
      provider === PaymentProvider.STRIPE
        ? await BillingRepository.findUserByStripeSubscriptionId(subscriptionId)
        : await BillingRepository.findUserByRazorpaySubscriptionId(subscriptionId);
    return user?.id ?? null;
  }

  private static async fulfillCheckout(input: {
    checkoutSessionId: string;
    provider: PaymentProvider;
    providerPaymentId: string;
    providerSubscriptionId?: string;
    amountPaise: number;
    sku: CheckoutSku;
  }) {
    const result = await BillingRepository.markSessionCompleted(input.checkoutSessionId, {
      provider: input.provider,
      providerPaymentId: input.providerPaymentId,
      amountPaise: input.amountPaise,
      sku: input.sku,
      providerSubscriptionId: input.providerSubscriptionId,
    });

    if (!result.created) {
      return result.payment;
    }

    const skuDef = getSkuDefinition(input.sku);
    const userId = result.payment.userId;
    const existingUser = await UserRepository.findById(userId);

    if (skuDef.plan === BillingPlan.PRO) {
      await this.releaseStarterSubscription(userId);
    }

    const userPatch: {
      paymentProvider: PaymentProvider;
      plan: typeof skuDef.plan;
      planStatus: PlanStatus;
      billingInterval: BillingInterval;
      currentPeriodEndsAt?: Date | null;
      razorpaySubscriptionId?: string;
      stripeSubscriptionId?: string;
    } = {
      paymentProvider: input.provider,
      plan: skuDef.plan,
      planStatus: PlanStatus.ACTIVE,
      billingInterval: skuDef.billingInterval,
    };

    if (input.provider === PaymentProvider.RAZORPAY && input.providerSubscriptionId) {
      userPatch.razorpaySubscriptionId = input.providerSubscriptionId;
    }
    if (input.provider === PaymentProvider.STRIPE && input.providerSubscriptionId) {
      userPatch.stripeSubscriptionId = input.providerSubscriptionId;
    }

    if (skuDef.plan === BillingPlan.STARTER) {
      userPatch.currentPeriodEndsAt = addDays(new Date(), periodDays(skuDef.billingInterval));
    } else if (skuDef.plan === BillingPlan.PRO) {
      userPatch.currentPeriodEndsAt = null;
    }

    await UserRepository.update(userId, userPatch);
    await InvoiceService.issueForPayment(result.payment.id);

    if (existingUser?.email) {
      await EmailService.sendPlanWelcomeEmail(existingUser.email, {
        firstName: existingUser.firstName,
        planLabel: skuDef.label,
        isLifetime: skuDef.plan === BillingPlan.PRO,
      });
    }

    return result.payment;
  }

  private static async releaseStarterSubscription(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user?.paymentProvider) return;

    const subscriptionId =
      user.paymentProvider === PaymentProvider.STRIPE
        ? user.stripeSubscriptionId
        : user.razorpaySubscriptionId;

    if (!subscriptionId) return;

    try {
      await getGateway(user.paymentProvider).cancelSubscription(subscriptionId, false);
    } catch (error) {
      console.error('Failed to cancel Starter subscription during upgrade:', error);
    }

    await UserRepository.update(userId, {
      razorpaySubscriptionId: null,
      stripeSubscriptionId: null,
    });
  }

  private static async processRenewal(event: Extract<BillingWebhookEvent, { type: 'renewal_paid' }>) {
    const userId = await this.resolveUserId(
      event.provider,
      event.userId,
      event.providerSubscriptionId,
    );
    if (!userId) return;

    const user = await UserRepository.findById(userId);
    if (!user) return;

    const sku = event.sku ?? skuForInterval(user.billingInterval);
    const skuDef = getSkuDefinition(sku);
    const breakdown = computeGstBreakdown(skuDef.subtotalPaise);

    const result = await BillingRepository.recordRenewalPayment({
      userId,
      provider: event.provider,
      providerPaymentId: event.providerPaymentId,
      amountPaise: event.amountPaise || breakdown.totalPaise,
      sku,
      subtotalPaise: breakdown.subtotalPaise,
      gstPaise: breakdown.gstPaise,
    });

    if (!result.created) return;

    const base = user.currentPeriodEndsAt && user.currentPeriodEndsAt > new Date()
      ? user.currentPeriodEndsAt
      : new Date();

    await UserRepository.update(userId, {
      plan: BillingPlan.STARTER,
      planStatus: PlanStatus.ACTIVE,
      billingInterval: skuDef.billingInterval,
      currentPeriodEndsAt: addDays(base, periodDays(skuDef.billingInterval)),
      paymentProvider: event.provider,
    });

    await InvoiceService.issueForPayment(result.payment.id);
  }

  private static async processSubscriptionCanceled(
    event: Extract<BillingWebhookEvent, { type: 'subscription_canceled' }>,
  ) {
    const userId = await this.resolveUserId(
      event.provider,
      event.userId,
      event.providerSubscriptionId,
    );
    if (!userId) return;

    if (event.immediate) {
      await UserRepository.update(userId, {
        planStatus: PlanStatus.EXPIRED,
        razorpaySubscriptionId: null,
        stripeSubscriptionId: null,
      });
      return;
    }

    await UserRepository.update(userId, { planStatus: PlanStatus.CANCELED });
  }

  private static async processPaymentFailed(
    event: Extract<BillingWebhookEvent, { type: 'payment_failed' }>,
  ) {
    const userId = await this.resolveUserId(
      event.provider,
      event.userId,
      event.providerSubscriptionId,
    );
    if (!userId) return;

    const user = await UserRepository.findById(userId);
    if (!user || user.plan !== BillingPlan.STARTER) return;

    await UserRepository.update(userId, { planStatus: PlanStatus.PAST_DUE });

    if (user.email) {
      await EmailService.sendPaymentFailedEmail(user.email, {
        firstName: user.firstName,
        currentPeriodEndsAt: user.currentPeriodEndsAt?.toISOString() ?? null,
      });
    }
  }
}
