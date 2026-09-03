import { NextRequest } from 'next/server';
import { AdminReminderController } from '@/lib/api/controllers/admin-reminder.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await AdminReminderController.list(req);
  } catch (error) {
    return handleApiError(error);
  }
}
