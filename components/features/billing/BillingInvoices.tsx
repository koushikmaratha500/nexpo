'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import { usePlan } from './PlanProvider';

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
  }, []);

  const download = async (id: string, invoiceNumber: string) => {
    try {
      const res = await axios.get<{ base64: string }>(`/api/user/billing/invoices/${id}`);
      const bytes = Uint8Array.from(atob(res.data.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
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
      <ul className="flex flex-col gap-1">
        {visibleInvoices.map((inv) => (
          <li
            key={inv.id}
            className={`flex ${compact || embedded ? 'flex-col gap-1' : 'flex-col sm:flex-row sm:items-center justify-between gap-2'} py-2 border-b border-outline-variant/30 last:border-0`}
          >
            <div>
              <p className={`font-medium text-on-surface ${compact || embedded ? 'text-sm' : ''}`}>{inv.invoiceNumber}</p>
              <p className="text-xs text-on-surface-variant">
                {inv.planLabel} · {inv.totalInr} · {new Date(inv.issuedAt).toLocaleDateString('en-IN')}
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
