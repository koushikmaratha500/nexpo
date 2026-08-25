import { NextRequest } from 'next/server';
import { ReminderController } from '@/lib/api/controllers/reminder.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function PATCH(
  req: NextRequest,
  segmentData: { params: Promise<{ id: string; reminderId: string }> },
) {
  try {
    const { id, reminderId } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await ReminderController.updateGroup(req, id, reminderId, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  segmentData: { params: Promise<{ id: string; reminderId: string }> },
) {
  try {
    const { id, reminderId } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await ReminderController.deleteGroup(req, id, reminderId, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
