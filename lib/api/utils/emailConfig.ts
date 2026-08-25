import { isProductionEnv } from './redisClient';

export function isResendEnabled(): boolean {
  return process.env.ENABLE_RESEND === 'true';
}

export function getDevOtpCode(): string {
  return process.env.DEV_OTP_CODE?.trim() || '123456';
}

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (from) {
    return from.includes('<') ? from : `Nexpo Ledger <${from}>`;
  }
  return 'Nexpo Ledger <noreply@nexpo.com>';
}

export function assertResendConfigured(): void {
  if (isResendEnabled() && !process.env.RESEND_API_KEY?.trim()) {
    throw new Error('ENABLE_RESEND=true requires RESEND_API_KEY to be set');
  }
}

export function logOtpDevMode(email: string): void {
  if (isProductionEnv()) {
    console.log(`[OTP Dev Mode] OTP email skipped for ${email}`);
    return;
  }
  console.log(`[OTP Dev Mode] OTP requested for ${email} (use verification code ${getDevOtpCode()} in dev)`);
}
