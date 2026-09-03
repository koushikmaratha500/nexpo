import { NextRequest } from 'next/server';
import { MetaController } from '@/lib/api/controllers/meta.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await authGuard(req, 'CUSTOMER');
    return await MetaController.getCustomerMetadata(req);
  } catch (error) {
    return handleApiError(error);
  }
}
