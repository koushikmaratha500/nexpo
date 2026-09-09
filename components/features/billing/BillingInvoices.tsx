'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  planLabel: string;
  totalInr: string;
  issuedAt: string;
}

export function BillingInvoices() {
  const { addToast } = useToast();
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

  if (loading) {
    return (
      <Card className="bg-surface-container-lowest" glass={false}>
        <p className="text-sm text-on-surface-variant">Loading invoices…</p>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return null;
  }

  return (
    <Card className="bg-surface-container-lowest" glass={false}>
      <h3 className="font-title-md font-bold text-primary mb-3">GST invoices</h3>
      <ul className="flex flex-col gap-2">
        {invoices.map((inv) => (
          <li
            key={inv.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-outline-variant/30 last:border-0"
          >
            <div>
              <p className="font-medium text-on-surface">{inv.invoiceNumber}</p>
              <p className="text-sm text-on-surface-variant">
                {inv.planLabel} · {inv.totalInr} · {new Date(inv.issuedAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => download(inv.id, inv.invoiceNumber)}
            >
              Download PDF
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
