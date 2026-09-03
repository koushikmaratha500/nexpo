import { NextRequest } from 'next/server';
import { ReminderDispatchController } from '@/lib/api/controllers/reminder-dispatch.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { assertReminderDispatchAuthorized } from '@/lib/api/utils/reminderDispatchAuth';

export async function POST(req: NextRequest) {
  try {
    assertReminderDispatchAuthorized(req);
    return await ReminderDispatchController.dispatch(req);
  } catch (error) {
    return handleApiError(error);
  }
}
