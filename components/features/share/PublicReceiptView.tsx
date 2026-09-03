'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BRAND_NAME } from '@/lib/brand/constants';
import { formatDate } from '@/lib/date';

interface PublicReceiptData {
  shareId: string;
  expiresAt: string;
  sharedBy: string;
  receipt: {
    title: string;
    merchant: string | null;
    description: string | null;
    type: 'DEBIT' | 'CREDIT';
    amountFormatted: string;
    category: string | null;
    paymentType: string | null;
    transactionDate: string;
    notes: string | null;
    groupName: string | null;
    splits: { name: string; amountFormatted: string }[];
  };
}

export function PublicReceiptView({ token }: { token: string }) {
  const [data, setData] = useState<PublicReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/receipts/${token}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Receipt not found');
        }
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load receipt');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = data
    ? `Receipt from ${BRAND_NAME} — ${data.receipt.amountFormatted} at ${data.receipt.merchant || data.receipt.title}: ${shareUrl}`
    : shareUrl;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const smsHref = `sms:?body=${encodeURIComponent(shareText)}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-md bg-background px-lg text-center">
        <BrandLogo variant="full" theme="mono" />
        <h1 className="font-headline-md text-headline-md font-black text-primary">Receipt unavailable</h1>
        <p className="font-body-md text-on-surface-variant">{error || 'This link may have expired.'}</p>
        <Link href="/">
          <Button>Back to {BRAND_NAME}</Button>
        </Link>
      </div>
    );
  }

  const { receipt } = data;

  return (
    <div className="min-h-screen bg-surface-container-low px-lg py-2xl">
      <div className="mx-auto max-w-lg">
        <div className="mb-xl flex items-center justify-between">
          <BrandLogo variant="full" theme="mono" size="sm" />
          <Link href="/auth/register" className="font-body-md text-primary font-bold hover:underline">
            Get {BRAND_NAME}
          </Link>
        </div>

        <Card className="overflow-hidden border-0 bg-surface-container-lowest p-0 shadow-lg">
          <div className="bg-brand-gradient px-lg py-xl text-on-primary">
            <p className="font-label-md text-label-md font-bold uppercase tracking-widest text-white/70">Shared receipt</p>
            <h1 className="mt-sm font-headline-md text-headline-md font-black">{receipt.merchant || receipt.title}</h1>
            <p className="mt-md font-headline-lg text-headline-lg font-black">{receipt.amountFormatted}</p>
            <p className="mt-sm font-body-md text-white/80">{formatDate(receipt.transactionDate)}</p>
          </div>

          <div className="space-y-md p-lg">
            <DetailRow label="Type" value={receipt.type === 'DEBIT' ? 'Expense' : 'Income'} />
            {receipt.category ? <DetailRow label="Category" value={receipt.category} /> : null}
            {receipt.paymentType ? <DetailRow label="Payment" value={receipt.paymentType} /> : null}
            {receipt.groupName ? <DetailRow label="Group" value={receipt.groupName} /> : null}
            {receipt.notes ? <DetailRow label="Notes" value={receipt.notes} /> : null}

            {receipt.splits.length > 0 ? (
              <div>
                <p className="font-label-md text-label-md font-bold uppercase tracking-wide text-on-surface-variant">Split</p>
                <ul className="mt-sm space-y-xs">
                  {receipt.splits.map((split) => (
                    <li key={`${split.name}-${split.amountFormatted}`} className="flex justify-between font-body-md text-body-md">
                      <span>{split.name}</span>
                      <span className="font-mono-data text-mono-data font-bold">{split.amountFormatted}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="font-label-md text-label-md text-on-surface-variant">
              Shared by {data.sharedBy} · Expires {formatDate(data.expiresAt)}
            </p>
          </div>
        </Card>

        <div className="mt-lg grid grid-cols-1 gap-sm sm:grid-cols-3">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button className="w-full rounded-full bg-[#25D366] text-white hover:opacity-90">WhatsApp</Button>
          </a>
          <a href={smsHref}>
            <Button variant="secondary" className="w-full rounded-full">
              SMS
            </Button>
          </a>
          <Button
            variant="secondary"
            className="w-full rounded-full"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            Copy link
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-md border-b border-outline-variant/40 pb-sm last:border-0">
      <span className="font-label-md text-label-md font-bold uppercase tracking-wide text-on-surface-variant">{label}</span>
      <span className="text-right font-body-md text-body-md font-medium text-on-surface">{value}</span>
    </div>
  );
}
