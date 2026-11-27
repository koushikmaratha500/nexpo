import { NextRequest } from 'next/server';
import { NotificationController } from '@/lib/api/controllers/notification.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

/** Unregisters this device on sign-out. */
export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await NotificationController.removeMobileToken(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
