import { BillingRepository } from '../repositories/billing.repository';
import { UserRepository } from '../repositories/user.repository';
import { EmailService } from './email.service';
import {
  computeGstBreakdown,
  formatPaiseAsInr,
  getBillingAddress,
  getBillingGstin,
  getBillingLegalName,
  getBillingSac,
} from '@/lib/billing/config';
import { buildInvoicePdf } from '@/lib/billing/invoice-pdf';
import { getSkuDefinition } from '@/lib/billing/skus';
import { prisma } from '@/lib/prisma';

export class InvoiceService {
  static async issueForPayment(paymentId: string) {
    const record = await prisma.billingPayment.findUnique({
      where: { id: paymentId },
      include: { invoice: true, checkoutSession: true },
    });
    if (!record) {
      throw new Error('Payment not found');
    }
    if (record.invoice) {
      return record.invoice;
    }

    const user = await UserRepository.findById(record.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const skuDef = getSkuDefinition(record.sku);
    const breakdown = computeGstBreakdown(record.checkoutSession.subtotalPaise);
    const year = new Date().getFullYear();
    const invoiceNumber = await BillingRepository.nextInvoiceNumber(year);
    const customerName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Customer';
    const customerEmail = user.email ?? 'no-email@paysasuchan.local';
    const buyerGstin = user.billingGstin?.trim() || null;

    const pdfBytes = await buildInvoicePdf({
      invoiceNumber,
      issuedAt: new Date(),
      legalName: getBillingLegalName(),
      gstin: getBillingGstin(),
      sac: getBillingSac(),
      billingAddress: getBillingAddress(),
      customerName,
      customerEmail,
      buyerGstin,
      planLabel: skuDef.label,
      subtotalPaise: breakdown.subtotalPaise,
      cgstPaise: breakdown.cgstPaise,
      sgstPaise: breakdown.sgstPaise,
      igstPaise: breakdown.igstPaise,
      totalPaise: record.amountPaise,
    });

    const invoice = await BillingRepository.createInvoice({
      invoiceNumber,
      paymentId: record.id,
      userId: record.userId,
      legalName: getBillingLegalName(),
      gstin: getBillingGstin(),
      sac: getBillingSac(),
      billingAddress: getBillingAddress(),
      customerName,
      customerEmail,
      sku: record.sku,
      planLabel: skuDef.label,
      subtotalPaise: breakdown.subtotalPaise,
      cgstPaise: breakdown.cgstPaise,
      sgstPaise: breakdown.sgstPaise,
      igstPaise: breakdown.igstPaise,
      totalPaise: record.amountPaise,
      pdfBytes: Buffer.from(pdfBytes),
    });

    if (user.email) {
      await EmailService.sendInvoiceEmail(user.email, {
        invoiceNumber,
        planLabel: skuDef.label,
        total: formatPaiseAsInr(record.amountPaise),
        pdfBytes,
      });
    }

    return invoice;
  }

  static async listForUser(userId: string) {
    const rows = await BillingRepository.listInvoicesByUser(userId);
    return rows.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      planLabel: row.planLabel,
      totalPaise: row.totalPaise,
      totalInr: formatPaiseAsInr(row.totalPaise),
      issuedAt: row.issuedAt.toISOString(),
      sku: row.sku,
    }));
  }

  static async listForAdmin(userId: string) {
    return this.listForUser(userId);
  }

  static async getPdfForUser(userId: string, invoiceId: string) {
    const invoice = await BillingRepository.findInvoiceById(invoiceId);
    if (!invoice || invoice.userId !== userId) {
      return null;
    }
    return {
      invoiceNumber: invoice.invoiceNumber,
      pdfBytes: invoice.pdfBytes,
    };
  }
}
