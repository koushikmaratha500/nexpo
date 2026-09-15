import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { BillingAdminService } from '../services/billing-admin.service';
import { BillingService } from '../services/billing.service';
import { InvoiceService } from '../services/invoice.service';
import {
  createCheckoutSchema,
  updateBillingProfileSchema,
  verifyRazorpaySchema,
} from '../dtos/billing.dto';
import { PaymentProvider } from '@prisma/client';

export class BillingController extends BaseController {
  static async createCheckout(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const { sku } = createCheckoutSchema.parse(body);
      return BillingService.createCheckout(userId, sku);
    }, { fallbackMessage: 'Failed to start checkout' });
  }

  static async verifyRazorpay(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = verifyRazorpaySchema.parse(body);
      return BillingService.verifyRazorpayPayment(userId, validated);
    }, { fallbackMessage: 'Failed to verify payment' });
  }

  static async getSubscription(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => BillingService.getSubscriptionSummary(userId), {
      fallbackMessage: 'Failed to load subscription',
    });
  }

  static async updateBillingProfile(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const { billingGstin } = updateBillingProfileSchema.parse(body);
      return BillingService.updateBillingProfile(userId, billingGstin);
    }, { fallbackMessage: 'Failed to update billing profile' });
  }

  static async cancelSubscription(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => BillingService.cancelSubscription(userId), {
      fallbackMessage: 'Failed to cancel subscription',
    });
  }

  static async listInvoices(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => InvoiceService.listForUser(userId), {
      fallbackMessage: 'Failed to load invoices',
    });
  }

  static async downloadInvoice(_req: NextRequest, userId: string, invoiceId: string) {
    return this.safeExecuteJson(async () => {
      const pdf = await InvoiceService.getPdfForUser(userId, invoiceId);
      if (!pdf?.pdfBytes) {
        throw new Error('Invoice not found');
      }
      return {
        invoiceNumber: pdf.invoiceNumber,
        contentType: 'application/pdf',
        base64: Buffer.from(pdf.pdfBytes).toString('base64'),
      };
    }, { fallbackMessage: 'Failed to download invoice' });
  }

  static async listInvoicesForAdmin(_req: NextRequest, targetUserId: string) {
    return this.safeExecuteJson(async () => InvoiceService.listForAdmin(targetUserId), {
      fallbackMessage: 'Failed to load invoices',
    });
  }

  static async getAdminOverview(_req: NextRequest) {
    return this.safeExecuteJson(async () => BillingAdminService.getOverview(), {
      fallbackMessage: 'Failed to load billing overview',
    });
  }

  static async handleWebhook(req: NextRequest, provider: PaymentProvider) {
    const rawBody = await req.text();
    const signature =
      provider === PaymentProvider.RAZORPAY
        ? req.headers.get('x-razorpay-signature') ?? ''
        : req.headers.get('stripe-signature') ?? '';

    return this.safeExecuteJson(async () => BillingService.handleWebhook(provider, rawBody, signature), {
      fallbackMessage: 'Webhook processing failed',
    });
  }
}
