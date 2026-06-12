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
