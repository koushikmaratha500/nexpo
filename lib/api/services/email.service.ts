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
