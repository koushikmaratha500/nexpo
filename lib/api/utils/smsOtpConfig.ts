import { isProductionEnv } from './redisClient';
export function isTwilioSmsEnabled(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_SMS_FROM?.trim(),
  );
}

export function assertSmsOtpAllowedInProduction(): void {
  if (!isProductionEnv()) {
    return;
  }
  if (!isTwilioSmsEnabled() && process.env.ALLOW_DEV_OTP_IN_PRODUCTION !== 'true') {
    throw new Error(
      'SMS OTP requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM in production',
    );
  }
}

export function logSmsOtpDevMode(mobile: string, code: string): void {
  if (isProductionEnv()) {
    console.log(`[SMS OTP Dev Mode] OTP SMS skipped for ${mobile}`);
    return;
  }
  console.log(
    `[SMS OTP Dev Mode] OTP for ${mobile} (use code ${code} in dev, or configure Twilio to send real SMS)`,
  );
}
