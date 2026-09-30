import { HttpError } from '../middleware/errorHandler';
import type { AccountLifecycleOtpChannel, AccountLifecycleOtpSendDto } from '../dtos/account-lifecycle.dto';
import { AccountLifecycleRepository } from '../repositories/account-lifecycle.repository';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { SmsOtpService } from './sms-otp.service';
import { assertOtpAllowedInProduction } from '../utils/emailConfig';
import { assertSmsOtpAllowedInProduction, isTwilioSmsEnabled } from '../utils/smsOtpConfig';
import { isResendEnabled, logOtpDevMode } from '../utils/emailConfig';

type AccountAction = 'RESET' | 'DELETE';

export class AccountLifecycleOtpService {
  private static resolveDestination(
    user: NonNullable<Awaited<ReturnType<typeof AccountLifecycleRepository.findUserById>>>,
    channel: AccountLifecycleOtpChannel,
  ): string {
    if (channel === 'email') {
      if (!user.email?.trim()) {
        throw new Error('No email on file. Add an email address or use SMS OTP.');
      }
      return user.email.trim().toLowerCase();
    }

    if (!user.mobile?.trim()) {
      throw new Error('No mobile number on file. Add a phone number or use email OTP.');
    }
    return user.mobile.trim();
  }

  static async sendOtp(userId: string, input: AccountLifecycleOtpSendDto) {
    const user = await AccountLifecycleRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const destination = this.resolveDestination(user, input.channel);
    const storageKey = OtpService.accountActionKey({
      userId,
      action: input.action,
      channel: input.channel,
      destination,
    });

    if (input.channel === 'email') {
      assertOtpAllowedInProduction();
      const code = await OtpService.createScopedOtp(storageKey, () =>
        isResendEnabled() ? OtpService.generateOtp() : OtpService.resolveOtpCode(),
      );

      if (isResendEnabled()) {
        const result = await EmailService.sendAccountActionOtpEmail(
          destination,
          code,
          input.action === 'RESET' ? 'reset your account data' : 'delete your account',
        );
        if (!result.success) {
          await OtpService.clearScopedOtp(storageKey);
          throw new Error('Failed to send OTP email. Please try again later.');
        }
      } else {
        logOtpDevMode(destination);
      }
    } else {
      assertSmsOtpAllowedInProduction();
      const code = await OtpService.createScopedOtp(storageKey, () =>
        isTwilioSmsEnabled() ? OtpService.generateOtp() : OtpService.resolveOtpCode(),
      );
      const label = input.action === 'RESET' ? 'account reset' : 'account deletion';
      await SmsOtpService.sendOtp(
        destination,
        `Your PaysaSuchan ${label} code is ${code}. Valid for 15 minutes.`,
      );
    }

    return {
      success: true,
      channel: input.channel,
      action: input.action,
      destination_masked: maskDestination(destination, input.channel),
      expires_in_seconds: 15 * 60,
    };
  }

  static async verifyOtp(params: {
    userId: string;
    action: AccountAction;
    channel: AccountLifecycleOtpChannel;
    otp: string;
  }): Promise<void> {
    const user = await AccountLifecycleRepository.findUserById(params.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const destination = this.resolveDestination(user, params.channel);
    const storageKey = OtpService.accountActionKey({
      userId: params.userId,
      action: params.action,
      channel: params.channel,
      destination,
    });

    if (params.channel === 'email') {
      assertOtpAllowedInProduction();
    } else {
      assertSmsOtpAllowedInProduction();
    }

    const verified = await OtpService.verifyScopedOtp(storageKey, params.otp.trim());
    if (!verified) {
      throw new HttpError(400, 'Invalid or expired OTP code');
    }
  }
}

function maskDestination(destination: string, channel: AccountLifecycleOtpChannel): string {
  if (channel === 'email') {
    const [local, domain] = destination.split('@');
    if (!local || !domain) {
      return '***';
    }
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${domain}`;
  }

  const digits = destination.replace(/\D/g, '');
  if (digits.length < 4) {
    return '***';
  }
  return `***${digits.slice(-4)}`;
}
