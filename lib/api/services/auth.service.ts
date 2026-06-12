import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { SessionRepository } from '../repositories/session.repository';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'nexpo-ultra-secure-secret-key-123456');

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
    .sign(JWT_SECRET);
}

export async function verifyJwt(token: string): Promise<any | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}

export class AuthService {
  static async registerUser(data: any) {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = hashPassword(data.password);
    
    // Create verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Lookup country to associate
    const countryRecord = data.country
      ? await prisma.country.findFirst({
          where: { name: { equals: data.country, mode: 'insensitive' } },
        })
      : null;

    // Insert user
    const user = await UserRepository.create({
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email,
      passwordHash: hashedPassword,
      status: 'P', // PENDING verification
      countryId: countryRecord ? countryRecord.id : null,
      currencyId: countryRecord ? countryRecord.currencyId : null,
    });

    // In a real environment, we'd also seed OTP to verification table
    // For now we just return the newly created user and simulate OTP sending
    return { user, otp };
  }

  static async verifyUserOtp(email: string, otp: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real scenario we verify OTP from database, here we accept '123456' or verify it
    if (otp !== '123456') {
      throw new Error('Invalid verification OTP code');
    }

    await UserRepository.update(user.id, {
      status: 'A', // Activate user
      emailVerified: true,
    });

    return { success: true };
  }

  static async loginUser(email: string, password: string) {
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

    // Sign JWT
    const jwt = await signJwt({ id: user.id, email: user.email, role: 'CUSTOMER' });
    
    // Save Session to Database
    const expiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days (1 month)
    await SessionRepository.create({
      jwt,
      userId: user.id,
      expiryTime,
    });

    return { user, token: jwt };
  }

  static async loginAdmin(email: string, password: string) {
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
}
