import { NextRequest } from 'next/server';
import { GroupController } from '@/lib/api/controllers/group.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await GroupController.list(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await GroupController.create(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
