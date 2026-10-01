import type { Metadata } from 'next';
import { MarketingDocumentShell } from '@/components/marketing/MarketingDocumentShell';
import { BRAND_NAME } from '@/lib/brand/constants';

export const metadata: Metadata = {
  title: `Terms of Use — ${BRAND_NAME}`,
  description: `Rules for using the ${BRAND_NAME} website and applications.`,
};

export default function TermsOfUsePage() {
  return (
    <MarketingDocumentShell
      title="Terms of Use"
      description="Placeholder terms of use for the site and apps. Distinct from Terms & Conditions where your counsel requires both."
    >
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Acceptable use</h2>
        <p className="mt-sm text-on-surface-variant">
          You may not misuse {BRAND_NAME}, attempt to access other users&apos; data without permission, interfere with
          the platform, or use the service for unlawful purposes.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Intellectual property</h2>
        <p className="mt-sm text-on-surface-variant">
          {BRAND_NAME}, its logos, and software are owned by [Company legal name — placeholder]. You receive a limited,
          revocable license to use the service as intended.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Third-party services</h2>
        <p className="mt-sm text-on-surface-variant">
          Integrations (payments, messaging, AI providers) are subject to their own terms. We are not responsible for
          third-party sites linked from the product.
        </p>
      </section>
      <section>
        <h2 className="font-title-lg text-title-lg font-bold text-primary">Changes</h2>
        <p className="mt-sm text-on-surface-variant">
          We may update these Terms of Use. Material changes will be communicated via the app or email where required.
          Continued use after changes constitutes acceptance.
        </p>
      </section>
    </MarketingDocumentShell>
  );
}
