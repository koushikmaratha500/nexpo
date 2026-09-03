import { Resend } from 'resend';
import {
  assertResendConfigured,
  getResendFromEmail,
  isResendEnabled,
} from '../utils/emailConfig';

function getResendClient(): Resend | null {
  if (!isResendEnabled()) {
    return null;
  }
  assertResendConfigured();
  return new Resend(process.env.RESEND_API_KEY!);
}

export class EmailService {
  static async sendOtpEmail(to: string, otp: string) {
    if (!isResendEnabled()) {
      return { success: true, simulated: true };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject: 'Verify your Nexpo Ledger account',
        html: `<p>Your verification code is: <strong>${otp}</strong>. It will expire in 15 minutes.</p>`,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send Resend email:', error);
      return { success: false, error };
    }
  }

  static async sendPasswordResetEmail(to: string, resetLink: string, isAdmin = false) {
    const subject = isAdmin
      ? 'Reset your Admin password - Nexpo Ledger'
      : 'Reset your Nexpo Ledger password';

    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Password Reset To: ${to}, Link: ${resetLink}`);
      return { success: true, simulated: true };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      await resend.emails.send({
        from: getResendFromEmail(),
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827; margin-bottom: 16px;">Password Reset Request</h2>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="${resetLink}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Reset Password</a>
            <p style="color: #6b7280; font-size: 12px; line-height: 1.6;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      return { success: true };
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
      return { success: true, simulated: true };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      await resend.emails.send({
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
      return { success: true };
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return { success: false, error };
    }
  }

  static async sendSupportConfirmation(to: string, ticketId: string, name: string) {
    if (!isResendEnabled()) {
      console.log(`[Email Simulation] Support Confirmation To: ${to}, Ticket ID: ${ticketId}`);
      return { success: true, simulated: true };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error('Resend client unavailable') };
    }

    try {
      await resend.emails.send({
        from: 'Nexpo Support <support@nexpo.com>',
        to,
        subject: 'Support Ticket Received',
        html: `<p>Hi ${name},</p><p>We have received your support ticket (ID: ${ticketId}). An administrator will review it shortly.</p>`,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send support confirmation email:', error);
      return { success: false, error };
    }
  }
}
