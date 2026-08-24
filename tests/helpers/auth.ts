import { signJwt } from '@/lib/api/services/auth.service';

export interface TestAuthPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export async function mintTestToken(
  payload: TestAuthPayload,
  expiry = '1h',
): Promise<string> {
  return signJwt(payload, expiry);
}

export function bearerHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
