import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { PresenceService } from '../services/presence.service';
import { z } from 'zod';

const adminPresenceQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((val) =>
      val
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
});

export class PresenceController extends BaseController {
  static async customerHeartbeat(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => PresenceService.heartbeat(userId), {
      fallbackMessage: 'Failed to update presence',
    });
  }

  static async adminOnlineStatus(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const { ids } = adminPresenceQuerySchema.parse({
        ids: searchParams.get('ids') || '',
      });
      const online = await PresenceService.getOnlineStatusByUserIds(ids);
      return { enabled: PresenceService.featureConfig().enabled, online };
    }, { fallbackMessage: 'Failed to load presence status' });
  }
}
