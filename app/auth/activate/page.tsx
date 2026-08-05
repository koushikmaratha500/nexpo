import { ActivatePageWrapper } from '@/components/features/auth/ActivateForm';
import { AuthPageGate } from '@/components/features/auth';

export default function ActivatePage() {
  return (
    <AuthPageGate>
      <ActivatePageWrapper />
    </AuthPageGate>
  );
}
