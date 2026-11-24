'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import { usePlan } from './PlanProvider';
import { formatDate } from '@/lib/date';
import Link from 'next/link';
import { downloadInvoicePdf } from './downloadInvoice';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  planLabel: string;
  totalInr: string;
  issuedAt: string;
}

export function BillingInvoices({
  compact = false,
  embedded = false,
}: {
  compact?: boolean;
  embedded?: boolean;
}) {
  const { addToast } = useToast();
  const { plan } = usePlan();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<InvoiceRow[]>('/api/user/billing/invoices')
      .then((res) => setInvoices(res.data))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
    // A new payment issues a new invoice; refetch when the plan changes.
  }, [plan?.plan, plan?.status, plan?.billingInterval]);

  const download = async (id: string, invoiceNumber: string) => {
    try {
      await downloadInvoicePdf(id, invoiceNumber);
    } catch {
      addToast('Could not download invoice', 'error');
    }
  };

  if (plan?.pricingEnabled === false) return null;

  if (loading) {
    const loadingContent = <p className="text-sm text-on-surface-variant">Loading invoices…</p>;
    if (embedded) return loadingContent;
    return (
      <Card className={`bg-surface-container-lowest ${compact ? 'p-4' : ''}`} glass={false}>
        {loadingContent}
      </Card>
    );
  }

  if (invoices.length === 0) {
    return null;
  }

  const visibleInvoices = compact || embedded ? invoices.slice(0, 3) : invoices;

  const content = (
    <>
      <h3 className={`font-bold text-primary ${compact || embedded ? 'text-sm mb-2' : 'font-title-md mb-3'}`}>
        GST invoices
      </h3>
      <Link href="/customer/orders" className="text-xs font-semibold text-primary hover:underline">
        View all orders &amp; refunds
      </Link>
      <ul className="flex flex-col gap-1">
        {visibleInvoices.map((inv) => (
          <li
            key={inv.id}
            className={`flex ${compact || embedded ? 'flex-col gap-1' : 'flex-col sm:flex-row sm:items-center justify-between gap-2'} py-2 border-b border-outline-variant/30 last:border-0`}
          >
            <div>
              <p className={`font-medium text-on-surface ${compact || embedded ? 'text-sm' : ''}`}>{inv.invoiceNumber}</p>
              <p className="text-xs text-on-surface-variant">
                {inv.planLabel} · {inv.totalInr} · {formatDate(inv.issuedAt)}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline text-left"
              onClick={() => download(inv.id, inv.invoiceNumber)}
            >
              Download PDF
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) return content;

  return (
    <Card className={`bg-surface-container-lowest ${compact ? 'p-4' : ''}`} glass={false}>
      {content}
    </Card>
  );
}
