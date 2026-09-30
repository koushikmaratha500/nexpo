import crypto from 'crypto';
import { HttpError } from '../middleware/errorHandler';
import { EmailService } from './email.service';
import {
  getDevOtpCode,
  isResendEnabled,
  logOtpDevMode,
  assertOtpAllowedInProduction,
} from '../utils/emailConfig';
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

  static resolveOtpCode(): string {
    return isResendEnabled() ? this.generateOtp() : getDevOtpCode();
  }

  static scopedKey(scope: string): string {
    return `${OTP_KEY_PREFIX}${scope}`;
  }

  static accountActionKey(params: {
    userId: string;
    action: 'RESET' | 'DELETE';
    channel: 'email' | 'sms';
    destination: string;
  }): string {
    const destination = params.destination.trim().toLowerCase();
    return this.scopedKey(`account:${params.userId}:${params.action}:${params.channel}:${destination}`);
  }

  private static async persistCode(storageKey: string, code: string): Promise<void> {
    const record: OtpRecord = {
      code,
      attempts: 0,
      expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    };
    await kvSetJson(storageKey, record, OTP_TTL_SECONDS);
  }

  private static async verifyStoredCode(storageKey: string, code: string): Promise<boolean> {
    const record = await kvGetJson<OtpRecord>(storageKey);
    if (!record) {
      return false;
    }

    if (record.expiresAt < Date.now()) {
      await kvDelete(storageKey);
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
        await kvDelete(storageKey);
        throw new HttpError(429, 'Too many OTP attempts. Request a new verification code.');
      }

      await kvSetJson(
        storageKey,
        { ...record, attempts: nextAttempts },
        Math.min(remainingSeconds, OTP_TTL_SECONDS),
      );
      return false;
    }

    await kvDelete(storageKey);
    return true;
  }

  static async createScopedOtp(storageKey: string, resolveCode?: () => string): Promise<string> {
    assertOtpStoreAvailable();
    const code = resolveCode ? resolveCode() : this.resolveOtpCode();
    await this.persistCode(storageKey, code);
    return code;
  }

  static async verifyScopedOtp(storageKey: string, code: string): Promise<boolean> {
    assertOtpStoreAvailable();
    return this.verifyStoredCode(storageKey, code);
  }

  static async createOtp(email: string, sendEmail = true): Promise<string> {
    assertOtpAllowedInProduction();

    const key = otpKey(email);
    const code = await this.createScopedOtp(key);

    if (sendEmail) {
      if (isResendEnabled()) {
        const result = await EmailService.sendOtpEmail(email, code);
        if (!result.success) {
          await kvDelete(key);
          throw new Error('Failed to send verification email. Please try again later.');
        }
      } else {
        logOtpDevMode(email);
      }
    }

    return code;
  }

  static async verifyOtp(email: string, code: string): Promise<boolean> {
    assertOtpAllowedInProduction();
    return this.verifyScopedOtp(otpKey(email), code);
  }

  static async clearOtp(email: string): Promise<void> {
    await kvDelete(otpKey(email));
  }

  static async clearScopedOtp(storageKey: string): Promise<void> {
    await kvDelete(storageKey);
  }
}
