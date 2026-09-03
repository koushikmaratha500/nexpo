import { NextRequest } from 'next/server';
import { CategoryController } from '@/lib/api/controllers/category.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await CategoryController.list(req);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authGuard(req, 'ADMIN');
    return await CategoryController.create(req);
  } catch (error) {
    return handleApiError(error);
  }
}
