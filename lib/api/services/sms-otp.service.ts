import { OtpService } from './otp.service';
import {
  assertSmsOtpAllowedInProduction,
  isTwilioSmsEnabled,
  logSmsOtpDevMode,
} from '../utils/smsOtpConfig';

function normalizeE164(mobile: string): string {
  const trimmed = mobile.trim();
  if (trimmed.startsWith('+')) {
    return trimmed;
  }
  return `+${trimmed.replace(/\D/g, '')}`;
}

export class SmsOtpService {
  static async sendOtp(mobile: string, message: string): Promise<void> {
    assertSmsOtpAllowedInProduction();

    if (!isTwilioSmsEnabled()) {
      const codeMatch = message.match(/\b(\d{6})\b/);
      logSmsOtpDevMode(mobile, codeMatch?.[1] ?? OtpService.generateOtp());
      return;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
    const from = process.env.TWILIO_SMS_FROM!.trim();
    const to = normalizeE164(mobile);

    const body = new URLSearchParams({
      To: to,
      From: from,
      Body: message,
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to send SMS OTP (${response.status}): ${text.slice(0, 200)}`);
    }
  }
}
