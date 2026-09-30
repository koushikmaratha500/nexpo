import { NextRequest } from 'next/server';
import { AccountLifecycleController } from '@/lib/api/controllers/account-lifecycle.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, getRequestIp, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `account_otp_${user.id}`, RATE_LIMIT_PRESETS.login);
    return await AccountLifecycleController.sendOtp(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
