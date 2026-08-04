import { RegisterPageWrapper } from '@/components/features/auth/RegisterForm';
import { AuthPageGate } from '@/components/features/auth';

export default function RegisterPage() {
  return (
    <AuthPageGate>
      <RegisterPageWrapper />
    </AuthPageGate>
  );
}