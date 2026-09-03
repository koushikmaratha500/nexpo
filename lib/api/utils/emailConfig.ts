import { isProductionEnv } from './redisClient';

export function isResendEnabled(): boolean {
  if (process.env.ENABLE_RESEND === 'false') {
    return false;
  }
  if (process.env.ENABLE_RESEND === 'true') {
    return true;
  }
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getDevOtpCode(): string {
  return process.env.DEV_OTP_CODE?.trim() || '123456';
}

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (from) {
    return from.includes('<') ? from : `PaysaSuchan <${from}>`;
  }
  return 'PaysaSuchan <onboarding@resend.dev>';
}

export function assertResendConfigured(): void {
  if (isResendEnabled() && !process.env.RESEND_API_KEY?.trim()) {
    throw new Error('Email delivery requires RESEND_API_KEY to be set');
  }
}

export function assertResendFromEmailConfigured(): void {
  if (!isResendEnabled()) return;
  if (!process.env.RESEND_FROM_EMAIL?.trim() && isProductionEnv()) {
    throw new Error('Production email delivery requires RESEND_FROM_EMAIL (verified sender in Resend)');
  }
}

export function assertProductionOtpConfig(): void {
  if (!isProductionEnv()) return;

  if (!isResendEnabled() && process.env.ALLOW_DEV_OTP_IN_PRODUCTION !== 'true') {
    throw new Error(
      'Production requires RESEND_API_KEY (or ENABLE_RESEND=true) or explicit ALLOW_DEV_OTP_IN_PRODUCTION=true',
    );
  }
}

export function assertOtpAllowedInProduction(): void {
  if (!isProductionEnv()) return;
  assertProductionOtpConfig();
  if (!isResendEnabled()) {
    throw new Error('OTP verification is disabled in production unless email delivery is enabled');
  }
}

export function logOtpDevMode(email: string): void {
  if (isProductionEnv()) {
    console.log(`[OTP Dev Mode] OTP email skipped for ${email}`);
    return;
  }
  console.log(
    `[OTP Dev Mode] OTP requested for ${email} (use verification code ${getDevOtpCode()} in dev, or set RESEND_API_KEY to send real email)`,
  );
}
