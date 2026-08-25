import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { SettingsService } from '../services/settings.service';
import { updateSystemSettingsSchema } from '../dtos/settings.dto';

export class SettingsController extends BaseController {
  static async getSettings(_req: NextRequest) {
    return this.safeExecuteJson(async () => SettingsService.getSettings(), {
      fallbackMessage: 'Failed to fetch settings',
    });
  }

  static async updateSettings(req: NextRequest, adminId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateSystemSettingsSchema.parse(body);
      return SettingsService.updateSettings(validated, adminId);
    }, { fallbackMessage: 'Failed to update settings' });
  }
}
