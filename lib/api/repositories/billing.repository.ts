import { prisma } from '@/lib/prisma';
import {
  BillingInterval,
  BillingPlan,
  CheckoutSessionStatus,
  CheckoutSku,
  PaymentProvider,
  PaymentStatus,
  PlanStatus,
  Prisma,
} from '@prisma/client';

export class BillingRepository {
  static async createCheckoutSession(data: Prisma.BillingCheckoutSessionUncheckedCreateInput) {
    return prisma.billingCheckoutSession.create({ data });
  }

  static async findCheckoutSessionById(id: string) {
    return prisma.billingCheckoutSession.findUnique({
      where: { id },
      include: { payment: true },
    });
  }

  static async findCheckoutSessionByProviderId(providerSessionId: string) {
    return prisma.billingCheckoutSession.findFirst({
      where: { providerSessionId },
      include: { payment: true },
    });
  }

  static async updateCheckoutSession(id: string, data: Prisma.BillingCheckoutSessionUncheckedUpdateInput) {
    return prisma.billingCheckoutSession.update({ where: { id }, data });
  }

  static async createPayment(data: Prisma.BillingPaymentUncheckedCreateInput) {
    return prisma.billingPayment.create({ data });
  }

  static async findPaymentByProvider(provider: PaymentProvider, providerPaymentId: string) {
    return prisma.billingPayment.findUnique({
      where: { provider_providerPaymentId: { provider, providerPaymentId } },
      include: { invoice: true, checkoutSession: true },
    });
  }

  static async createInvoice(data: Prisma.BillingInvoiceUncheckedCreateInput) {
    return prisma.billingInvoice.create({ data });
  }

  static async findInvoiceById(id: string) {
    return prisma.billingInvoice.findUnique({ where: { id } });
  }

  static async findInvoiceByNumber(invoiceNumber: string) {
    return prisma.billingInvoice.findUnique({ where: { invoiceNumber } });
  }

  static async listInvoicesByUser(userId: string) {
    return prisma.billingInvoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        planLabel: true,
        totalPaise: true,
        issuedAt: true,
        sku: true,
      },
    });
  }

  static async nextInvoiceNumber(year: number): Promise<string> {
    const seq = await prisma.$transaction(async (tx) => {
      const existing = await tx.billingInvoiceSequence.findUnique({ where: { year } });
      const next = (existing?.lastNumber ?? 0) + 1;
      await tx.billingInvoiceSequence.upsert({
        where: { year },
        create: { year, lastNumber: next },
        update: { lastNumber: next },
      });
      return next;
    });
    return `PS-${year}-${String(seq).padStart(5, '0')}`;
  }

  static async markSessionCompleted(
    sessionId: string,
    payment: {
      provider: PaymentProvider;
      providerPaymentId: string;
      amountPaise: number;
      sku: CheckoutSku;
      providerSubscriptionId?: string;
    },
  ) {
    const existing = await this.findPaymentByProvider(payment.provider, payment.providerPaymentId);
    if (existing) {
      return { payment: existing, created: false };
    }

    return prisma.$transaction(async (tx) => {
      await tx.billingCheckoutSession.update({
        where: { id: sessionId },
        data: {
          status: CheckoutSessionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      const session = await tx.billingCheckoutSession.findUnique({ where: { id: sessionId } });
      if (!session) {
        throw new Error('Checkout session not found');
      }

      const createdPayment = await tx.billingPayment.create({
        data: {
          userId: session.userId,
          checkoutSessionId: sessionId,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          amountPaise: payment.amountPaise || session.totalPaise,
          currency: session.currency,
          status: PaymentStatus.SUCCEEDED,
          sku: payment.sku,
        },
      });

      return { payment: createdPayment, created: true, session };
    });
  }

  static async findUserByStripeSubscriptionId(subscriptionId: string) {
    return prisma.user.findFirst({
      where: { stripeSubscriptionId: subscriptionId, status: { not: 'D' } },
    });
  }

  static async findUserByRazorpaySubscriptionId(subscriptionId: string) {
    return prisma.user.findFirst({
      where: { razorpaySubscriptionId: subscriptionId, status: { not: 'D' } },
    });
  }

  static async recordRenewalPayment(params: {
    userId: string;
    provider: PaymentProvider;
    providerPaymentId: string;
    amountPaise: number;
    sku: CheckoutSku;
    subtotalPaise: number;
    gstPaise: number;
  }) {
    const existing = await this.findPaymentByProvider(params.provider, params.providerPaymentId);
    if (existing) {
      return { payment: existing, created: false };
    }

    return prisma.$transaction(async (tx) => {
      const session = await tx.billingCheckoutSession.create({
        data: {
          userId: params.userId,
          sku: params.sku,
          provider: params.provider,
          status: CheckoutSessionStatus.COMPLETED,
          subtotalPaise: params.subtotalPaise,
          gstPaise: params.gstPaise,
          totalPaise: params.amountPaise,
          completedAt: new Date(),
          metadata: { renewal: true },
        },
      });

      const payment = await tx.billingPayment.create({
        data: {
          userId: params.userId,
          checkoutSessionId: session.id,
          provider: params.provider,
          providerPaymentId: params.providerPaymentId,
          amountPaise: params.amountPaise,
          status: PaymentStatus.SUCCEEDED,
          sku: params.sku,
        },
      });

      return { payment, created: true, session };
    });
  }

  static async findUsersNeedingTrialReminder(withinDays = 2) {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + withinDays);

    return prisma.user.findMany({
      where: {
        plan: BillingPlan.FREEMIUM,
        planStatus: PlanStatus.TRIALING,
        trialReminderSentAt: null,
        trialEndsAt: { gt: now, lte: end },
        status: { not: 'D' },
        email: { not: null },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        trialEndsAt: true,
      },
    });
  }

  static async findStarterSubscriptionsToExpire(now = new Date()) {
    return prisma.user.findMany({
      where: {
        plan: BillingPlan.STARTER,
        planStatus: { in: [PlanStatus.ACTIVE, PlanStatus.PAST_DUE, PlanStatus.CANCELED] },
        currentPeriodEndsAt: { lte: now },
        status: { not: 'D' },
      },
    });
  }

  static async markTrialReminderSent(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { trialReminderSentAt: new Date() },
    });
  }

  static async getAdminOverview(now = new Date()) {
    const [revenueAgg, paymentCount, planGroups, statusGroups, recentPayments, activeStarters] =
      await Promise.all([
        prisma.billingPayment.aggregate({
          where: { status: PaymentStatus.SUCCEEDED },
          _sum: { amountPaise: true },
        }),
        prisma.billingPayment.count({ where: { status: PaymentStatus.SUCCEEDED } }),
        prisma.user.groupBy({
          by: ['plan'],
          where: { status: { not: 'D' } },
          _count: { _all: true },
        }),
        prisma.user.groupBy({
          by: ['planStatus'],
          where: { status: { not: 'D' } },
          _count: { _all: true },
        }),
        prisma.billingPayment.findMany({
          where: { status: PaymentStatus.SUCCEEDED },
          orderBy: { createdAt: 'desc' },
          take: 25,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            invoice: { select: { invoiceNumber: true } },
          },
        }),
        prisma.user.findMany({
          where: {
            status: { not: 'D' },
            plan: BillingPlan.STARTER,
            planStatus: { in: [PlanStatus.ACTIVE, PlanStatus.PAST_DUE, PlanStatus.CANCELED] },
            currentPeriodEndsAt: { gt: now },
          },
          select: { billingInterval: true },
        }),
      ]);

    const planCounts = Object.fromEntries(
      planGroups.map((row) => [row.plan, row._count._all]),
    ) as Record<string, number>;

    const planStatusCounts = Object.fromEntries(
      statusGroups.map((row) => [row.planStatus, row._count._all]),
    ) as Record<string, number>;

    let mrrEstimatePaise = 0;
    for (const starter of activeStarters) {
      mrrEstimatePaise +=
        starter.billingInterval === BillingInterval.YEAR ? Math.round(100000 / 12) : 10000;
    }

    return {
      totalRevenuePaise: revenueAgg._sum.amountPaise ?? 0,
      paymentCount,
      planCounts,
      planStatusCounts,
      activeSubscriptions: activeStarters.length,
      mrrEstimatePaise,
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        amountPaise: payment.amountPaise,
        sku: payment.sku,
        provider: payment.provider,
        createdAt: payment.createdAt.toISOString(),
        user: payment.user,
        invoiceNumber: payment.invoice?.invoiceNumber ?? null,
      })),
    };
  }
}
