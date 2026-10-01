import type { Metadata } from 'next';
import { MarketingDocumentShell } from '@/components/marketing/MarketingDocumentShell';
import { BRAND_NAME } from '@/lib/brand/constants';

export const metadata: Metadata = {
  title: `Terms & Conditions — ${BRAND_NAME}`,
  description: `Terms and conditions for using ${BRAND_NAME}.`,
};

export default function TermsAndConditionsPage() {
  return (
    <MarketingDocumentShell
      title="Terms & Conditions"
      description="This is draft placeholder text. Replace with your counsel-approved terms before public launch."
    >
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">1. Agreement</h2>
        <p className="mt-sm text-on-surface-variant">
          By creating an account or using {BRAND_NAME}, you agree to these Terms &amp; Conditions. If you do not agree,
          do not use the service.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">2. Service description</h2>
        <p className="mt-sm text-on-surface-variant">
          {BRAND_NAME} provides personal and group expense tracking, reporting, reminders, and related features. Features
          may change as we improve the product.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">3. Account responsibilities</h2>
        <p className="mt-sm text-on-surface-variant">
          You are responsible for safeguarding your login credentials and for activity under your account. Notify us
          promptly of any unauthorized use.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">4. Data &amp; account lifecycle</h2>
        <p className="mt-sm text-on-surface-variant">
          Account reset and deletion flows may retain recoverable data for a limited period (for example, seven days)
          before permanent removal, as described in-product and in our Privacy Policy.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">5. Limitation of liability</h2>
        <p className="mt-sm text-on-surface-variant">
          [Placeholder] Insert your jurisdiction-specific disclaimers, liability caps, and indemnity language here.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">6. Contact</h2>
        <p className="mt-sm text-on-surface-variant">
          Questions about these terms? Use our Contact Us page — support email and address to be added before launch.
        </p>
      </section>
    </MarketingDocumentShell>
  );
}
