import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { registerSchema, loginSchema, verifyOtpSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } from '../dtos/auth.dto';
import { EmailService } from '../services/email.service';

export class AuthController {
  static async register(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = registerSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || 'anonymous';
      const ua = req.headers.get('user-agent') || '';
      const { user, otp } = await AuthService.registerUser(validated, { ip, ua });

      // Send OTP
      await EmailService.sendOtpEmail(user.email!, otp);

      return NextResponse.json({
        success: true,
        message: 'Registration successful. OTP sent to email.',
        user: { id: user.id, email: user.email },
      }, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
    }
  }

  static async verify(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = verifyOtpSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || 'anonymous';
      const ua = req.headers.get('user-agent') || '';
      await AuthService.verifyUserOtp(validated.email, validated.otp, { ip, ua });

      return NextResponse.json({
        success: true,
        message: 'Account verified successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 400 });
    }
  }

  static async loginUser(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = loginSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || 'anonymous';
      const ua = req.headers.get('user-agent') || '';
      const { user, token } = await AuthService.loginUser(validated.email, validated.password, { ip, ua });

      return NextResponse.json({
        success: true,
        token,
        user: {
          firstName: user.firstName,
          lastName: user.lastName || '',
          phone: user.mobile || '',
          email: user.email || '',
          countryId: user.countryId,
          currencyId: user.currencyId,
          role: 'CUSTOMER',
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Login failed' }, { status: 400 });
    }
  }

  static async loginAdmin(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = loginSchema.parse(body);

      const { admin, token } = await AuthService.loginAdmin(validated.email, validated.password);

      return NextResponse.json({
        success: true,
        token,
        admin: {
          firstName: admin.firstName,
          lastName: admin.lastName || '',
          email: admin.email || '',
          role: 'ADMIN',
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Login failed' }, { status: 400 });
    }
  }

  static async getProfile(req: NextRequest, userId: string, isAdmin = false) {
    try {
      if (isAdmin) {
        const adminProfile = await AdminRepository.findById(userId);
        if (!adminProfile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        return NextResponse.json({
          firstName: adminProfile.firstName,
          lastName: adminProfile.lastName || '',
          email: adminProfile.email || '',
          role: 'ADMIN',
        });
      } else {
        const userProfile = await UserRepository.findById(userId);
        if (!userProfile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        return NextResponse.json({
          firstName: userProfile.firstName,
          lastName: userProfile.lastName || '',
          phone: userProfile.mobile || '',
          email: userProfile.email || '',
          countryId: userProfile.countryId,
          currencyId: userProfile.currencyId,
          role: 'CUSTOMER',
        });
      }
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
    }
  }

  static async updateProfile(req: NextRequest, userId: string, isAdmin = false) {
    try {
      const body = await req.json();
      const validated = updateProfileSchema.parse(body);

      const updateData = { ...validated } as any;

      if (validated.newPassword) {
        if (!validated.oldPassword) {
          return NextResponse.json({ error: 'Old password is required to change password' }, { status: 400 });
        }

        const profile = isAdmin
          ? await AdminRepository.findById(userId)
          : await UserRepository.findById(userId);

        if (!profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const passwordHash = profile.passwordHash;
        const { comparePassword, hashPassword } = await import('../services/auth.service');
        if (!passwordHash || !comparePassword(validated.oldPassword, passwordHash)) {
          return NextResponse.json({ error: 'Incorrect old password' }, { status: 400 });
        }

        updateData.passwordHash = hashPassword(validated.newPassword);
      }

      delete updateData.oldPassword;
      delete updateData.newPassword;

      if (isAdmin) {
        const updatedAdmin = await AdminRepository.update(userId, updateData);
        return NextResponse.json({
          firstName: updatedAdmin.firstName,
          lastName: updatedAdmin.lastName || '',
          email: updatedAdmin.email || '',
          role: 'ADMIN',
        });
      } else {
        const updatedUser = await UserRepository.update(userId, updateData);
        return NextResponse.json({
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName || '',
          phone: updatedUser.mobile || '',
          email: updatedUser.email || '',
          countryId: updatedUser.countryId,
          currencyId: updatedUser.currencyId,
          role: 'CUSTOMER',
        });
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 400 });
    }
  }

  static async forgotAdminPassword(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = forgotPasswordSchema.parse(body);

      const result = await AuthService.forgotAdminPassword(validated.email);

      // Always return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If the account exists, a password reset link has been sent to your email.',
        ...(result.resetToken ? { devToken: result.resetToken } : {}),
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to request password reset' }, { status: 400 });
    }
  }

  static async resetAdminPassword(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = resetPasswordSchema.parse(body);

      await AuthService.resetAdminPassword(validated.token, validated.password);

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. You can now sign in with your new password.',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 400 });
    }
  }

  static async logout(req: NextRequest) {
    try {
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        await AuthService.logout(token);
      }
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Logout failed' }, { status: 500 });
    }
  }
}