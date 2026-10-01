import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingDocumentShell } from '@/components/marketing/MarketingDocumentShell';
import { BRAND_NAME } from '@/lib/brand/constants';
import { SITE_DOCUMENT_ROUTES } from '@/lib/marketing/siteDocuments';

export const metadata: Metadata = {
  title: `Contact Us — ${BRAND_NAME}`,
  description: `Get in touch with the ${BRAND_NAME} team.`,
};

export default function ContactUsPage() {
  return (
    <MarketingDocumentShell
      title="Contact Us"
      description="Placeholder contact details and form. Wire to your support inbox or CRM before launch."
    >
      <section className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-lg">
        <h2 className="font-title-md text-title-md font-bold text-primary">Support</h2>
        <ul className="mt-md space-y-sm text-on-surface-variant">
          <li>
            <span className="font-semibold text-on-surface">Email:</span> support@example.com (replace)
          </li>
          <li>
            <span className="font-semibold text-on-surface">Hours:</span> Monday–Friday, 9:00–18:00 IST (placeholder)
          </li>
          <li>
            <span className="font-semibold text-on-surface">Registered address:</span> [Your company address]
          </li>
        </ul>
        <p className="mt-md text-sm text-on-surface-variant">
          Signed-in users can also open{' '}
          <Link href="/customer/support" className="font-semibold text-primary underline">
            in-app Support
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-lg">
        <h2 className="font-title-md text-title-md font-bold text-primary">Send a message</h2>
        <p className="mt-sm text-sm text-on-surface-variant">
          This form is not connected yet. Replace with your contact API or third-party widget.
        </p>
        <form className="mt-lg flex flex-col gap-md" action="#" method="post">
          <label className="flex flex-col gap-xs">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Name</span>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              className="rounded-lg border border-outline-variant/50 bg-surface px-md py-sm"
              disabled
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="rounded-lg border border-outline-variant/50 bg-surface px-md py-sm"
              disabled
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Message</span>
            <textarea
              name="message"
              rows={4}
              placeholder="How can we help?"
              className="rounded-lg border border-outline-variant/50 bg-surface px-md py-sm"
              disabled
            />
          </label>
          <button
            type="button"
            disabled
            className="rounded-lg bg-primary/50 px-lg py-sm font-semibold text-on-primary cursor-not-allowed"
          >
            Submit (coming soon)
          </button>
        </form>
      </section>

      <p className="text-sm text-on-surface-variant">
        See also our{' '}
        <Link href={SITE_DOCUMENT_ROUTES.privacyPolicy} className="text-primary underline">
          Privacy Policy
        </Link>
        .
      </p>
    </MarketingDocumentShell>
  );
}
