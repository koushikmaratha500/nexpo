import { ResetPasswordPageWrapper } from '@/components/features/auth/ResetPasswordForm';
import { AuthPageGate } from '@/components/features/auth';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params?.token;

  return (
    <AuthPageGate>
      <ResetPasswordPageWrapper token={token} />
    </AuthPageGate>
  );
}
