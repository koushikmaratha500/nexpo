import { NextRequest } from 'next/server';
import { AdminController } from '@/lib/api/controllers/admin.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    await authGuard(req, 'ADMIN');
    return await AdminController.resetUserPassword(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}
