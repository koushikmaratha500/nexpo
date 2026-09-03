import { NextRequest } from 'next/server';
import { CategoryController } from '@/lib/api/controllers/category.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(req, 'ADMIN');
    const { id } = await segmentData.params;
    return await CategoryController.getById(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(req, 'ADMIN');
    const { id } = await segmentData.params;
    return await CategoryController.update(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(req, 'ADMIN');
    const { id } = await segmentData.params;
    return await CategoryController.delete(req, id);
  } catch (error) {
    return handleApiError(error);
  }
}
