import { LoginPageWrapper } from '@/components/features/auth/LoginForm';
import { BRAND_NAME } from '@/lib/brand/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Sign In — ${BRAND_NAME}`,
};

export default function CustomerLoginPage() {
  return <LoginPageWrapper />;
}
