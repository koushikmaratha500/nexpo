import { ForcedResetPageWrapper } from '@/components/features/auth/ForcedResetForm';
import { AuthPageGate } from '@/components/features/auth';

export default function ForcedResetPage() {
  return (
    <AuthPageGate>
      <ForcedResetPageWrapper />
    </AuthPageGate>
  );
}