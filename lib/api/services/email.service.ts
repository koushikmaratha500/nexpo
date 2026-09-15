import { Resend } from 'resend';
import { BRAND_NAME } from '@/lib/brand/constants';
import {
  assertResendConfigured,
  assertResendFromEmailConfigured,
  getResendFromEmail,
  isResendEnabled,
} from '../utils/emailConfig';
import {
  buildPasswordResetEmailHtml,
  buildVerificationEmailHtml,
} from '../utils/emailTemplates';

function getResendClient(): Resend | null {
  if (!isResendEnabled()) {
    return null;
  }
  assertResendConfigured();
  assertResendFromEmailConfigured();
  return new Resend(process.env.RESEND_API_KEY!);
}

function formatSendError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Unknown email delivery error';
}

export class EmailService {
  static async sendOtpEmail(to: string, otp: string) {
    if (!isResendEnabled()) {
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `Verify your ${BRAND_NAME} account`,
        html: buildVerificationEmailHtml(otp),
      });

      if (result.error) {
        console.error('Failed to send verification email:', result.error);
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error };
    }
  }

  static async sendPasswordResetEmail(to: string, resetLink: string, isAdmin = false) {
    const subject = isAdmin
      ? `Reset your ${BRAND_NAME} admin password`
      : `Reset your ${BRAND_NAME} password`;

    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Password Reset To: ${to}, Link: ${resetLink}`);
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject,
        html: buildPasswordResetEmailHtml(resetLink, isAdmin),
      });

      if (result.error) {
        console.error('Failed to send password reset email:', result.error);
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error };
    }
  }

  static async sendReminderEmail(
    to: string,
    params: { title: string; amount?: number | null; dueDate: Date; notes?: string | null },
  ) {
    const amountLine =
      params.amount != null
        ? `<p style="color:#374151;font-size:14px;">Amount: <strong>₹${params.amount.toFixed(2)}</strong></p>`
        : '';
    const notesLine = params.notes
      ? `<p style="color:#6b7280;font-size:13px;">${params.notes}</p>`
      : '';

    if (!isResendEnabled()) {
      console.log(
        `[Email Simulation] Reminder To: ${to}, Title: ${params.title}, Due: ${params.dueDate.toISOString()}`,
      );
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `Reminder due: ${params.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827; margin-bottom: 16px;">Payment reminder</h2>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;"><strong>${params.title}</strong> is due on ${params.dueDate.toLocaleDateString()}.</p>
            ${amountLine}
            ${notesLine}
          </div>
        `,
      });

      if (result.error) {
        console.error('Failed to send reminder email:', result.error);
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return { success: false, error };
    }
  }

  static async sendTrialEndingEmail(
    to: string,
    params: { firstName: string; daysLeft: number; trialDays: number },
  ) {
    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Trial ending To: ${to}, Days left: ${params.daysLeft}`);
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `${params.daysLeft} day${params.daysLeft === 1 ? '' : 's'} left on your ${BRAND_NAME} trial`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111827;">Hi ${params.firstName},</h2>
            <p>Your ${params.trialDays}-day Freemium trial ends in <strong>${params.daysLeft} day${params.daysLeft === 1 ? '' : 's'}</strong>.</p>
            <p>After that, your data stays safe but adding or editing will pause until you choose Starter or Pro.</p>
            <p>Starter is ₹100/month or ₹1,000/year. Pro is ₹10,000 lifetime.</p>
          </div>
        `,
      });

      if (result.error) {
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async sendInvoiceEmail(
    to: string,
    params: { invoiceNumber: string; planLabel: string; total: string; pdfBytes: Uint8Array },
  ) {
    if (!isResendEnabled()) {
      console.log(
        `[Email Simulation] Invoice To: ${to}, No: ${params.invoiceNumber}, Total: ${params.total}`,
      );
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `${BRAND_NAME} invoice ${params.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111827;">Payment receipt</h2>
            <p>Thank you for subscribing to <strong>${params.planLabel}</strong>.</p>
            <p>Invoice <strong>${params.invoiceNumber}</strong> — ${params.total} (incl. GST).</p>
            <p>Your GST invoice PDF is attached.</p>
          </div>
        `,
        attachments: [
          {
            filename: `${params.invoiceNumber}.pdf`,
            content: Buffer.from(params.pdfBytes),
          },
        ],
      });

      if (result.error) {
        console.error('Failed to send invoice email:', result.error);
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return { success: false, error };
    }
  }

  static async sendPlanWelcomeEmail(
    to: string,
    params: { firstName: string; planLabel: string; isLifetime: boolean },
  ) {
    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Plan welcome To: ${to}, Plan: ${params.planLabel}`);
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    const renewalNote = params.isLifetime
      ? 'You have lifetime Pro access — no renewals required.'
      : 'Your Starter subscription is active. Manage billing anytime in Settings.';

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `Welcome to ${params.planLabel} on ${BRAND_NAME}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111827;">Hi ${params.firstName},</h2>
            <p>Your <strong>${params.planLabel}</strong> plan is now active.</p>
            <p>${renewalNote}</p>
            <p>Your GST invoice is on its way in a separate email.</p>
          </div>
        `,
      });

      if (result.error) {
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async sendPaymentFailedEmail(
    to: string,
    params: { firstName: string; currentPeriodEndsAt: string | null },
  ) {
    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Payment failed To: ${to}`);
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    const periodNote = params.currentPeriodEndsAt
      ? `Update billing before ${new Date(params.currentPeriodEndsAt).toLocaleDateString('en-IN')} to keep editing.`
      : 'Update billing in Settings to restore full access.';

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `${BRAND_NAME} — Starter payment failed`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111827;">Hi ${params.firstName},</h2>
            <p>We could not process your latest Starter payment.</p>
            <p>${periodNote}</p>
            <p>You can still view your data, but adding or editing may be limited until payment succeeds.</p>
          </div>
        `,
      });

      if (result.error) {
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async sendSubscriptionExpiredEmail(
    to: string,
    params: { firstName: string },
  ) {
    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Subscription expired To: ${to}`);
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `Your ${BRAND_NAME} Starter subscription has ended`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111827;">Hi ${params.firstName},</h2>
            <p>Your Starter subscription period has ended.</p>
            <p>Your data is safe and you can still view everything. Renew Starter or upgrade to Pro lifetime to keep adding and editing.</p>
          </div>
        `,
      });

      if (result.error) {
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      return { success: false, error };
    }
  }

  static async sendSupportConfirmation(to: string, ticketId: string, name: string) {
    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Support Confirmation To: ${to}, Ticket ID: ${ticketId}`);
      return { success: true, simulated: true as const };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      const result = await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: `${BRAND_NAME} support ticket received`,
        html: `<p>Hi ${name},</p><p>We have received your support ticket (ID: ${ticketId}). An administrator will review it shortly.</p>`,
      });

      if (result.error) {
        console.error('Failed to send support confirmation email:', result.error);
        return { success: false, error: new Error(formatSendError(result.error)) };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      console.error('Failed to send support confirmation email:', error);
      return { success: false, error };
    }
  }
}
