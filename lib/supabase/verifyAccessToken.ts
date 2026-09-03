import { createClient } from '@supabase/supabase-js';
import { HttpError } from '@/lib/api/middleware/errorHandler';

export interface VerifiedSupabaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
}

export async function verifySupabaseAccessToken(accessToken: string): Promise<VerifiedSupabaseUser> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new HttpError(503, 'Google sign-in is not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(401, 'Invalid or expired Google session');
  }

  const email = data.user.email?.trim().toLowerCase();
  if (!email) {
    throw new HttpError(400, 'Google account has no email address');
  }

  const metadata = data.user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : '';
  const givenName = typeof metadata.given_name === 'string' ? metadata.given_name : '';
  const familyName = typeof metadata.family_name === 'string' ? metadata.family_name : '';
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  const firstName = givenName || nameParts[0] || email.split('@')[0] || 'User';
  const lastName = familyName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : null);
  const avatarUrl =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : null;

  return {
    id: data.user.id,
    email,
    firstName,
    lastName,
    avatarUrl,
  };
}
