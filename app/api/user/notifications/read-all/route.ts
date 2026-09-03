import { NextRequest } from 'next/server';
import { NotificationController } from '@/lib/api/controllers/notification.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await NotificationController.markAllRead(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
