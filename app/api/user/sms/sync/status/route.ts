import { NextRequest } from 'next/server';
import { SmsImportController } from '@/lib/api/controllers/sms-import.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await SmsImportController.getSyncStatus(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
