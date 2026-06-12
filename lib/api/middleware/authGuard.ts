import { NextRequest } from 'next/server';
import { verifyJwt } from '../services/auth.service';
import { SessionRepository } from '../repositories/session.repository';
import { HttpError } from './errorHandler';

export async function authGuard(req: NextRequest, requiredRole?: 'ADMIN' | 'CUSTOMER') {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'Unauthorized: Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new HttpError(401, 'Unauthorized: Token is empty');
  }

  // 1. Verify token signature
  const payload = await verifyJwt(token);
  if (!payload || !payload.id || !payload.role) {
    throw new HttpError(401, 'Unauthorized: Invalid token signature or payload');
  }

  // 2. Check if session is active in database (non-invalidated)
  const session = await SessionRepository.findActiveByJwt(token);
  if (!session) {
    throw new HttpError(401, 'Unauthorized: Session has been invalidated or expired');
  }

  // 3. Check role requirement if any
  if (requiredRole && payload.role !== requiredRole) {
    throw new HttpError(403, 'Forbidden: Insufficient permissions');
  }

  return {
    id: payload.id as string,
    email: payload.email as string,
    role: payload.role as 'ADMIN' | 'CUSTOMER',
    session,
  };
}
