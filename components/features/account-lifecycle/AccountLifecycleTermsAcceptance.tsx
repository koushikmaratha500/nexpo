'use client';

import Link from 'next/link';
import { SITE_DOCUMENT_ROUTES } from '@/lib/marketing/siteDocuments';

type AccountLifecycleTermsAcceptanceProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function AccountLifecycleTermsAcceptance({
  checked,
  onChange,
  disabled,
}: AccountLifecycleTermsAcceptanceProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-left">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        I accept the{' '}
        <Link
          href={SITE_DOCUMENT_ROUTES.termsAndConditions}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline underline-offset-2"
          onClick={(event) => event.stopPropagation()}
        >
          Terms &amp; Conditions
        </Link>
      </span>
    </label>
  );
}
