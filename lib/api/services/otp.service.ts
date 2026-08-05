import { EmailService } from './email.service';

interface OtpRecord {
  code: string;
  expiresAt: Date;
  attempts: number;
}

const otpStore = new Map<string, OtpRecord>();
const MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 15 * 60 * 1000;

export class OtpService {
  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async createOtp(email: string, sendEmail = true): Promise<string> {
    const code = this.generateOtp();
    otpStore.set(email, { code, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0 });

    if (sendEmail) {
      await EmailService.sendOtpEmail(email, code);
    }

    return code;
  }

  static verifyOtp(email: string, code: string): boolean {
    const record = otpStore.get(email);
    if (!record) {
      return false;
    }

    if (record.expiresAt < new Date()) {
      otpStore.delete(email);
      return false;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);
      return false;
    }

    if (record.code !== code) {
      record.attempts++;
      return false;
    }

    otpStore.delete(email);
    return true;
  }

  static clearOtp(email: string): void {
    otpStore.delete(email);
  }
}
