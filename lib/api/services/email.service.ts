import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export class EmailService {
  static async sendOtpEmail(to: string, otp: string) {
    if (!resend) {
      console.log(`[Email Simulation] To: ${to}, OTP: ${otp}`);
      return { success: true, simulated: true };
    }

    try {
      await resend.emails.send({
        from: 'Nexpo Ledger <noreply@nexpo.com>',
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

    if (!resend) {
      console.log(`[Email Simulation] Password Reset To: ${to}, Link: ${resetLink}`);
      return { success: true, simulated: true };
    }

    try {
      await resend.emails.send({
        from: 'Nexpo Ledger <noreply@nexpo.com>',
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

  static async sendSupportConfirmation(to: string, ticketId: string, name: string) {
    if (!resend) {
      console.log(`[Email Simulation] Support Confirmation To: ${to}, Ticket ID: ${ticketId}`);
      return { success: true, simulated: true };
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
