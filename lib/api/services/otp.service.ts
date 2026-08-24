import crypto from 'crypto';
import { HttpError } from '../middleware/errorHandler';
import { EmailService } from './email.service';
import {
  isProductionEnv,
  isRedisConfigured,
  kvDelete,
  kvGetJson,
  kvSetJson,
} from '../utils/redisClient';

interface OtpRecord {
  code: string;
  attempts: number;
  expiresAt: number;
}

const OTP_KEY_PREFIX = 'nexpo_otp:';
const MAX_ATTEMPTS = 5;
const OTP_TTL_SECONDS = 15 * 60;

function otpKey(email: string): string {
  return `${OTP_KEY_PREFIX}${email.toLowerCase()}`;
}

function assertOtpStoreAvailable(): void {
  if (isProductionEnv() && !isRedisConfigured()) {
    throw new Error('Redis is required for OTP storage in production');
  }
}

export class OtpService {
  static generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async createOtp(email: string, sendEmail = true): Promise<string> {
    assertOtpStoreAvailable();

    const code = this.generateOtp();
    const record: OtpRecord = {
      code,
      attempts: 0,
      expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    };

    await kvSetJson(otpKey(email), record, OTP_TTL_SECONDS);

    if (sendEmail) {
      await EmailService.sendOtpEmail(email, code);
    }

    return code;
  }

  static async verifyOtp(email: string, code: string): Promise<boolean> {
    assertOtpStoreAvailable();

    const key = otpKey(email);
    const record = await kvGetJson<OtpRecord>(key);
    if (!record) {
      return false;
    }

    if (record.expiresAt < Date.now()) {
      await kvDelete(key);
      return false;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new HttpError(429, 'Too many OTP attempts. Request a new verification code.');
    }

    if (record.code !== code) {
      const nextAttempts = record.attempts + 1;
      const remainingMs = Math.max(record.expiresAt - Date.now(), 1000);
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      if (nextAttempts >= MAX_ATTEMPTS) {
        await kvDelete(key);
        throw new HttpError(429, 'Too many OTP attempts. Request a new verification code.');
      }

      await kvSetJson(
        key,
        { ...record, attempts: nextAttempts },
        Math.min(remainingSeconds, OTP_TTL_SECONDS),
      );
      return false;
    }

    await kvDelete(key);
    return true;
  }

  static async clearOtp(email: string): Promise<void> {
    await kvDelete(otpKey(email));
  }
}
