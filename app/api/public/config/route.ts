import { NextResponse } from 'next/server';
import { SettingsService } from '@/lib/api/services/settings.service';
import { PresenceService } from '@/lib/api/services/presence.service';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET() {
  try {
    const pricingEnabled = await SettingsService.isPricingEnabled();
    const presence = PresenceService.featureConfig();
    return NextResponse.json({
      pricingEnabled,
      presenceEnabled: presence.enabled,
      presenceHeartbeatIntervalSeconds: presence.heartbeatIntervalSeconds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
