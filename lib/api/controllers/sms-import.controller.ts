import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import {
  smsManualImportSchema,
  smsSettingsUpdateSchema,
  smsSyncRequestSchema,
} from '../dtos/sms-import.dto';
import { SmsImportService } from '../services/sms-import.service';

export class SmsImportController extends BaseController {
  static async getSettings(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const settings = await SmsImportService.getSettings(userId);
      return { success: true, settings };
    }, { fallbackMessage: 'Failed to load SMS import settings' });
  }

  static async updateSettings(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = smsSettingsUpdateSchema.parse(body);
      const settings = await SmsImportService.updateSettings(userId, validated);
      return { success: true, settings };
    }, { fallbackMessage: 'Failed to update SMS import settings' });
  }

  static async sync(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = smsSyncRequestSchema.parse(body);
      const result = await SmsImportService.syncBatch(userId, validated);
      return result;
    }, { fallbackMessage: 'Failed to sync SMS messages' });
  }

  static async manualImport(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = smsManualImportSchema.parse(body);
      const result = await SmsImportService.manualImport(userId, validated);
      return result;
    }, { fallbackMessage: 'Failed to import SMS message' });
  }

  static async getSyncStatus(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const status = await SmsImportService.getSyncStatus(userId);
      return { success: true, ...status };
    }, { fallbackMessage: 'Failed to load SMS sync status' });
  }
}
