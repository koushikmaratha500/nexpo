import { NextRequest } from 'next/server';
import { AuthController } from '@/lib/api/controllers/auth.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, getRequestIp, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    await checkRateLimit(req, `resend_otp_${getRequestIp(req)}`, RATE_LIMIT_PRESETS.resendOtp);
    return await AuthController.resendOtp(req);
  } catch (error) {
    return handleApiError(error);
  }
}
