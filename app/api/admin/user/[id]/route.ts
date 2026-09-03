import { NextRequest } from 'next/server';
import { AdminController } from '@/lib/api/controllers/admin.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    await authGuard(req, 'ADMIN');
    return await AdminController.getUser(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const admin = await authGuard(req, 'ADMIN');
    await checkRateLimit(req, `admin_user_write:${admin.id}`, RATE_LIMIT_PRESETS.adminUserWrite);
    return await AdminController.updateUser(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const admin = await authGuard(req, 'ADMIN');
    await checkRateLimit(req, `admin_user_write:${admin.id}`, RATE_LIMIT_PRESETS.adminUserWrite);
    return await AdminController.deleteUser(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}
