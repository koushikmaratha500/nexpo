import { NextRequest } from 'next/server';
import { HttpError } from '../middleware/errorHandler';
import { BaseController } from './base.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  completeForcedResetSchema,
  googleAuthSchema,
} from '../dtos/auth.dto';
import { comparePassword, hashPassword } from '../services/auth.service';
import { assertValidUsername } from '../utils/username';

function serializeCustomerUser(user: {
  username?: string | null;
  firstName: string;
  lastName: string | null;
  mobile: string | null;
  email: string | null;
  countryId: string | null;
  currencyId: string | null;
}) {
  return {
    username: user.username || '',
    firstName: user.firstName,
    lastName: user.lastName || '',
    phone: user.mobile || '',
    email: user.email || '',
    countryId: user.countryId,
    currencyId: user.currencyId,
    role: 'CUSTOMER' as const,
  };
}

export class AuthController extends BaseController {
  static async register(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = registerSchema.parse(body);
      const meta = this.requestMeta(req);
      const { user } = await AuthService.registerUser(validated, meta);
      return {
        success: true,
        message: 'Registration successful. OTP sent to email.',
        user: { id: user.id, email: user.email },
      };
    }, { status: 201, fallbackMessage: 'Registration failed' });
  }

  static async verify(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = verifyOtpSchema.parse(body);
      const meta = this.requestMeta(req);
      await AuthService.verifyUserOtp(validated.email, validated.otp, meta);
      return { success: true, message: 'Account verified successfully' };
    }, { fallbackMessage: 'Verification failed' });
  }

  static async resendOtp(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = resendOtpSchema.parse(body);
      return AuthService.resendVerificationOtp(validated.email);
    }, { fallbackMessage: 'Failed to resend verification code' });
  }

  static async loginUser(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = loginSchema.parse(body);
      const meta = this.requestMeta(req);
      const result = await AuthService.loginUser(validated.email, validated.password, meta);
      return {
        success: true,
        token: result.token,
        ...(result.forcePasswordReset ? { forcePasswordReset: true } : {}),
        user: serializeCustomerUser(result.user),
      };
    }, { fallbackMessage: 'Login failed' });
  }

  static async loginWithGoogle(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = googleAuthSchema.parse(body);
      const meta = this.requestMeta(req);
      const result = await AuthService.loginWithGoogle(validated.accessToken, meta);
      return {
        success: true,
        token: result.token,
        user: serializeCustomerUser(result.user),
      };
    }, { fallbackMessage: 'Google sign-in failed' });
  }

  static async completeForcedPasswordReset(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = completeForcedResetSchema.parse(body);
      const meta = this.requestMeta(req);
      const { user, token } = await AuthService.completeForcedPasswordReset(userId, validated.newPassword, meta);
      return {
        success: true,
        message: 'Password updated successfully',
        token,
        user: serializeCustomerUser(user),
      };
    }, { fallbackMessage: 'Failed to update password' });
  }

  static async loginAdmin(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = loginSchema.parse(body);
      const { admin, token } = await AuthService.loginAdmin(validated.email, validated.password);
      return {
        success: true,
        token,
        admin: {
          firstName: admin.firstName,
          lastName: admin.lastName || '',
          email: admin.email || '',
          role: 'ADMIN' as const,
        },
      };
    }, { fallbackMessage: 'Login failed' });
  }

  static async getProfile(_req: NextRequest, userId: string, isAdmin = false) {
    return this.safeExecuteJson(async () => {
      if (isAdmin) {
        const adminProfile = await AdminRepository.findById(userId);
        if (!adminProfile) throw new HttpError(404, 'Profile not found');
        return {
          firstName: adminProfile.firstName,
          lastName: adminProfile.lastName || '',
          email: adminProfile.email || '',
          role: 'ADMIN' as const,
        };
      }

      const userProfile = await UserRepository.findById(userId);
      if (!userProfile) throw new HttpError(404, 'Profile not found');
      return serializeCustomerUser(userProfile);
    }, { fallbackMessage: 'Failed to fetch profile' });
  }

  static async updateProfile(req: NextRequest, userId: string, isAdmin = false) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateProfileSchema.parse(body);
      const updateData = { ...validated } as Record<string, unknown>;

      if (validated.username) {
        const normalizedUsername = assertValidUsername(validated.username);
        const existingUsername = await UserRepository.findByUsername(normalizedUsername);
        if (existingUsername && existingUsername.id !== userId) {
          throw new HttpError(400, 'Username is already taken');
        }
        updateData.username = normalizedUsername;
      }

      if (validated.newPassword) {
        if (!validated.oldPassword) {
          throw new HttpError(400, 'Old password is required to change password');
        }

        const profile = isAdmin
          ? await AdminRepository.findById(userId)
          : await UserRepository.findById(userId);

        if (!profile) throw new HttpError(404, 'Profile not found');
        if (!profile.passwordHash || !comparePassword(validated.oldPassword, profile.passwordHash)) {
          throw new HttpError(400, 'Incorrect old password');
        }

        updateData.passwordHash = hashPassword(validated.newPassword);
        if (!isAdmin) {
          updateData.forcedResetPassword = false;
          updateData.lastPasswordChangedDate = new Date();
        }
      }

      delete updateData.oldPassword;
      delete updateData.newPassword;

      if (isAdmin) {
        const updatedAdmin = await AdminRepository.update(userId, updateData);
        return {
          firstName: updatedAdmin.firstName,
          lastName: updatedAdmin.lastName || '',
          email: updatedAdmin.email || '',
          role: 'ADMIN' as const,
        };
      }

      const updatedUser = await UserRepository.update(userId, updateData);
      return serializeCustomerUser(updatedUser);
    }, { fallbackMessage: 'Failed to update profile' });
  }

  static async forgotAdminPassword(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = forgotPasswordSchema.parse(body);
      const result = await AuthService.forgotAdminPassword(validated.email);
      const devPayload =
        'resetToken' in result && result.resetToken ? { devToken: result.resetToken } : {};
      return {
        success: true,
        message: 'If the account exists, a password reset link has been sent to your email.',
        ...devPayload,
      };
    }, { fallbackMessage: 'Failed to request password reset' });
  }

  static async forgotUserPassword(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = forgotPasswordSchema.parse(body);
      const meta = this.requestMeta(req);
      const result = await AuthService.forgotUserPassword(validated.email, meta);
      const devPayload =
        'resetToken' in result && result.resetToken ? { devToken: result.resetToken } : {};
      return {
        success: true,
        message: 'If the account exists, a password reset link has been sent to your email.',
        ...devPayload,
      };
    }, { fallbackMessage: 'Failed to request password reset' });
  }

  static async resetAdminPassword(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = resetPasswordSchema.parse(body);
      await AuthService.resetAdminPassword(validated.token, validated.password);
      return {
        success: true,
        message: 'Password has been reset successfully. You can now sign in with your new password.',
      };
    }, { fallbackMessage: 'Failed to reset password' });
  }

  static async resetUserPassword(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = resetPasswordSchema.parse(body);
      const meta = this.requestMeta(req);
      await AuthService.resetUserPassword(validated.token, validated.password, meta);
      return {
        success: true,
        message: 'Password has been reset successfully. You can now sign in with your new password.',
      };
    }, { fallbackMessage: 'Failed to reset password' });
  }

  static async logout(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      if (token) await AuthService.logout(token);
      return { success: true, message: 'Logged out successfully' };
    }, { fallbackMessage: 'Logout failed' });
  }
}
