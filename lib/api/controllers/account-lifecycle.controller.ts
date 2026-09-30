import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import {
  accountLifecycleActionSchema,
  accountLifecycleOtpSendSchema,
} from '../dtos/account-lifecycle.dto';
import { AccountLifecycleOtpService } from '../services/account-lifecycle-otp.service';
import { AccountLifecycleService } from '../services/account-lifecycle.service';

export class AccountLifecycleController extends BaseController {
  static async getStatus(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const lifecycle = await AccountLifecycleService.getStatus(userId);
      return { success: true, lifecycle };
    }, { fallbackMessage: 'Failed to load account lifecycle status' });
  }

  static async sendOtp(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = accountLifecycleOtpSendSchema.parse(body);
      const result = await AccountLifecycleOtpService.sendOtp(userId, validated);
      return result;
    }, { fallbackMessage: 'Failed to send verification code' });
  }

  static async resetAccount(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = accountLifecycleActionSchema.parse(body);
      const meta = this.requestMeta(req);
      const result = await AccountLifecycleService.requestReset(userId, validated, meta);
      return { success: true, ...result };
    }, { fallbackMessage: 'Failed to reset account' });
  }

  static async deleteAccount(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = accountLifecycleActionSchema.parse(body);
      const meta = this.requestMeta(req);
      const result = await AccountLifecycleService.requestDelete(userId, validated, meta);
      return { success: true, ...result };
    }, { fallbackMessage: 'Failed to delete account' });
  }

  static async restoreAccount(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const meta = this.requestMeta(req);
      const result = await AccountLifecycleService.restore(userId, meta);
      return { success: true, ...result };
    }, { fallbackMessage: 'Failed to restore account' });
  }
}
