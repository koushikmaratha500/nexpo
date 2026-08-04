import { ForgotPasswordPageWrapper } from '@/components/features/auth/ForgotPasswordForm';
import { AuthPageGate } from '@/components/features/auth';

export default function ForgotPasswordPage() {
  return (
    <AuthPageGate>
      <ForgotPasswordPageWrapper />
    </AuthPageGate>
  );
}
