import { NextRequest } from 'next/server';
import { PresenceController } from '@/lib/api/controllers/presence.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await PresenceController.customerHeartbeat(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
