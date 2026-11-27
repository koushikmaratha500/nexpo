import { NextRequest } from 'next/server';
import { NotificationController } from '@/lib/api/controllers/notification.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

/** Registers the mobile app's FCM token for the signed-in user (upsert). */
export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await NotificationController.registerMobileToken(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
