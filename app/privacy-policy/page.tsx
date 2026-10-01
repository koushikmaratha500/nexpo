import type { Metadata } from 'next';
import { MarketingDocumentShell } from '@/components/marketing/MarketingDocumentShell';
import { BRAND_NAME } from '@/lib/brand/constants';

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `How ${BRAND_NAME} collects, uses, and protects your data.`,
};

export default function PrivacyPolicyPage() {
  return (
    <MarketingDocumentShell
      title="Privacy Policy"
      description="Placeholder privacy policy. Replace with your final policy aligned to your data processors and regions."
    >
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Information we collect</h2>
        <p className="mt-sm text-on-surface-variant">
          We may collect account details (name, email, phone), transaction and group data you enter, device and usage
          logs, and communications with support. [Expand with actual categories before launch.]
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">How we use information</h2>
        <p className="mt-sm text-on-surface-variant">
          To provide the service, send transactional messages (including OTPs), improve reliability, prevent abuse, and
          comply with law. Marketing communications will only be sent where permitted and with appropriate consent.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Sharing &amp; processors</h2>
        <p className="mt-sm text-on-surface-variant">
          [Placeholder] List subprocessors (hosting, email, SMS, analytics, payment) and purposes. Include international
          transfer mechanisms if applicable.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Retention</h2>
        <p className="mt-sm text-on-surface-variant">
          We retain data while your account is active and as needed for legal, security, and backup purposes. Deleted
          accounts may be recoverable for a limited window before permanent erasure.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Your rights</h2>
        <p className="mt-sm text-on-surface-variant">
          [Placeholder] Describe access, correction, deletion, portability, and objection rights for applicable regions
          (e.g. GDPR, DPDP).
        </p>
      </section>
    </MarketingDocumentShell>
  );
}
