import { NextRequest } from 'next/server';
import { ReminderController } from '@/lib/api/controllers/reminder.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await ReminderController.listGroup(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await ReminderController.createGroup(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
