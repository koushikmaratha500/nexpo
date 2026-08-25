import { NextRequest } from 'next/server';
import { ReminderController } from '@/lib/api/controllers/reminder.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await ReminderController.upcoming(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
