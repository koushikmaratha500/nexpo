import { NextRequest } from 'next/server';
import { SupportController } from '@/lib/api/controllers/support.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    await authGuard(req, 'ADMIN');
    return await SupportController.getById(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const admin = await authGuard(req, 'ADMIN');
    return await SupportController.update(req, id, admin.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const admin = await authGuard(req, 'ADMIN');
    return await SupportController.delete(req, id, admin.id);
  } catch (error) {
    return handleApiError(error);
  }
}
