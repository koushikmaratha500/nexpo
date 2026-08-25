import { NextRequest } from 'next/server';
import { SettingsController } from '@/lib/api/controllers/settings.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await SettingsController.getSettings(req);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await authGuard(req, 'ADMIN');
    return await SettingsController.updateSettings(req, admin.id);
  } catch (error) {
    return handleApiError(error);
  }
}
