import { NextResponse } from 'next/server';
import { SettingsService } from '@/lib/api/services/settings.service';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET() {
  try {
    const pricingEnabled = await SettingsService.isPricingEnabled();
    return NextResponse.json({ pricingEnabled });
  } catch (error) {
    return handleApiError(error);
  }
}
