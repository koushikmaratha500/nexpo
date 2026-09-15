import { NextRequest } from 'next/server';
import { PlanController } from '@/lib/api/controllers/plan.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await PlanController.getEntitlement(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
