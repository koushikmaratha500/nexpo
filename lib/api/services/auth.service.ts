import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { SessionRepository } from '../repositories/session.repository';
import { MetaRepository } from '../repositories/meta.repository';
import { PasswordResetTokenRepository } from '../repositories/password-reset-token.repository';
import crypto from 'crypto';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import * as jose from 'jose';
import { AuditAction } from '@prisma/client';
import { assertValidUsername, isValidUsername } from '../utils/username';
import { verifySupabaseAccessToken } from '@/lib/supabase/verifyAccessToken';
import { AuthProvider } from '@prisma/client';

function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Set it in .env.local (see .env.example).',
    );
  }
  return new TextEncoder().encode(secret);
}

let jwtSecretBytes: Uint8Array | undefined;

function jwtSecret(): Uint8Array {
  if (!jwtSecretBytes) {
    jwtSecretBytes = getJwtSecretBytes();
  }
  return jwtSecretBytes;
}

function shouldExposeDevResetToken(): boolean {
  return (
    process.env.NODE_ENV === 'development' && process.env.EXPOSE_DEV_RESET_TOKEN === 'true'
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function comparePassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === checkHash;
  } catch (e) {
    return false;
  }
}

export async function signJwt(payload: any, expiry = '30d'): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(jwtSecret());
}

export async function verifyJwt(token: string): Promise<any | null> {
  try {
    const { payload } = await jose.jwtVerify(token, jwtSecret());
    return payload;
  } catch (e) {
    return null;
  }
}

export class AuthService {
  static async registerUser(data: any, meta = { ip: '', ua: '' }) {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('Email is already registered');
    }

    const username = assertValidUsername(data.username);
    const existingUsername = await UserRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username is already taken');
    }

    const hashedPassword = hashPassword(data.password);

    const countryRecord = data.country
      ? await MetaRepository.findCountryByName(data.country)
      : null;

    const user = await UserRepository.create({
      username,
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email,
      passwordHash: hashedPassword,
      status: 'P',
      countryId: countryRecord ? countryRecord.id : null,
      currencyId: countryRecord ? countryRecord.currencyId : null,
    });

    await UserRepository.createAudit({
      userId: user.id,
      action: AuditAction.CREATE,
      newValue: { email: user.email, firstName: user.firstName, status: user.status },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    const otpEmail = user.email;
    if (!otpEmail) {
      throw new Error('User email is missing');
    }
    const otp = await OtpService.createOtp(otpEmail, true);
    return { user, otp };
  }

  static async verifyUserOtp(email: string, otp: string, meta = { ip: '', ua: '' }) {
    const verified = await OtpService.verifyOtp(email, otp);
    if (!verified) {
      throw new Error('Invalid or expired verification OTP code');
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const oldStatus = user.status;

    await UserRepository.update(user.id, {
      status: 'A',
      emailVerified: true,
    });

    await UserRepository.createAudit({
      userId: user.id,
      action: AuditAction.ACTIVATE,
      oldValue: { status: oldStatus, emailVerified: false },
      newValue: { status: 'A', emailVerified: true },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { success: true };
  }

  static async loginUser(email: string, password: string, meta = { ip: '', ua: '' }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status === 'P') {
      throw new Error('Account pending verification. Verify via OTP first.');
    }

    if (user.status === 'B') {
      throw new Error('Account has been blocked');
    }

    if (!user.passwordHash || !comparePassword(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    // If an admin flagged a forced password reset, issue a short-lived session
    // so the customer can set a new password before accessing the app.
    if (user.forcedResetPassword) {
      const tempJwt = await signJwt({ id: user.id, email: user.email, role: 'CUSTOMER' }, '15m');
      const tempExpiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await SessionRepository.create({
        jwt: tempJwt,
        userId: user.id,
        expiryTime: tempExpiryTime,
      });

      await UserRepository.createAudit({
        userId: user.id,
        action: AuditAction.LOGIN,
        newValue: { email: user.email, note: 'Forced password reset required on next login' },
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
        status: 'A',
      });

      return { user, token: tempJwt, forcePasswordReset: true };
    }

    // Sign JWT
    const jwt = await signJwt({ id: user.id, email: user.email, role: 'CUSTOMER' });
    
    // Save Session to Database
    const expiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days (1 month)
    await SessionRepository.create({
      jwt,
      userId: user.id,
      expiryTime,
    });

     await UserRepository.createAudit({
      userId: user.id,
      action: AuditAction.LOGIN,
      newValue: { email: user.email, sessionJwt: jwt.slice(0, 20) + '...' },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { user, token: jwt };
  }

  private static async generateUniqueUsername(email: string): Promise<string> {
    const localPart = email.split('@')[0] ?? 'user';
    const sanitized = localPart.replace(/[^a-z0-9_]/gi, '').toLowerCase();
    let base = sanitized.length >= 3 ? sanitized.slice(0, 24) : `user${sanitized}`.slice(0, 24);
    if (!isValidUsername(base)) {
      base = `user${crypto.randomBytes(3).toString('hex')}`.slice(0, 24);
    }

    let candidate = assertValidUsername(base);
    let suffix = 0;
    while (await UserRepository.findByUsername(candidate)) {
      suffix += 1;
      candidate = assertValidUsername(`${base.slice(0, 20)}_${suffix}`);
    }
    return candidate;
  }

  private static async issueCustomerSession(
    user: Awaited<ReturnType<typeof UserRepository.findByEmail>>,
    meta: { ip?: string; ua?: string },
    auditNote?: string,
  ) {
    if (!user?.email) {
      throw new Error('User email is missing');
    }

    const jwt = await signJwt({ id: user.id, email: user.email, role: 'CUSTOMER' });
    const expiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await SessionRepository.create({
      jwt,
      userId: user.id,
      expiryTime,
    });

    await UserRepository.createAudit({
      userId: user.id,
      action: AuditAction.LOGIN,
      newValue: {
        email: user.email,
        note: auditNote ?? 'Customer login',
        sessionJwt: jwt.slice(0, 20) + '...',
      },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { user, token: jwt };
  }

  static async loginWithGoogle(accessToken: string, meta = { ip: '', ua: '' }) {
    const googleUser = await verifySupabaseAccessToken(accessToken);
    let user = await UserRepository.findByEmail(googleUser.email);

    if (!user) {
      const countryRecord = await MetaRepository.findCountryByName('India');
      const username = await this.generateUniqueUsername(googleUser.email);

      user = await UserRepository.create({
        username,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        email: googleUser.email,
        profileImageUrl: googleUser.avatarUrl,
        provider: AuthProvider.GOOGLE,
        status: 'A',
        emailVerified: true,
        countryId: countryRecord?.id ?? null,
        currencyId: countryRecord?.currencyId ?? null,
      });

      await UserRepository.createAudit({
        userId: user.id,
        action: AuditAction.CREATE,
        newValue: { email: user.email, provider: 'GOOGLE', source: 'google_oauth' },
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
        status: 'A',
      });
    } else {
      if (user.status === 'B') {
        throw new Error('Account has been blocked');
      }

      const updates: Parameters<typeof UserRepository.update>[1] = {
        emailVerified: true,
        provider: AuthProvider.GOOGLE,
      };

      if (user.status === 'P') {
        updates.status = 'A';
      }

      if (googleUser.avatarUrl && !user.profileImageUrl) {
        updates.profileImageUrl = googleUser.avatarUrl;
      }

      user = await UserRepository.update(user.id, updates);
    }

    return this.issueCustomerSession(user, meta, 'Google OAuth login');
  }

  static async completeForcedPasswordReset(userId: string, newPassword: string, meta = { ip: '', ua: '' }) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.forcedResetPassword) {
      throw new Error('Forced password reset is not required for this account');
    }

    const hashedPassword = hashPassword(newPassword);
    const updated = await UserRepository.update(userId, {
      passwordHash: hashedPassword,
      forcedResetPassword: false,
      lastPasswordChangedDate: new Date(),
    });

    await SessionRepository.invalidateAllForUser(userId);

    const jwt = await signJwt({ id: user.id, email: user.email, role: 'CUSTOMER' });
    const expiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days (1 month)
    await SessionRepository.create({
      jwt,
      userId: user.id,
      expiryTime,
    });

    await UserRepository.createAudit({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET,
      oldValue: { email: user.email, forcedResetPassword: true },
      newValue: { email: user.email, forcedResetPassword: false },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { user: updated, token: jwt };
  }

  static async loginAdmin(email: string, password: string, meta = { ip: '', ua: '' }) {
    const admin = await AdminRepository.findByEmail(email);
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    if (admin.status === 'B') {
      throw new Error('Admin account has been blocked');
    }

    if (!comparePassword(password, admin.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    // Sign JWT
    const jwt = await signJwt({ id: admin.id, email: admin.email, role: 'ADMIN' });
    
    // Save Session to Database
    const expiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days (1 month)
    await SessionRepository.create({
      jwt,
      adminId: admin.id,
      expiryTime,
    });

    return { admin, token: jwt };
  }

  static async logout(jwt: string) {
    await SessionRepository.invalidate(jwt);
    return { success: true };
  }

  static async forgotUserPassword(email: string, meta = { ip: '', ua: '' }) {
    const user = await UserRepository.findByEmail(email);
    if (!user || user.status !== 'A' || !user.email) {
      return { success: true, simulated: true };
    }

    await PasswordResetTokenRepository.invalidateActiveForUser(email, user.id);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetTokenRepository.create({
      token: resetToken,
      email: user.email,
      userId: user.id,
      expiresAt,
      status: 'A',
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    await EmailService.sendPasswordResetEmail(user.email, resetLink, false);

    await UserRepository.createAudit({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET,
      newValue: { email: user.email, note: 'Password reset requested' },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return {
      success: true,
      ...(shouldExposeDevResetToken() ? { resetToken } : {}),
    };
  }

  static async resetUserPassword(token: string, newPassword: string, meta = { ip: '', ua: '' }) {
    const resetRecord = await PasswordResetTokenRepository.findByToken(token);

    if (!resetRecord || !resetRecord.userId) {
      throw new Error('Invalid or expired reset token');
    }

    if (resetRecord.status !== 'A' || resetRecord.usedAt) {
      throw new Error('Reset token has already been used');
    }

    if (resetRecord.expiresAt < new Date()) {
      await PasswordResetTokenRepository.markInactive(resetRecord.id);
      throw new Error('Reset token has expired. Please request a new one.');
    }

    const hashedPassword = hashPassword(newPassword);
    await UserRepository.update(resetRecord.userId, {
      passwordHash: hashedPassword,
      forcedResetPassword: false,
      lastPasswordChangedDate: new Date(),
    });

    await PasswordResetTokenRepository.markUsed(resetRecord.id);
    await SessionRepository.invalidateAllForUser(resetRecord.userId);

    await UserRepository.createAudit({
      userId: resetRecord.userId,
      action: AuditAction.PASSWORD_RESET,
      newValue: { email: resetRecord.email, note: 'Password reset completed via token' },
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
      status: 'A',
    });

    return { success: true };
  }

  static async forgotAdminPassword(email: string) {
    const admin = await AdminRepository.findByEmail(email);
    if (!admin) {
      // Always return success to avoid email enumeration
      return { success: true, simulated: true };
    }

    // Invalidate any existing active reset tokens for this email
    await PasswordResetTokenRepository.invalidateActiveForAdmin(email, admin.id);

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await PasswordResetTokenRepository.create({
      token: resetToken,
      email: admin.email,
      adminId: admin.id,
      expiresAt,
      status: 'A',
    });

    // Build reset link (simulate since we can't use absolute URLs in dev easily)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/admin/reset-password?token=${resetToken}`;

    await EmailService.sendPasswordResetEmail(admin.email, resetLink, true);

    return {
      success: true,
      ...(shouldExposeDevResetToken() ? { resetToken } : {}),
    };
  }

  static async resetAdminPassword(token: string, newPassword: string) {
    const resetRecord = await PasswordResetTokenRepository.findByToken(token);

    if (!resetRecord || !resetRecord.adminId) {
      throw new Error('Invalid or expired reset token');
    }

    if (resetRecord.status !== 'A' || resetRecord.usedAt) {
      throw new Error('Reset token has already been used');
    }

    if (resetRecord.expiresAt < new Date()) {
      // Mark token as expired
      await PasswordResetTokenRepository.markInactive(resetRecord.id);
      throw new Error('Reset token has expired. Please request a new one.');
    }

    // Update admin password
    const hashedPassword = hashPassword(newPassword);
    await AdminRepository.update(resetRecord.adminId, {
      passwordHash: hashedPassword,
    });

    // Mark token as used
    await PasswordResetTokenRepository.markUsed(resetRecord.id);

    // Invalidate all existing sessions for this admin
    await SessionRepository.invalidateAllForAdmin(resetRecord.adminId);

    return { success: true };
  }
}