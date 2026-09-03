import type { Status } from '@prisma/client';

const STATUS_LABELS: Record<string, string> = {
  A: 'Open',
  I: 'Closed',
  P: 'Pending',
  B: 'Blocked',
  D: 'Deleted',
};

const STATUS_CLASSES: Record<string, string> = {
  A: 'bg-secondary-container/20 text-on-secondary-container border-secondary/20',
  I: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  P: 'bg-tertiary-container/20 text-on-tertiary-container border-tertiary/20',
  B: 'bg-error-container/20 text-error border-error/20',
  D: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
};

interface SupportStatusBadgeProps {
  status: Status | string;
}

export function SupportStatusBadge({ status }: SupportStatusBadgeProps) {
  const label = STATUS_LABELS[status] || status;
  const className = STATUS_CLASSES[status] || STATUS_CLASSES.P;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${className}`}>
      {label}
    </span>
  );
}
