import { NextRequest } from 'next/server';
import { GroupController } from '@/lib/api/controllers/group.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function DELETE(
  req: NextRequest,
  segmentData: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { id, memberId } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    return await GroupController.removeMember(req, id, user.id, memberId);
  } catch (error) {
    return handleApiError(error);
  }
}
