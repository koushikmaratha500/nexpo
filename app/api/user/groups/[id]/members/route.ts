import { NextRequest } from 'next/server';
import { GroupController } from '@/lib/api/controllers/group.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, getRequestIp, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    await checkRateLimit(req, `group_invite_${getRequestIp(req)}`, RATE_LIMIT_PRESETS.groupInvite);
    const user = await authGuard(req, 'CUSTOMER');
    return await GroupController.inviteMember(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
