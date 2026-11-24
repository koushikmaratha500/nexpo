'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/date';
import { usePlan } from './PlanProvider';
import { downloadInvoicePdf } from './downloadInvoice';

export type OrderStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface OrderRow {
  id: string;
  orderNumber: string;
  planLabel: string;
  recurring: boolean;
  provider: string;
  providerPaymentId: string;
  status: OrderStatus;
  subtotalPaise: number;
  taxPaise: number;
  amountPaise: number;
  refundedPaise: number;
  netPaidPaise: number;
  paidAt: string;
  refundedAt: string | null;
  invoice: { id: string; invoiceNumber: string; issuedAt: string } | null;
}

const STATUS_UI: Record<OrderStatus, { label: string; className: string; icon: string }> = {
  SUCCEEDED: { label: 'Paid', className: 'bg-green-100 text-green-800', icon: 'check_circle' },
  REFUNDED: { label: 'Refunded', className: 'bg-amber-100 text-amber-800', icon: 'undo' },
  PARTIALLY_REFUNDED: { label: 'Partially refunded', className: 'bg-amber-100 text-amber-800', icon: 'undo' },
  PENDING: { label: 'Pending', className: 'bg-surface-container-high text-on-surface-variant', icon: 'schedule' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800', icon: 'error' },
};

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const ui = STATUS_UI[status] ?? STATUS_UI.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${ui.className}`}>
      <span className="material-symbols-outlined text-[14px] leading-none">{ui.icon}</span>
      {ui.label}
    </span>
  );
}

function Row({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-outline-variant/30 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className={`text-sm text-right ${strong ? 'font-black text-on-surface' : 'font-semibold text-on-surface'}`}>{value}</span>
    </div>
  );
}

export function OrdersPanel() {
  const { addToast } = useToast();
  const { plan } = usePlan();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrderRow | null>(null);

  useEffect(() => {
    axios
      .get<OrderRow[]>('/api/user/billing/orders')
      .then((res) => setOrders(res.data))
      .catch(() => {
        setOrders([]);
        addToast('Could not load your orders', 'error');
      })
      .finally(() => setLoading(false));
    // Refetch when the plan changes (new purchase or a refund ending a plan).
  }, [addToast, plan?.plan, plan?.status, plan?.billingInterval]);

  const download = async (order: OrderRow) => {
    if (!order.invoice) return;
    try {
      await downloadInvoicePdf(order.invoice.id, order.invoice.invoiceNumber);
    } catch {
      addToast('Could not download invoice', 'error');
    }
  };

  if (loading) {
    return (
      <Card className="bg-surface-container-lowest" glass={false}>
        <p className="text-sm text-on-surface-variant">Loading orders…</p>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-surface-container-lowest flex flex-col items-center text-center gap-2 py-12" glass={false}>
        <span className="material-symbols-outlined text-4xl text-primary">receipt_long</span>
        <h3 className="font-title-md font-bold text-on-surface">No orders yet</h3>
        <p className="text-sm text-on-surface-variant max-w-sm">
          When you buy a plan, the order, its GST invoice and any refund will show up here.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <ul className="divide-y divide-outline-variant/30">
          {orders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelected(order)}
                className="w-full text-left px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-primary bg-primary-container/30 rounded-xl p-2 shrink-0">
                    {order.recurring ? 'autorenew' : 'workspace_premium'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface truncate">{order.planLabel}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {order.orderNumber} · {formatDate(order.paidAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <StatusBadge status={order.status} />
                  <div className="text-right">
                    <p className="font-black text-on-surface">{formatPaise(order.amountPaise)}</p>
                    {order.refundedPaise > 0 && (
                      <p className="text-xs text-amber-700">−{formatPaise(order.refundedPaise)} refunded</p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant hidden sm:inline">chevron_right</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Order details"
        subtitle={selected ? selected.orderNumber : undefined}
        maxWidth="max-w-lg"
      >
        {selected && (
          <div className="p-lg flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-headline-sm font-black text-on-surface">{selected.planLabel}</p>
                <p className="text-sm text-on-surface-variant">
                  {selected.recurring ? 'Subscription payment' : 'One-time purchase'} · Paid {formatDate(selected.paidAt)}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="rounded-xl border border-outline-variant/50 px-4 py-1">
              <Row label="Plan price" value={formatPaise(selected.subtotalPaise)} />
              <Row label="GST" value={formatPaise(selected.taxPaise)} />
              <Row label="Total paid" value={formatPaise(selected.amountPaise)} strong />
              {selected.refundedPaise > 0 && (
                <>
                  <Row
                    label={`Refunded${selected.refundedAt ? ` on ${formatDate(selected.refundedAt)}` : ''}`}
                    value={<span className="text-amber-700">−{formatPaise(selected.refundedPaise)}</span>}
                  />
                  <Row label="Net paid" value={formatPaise(selected.netPaidPaise)} strong />
                </>
              )}
            </div>

            <div className="rounded-xl bg-surface-container-low px-4 py-1">
              <Row label="Payment method" value={selected.provider === 'razorpay' ? 'Razorpay' : 'Stripe'} />
              <Row label="Payment ID" value={<span className="font-mono text-xs">{selected.providerPaymentId}</span>} />
              {selected.invoice && <Row label="Invoice" value={selected.invoice.invoiceNumber} />}
            </div>

            {(selected.status === 'REFUNDED' || selected.status === 'PARTIALLY_REFUNDED') && (
              <p className="text-sm text-on-surface-variant flex gap-2">
                <span className="material-symbols-outlined text-amber-700 text-base">info</span>
                Refunds go back to your original payment method. Banks usually credit them within 5–7 working days.
                {selected.status === 'REFUNDED' && ' The plan from this order is no longer active.'}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {selected.invoice && (
                <button
                  type="button"
                  onClick={() => download(selected)}
                  className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-bold inline-flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Download invoice
                </button>
              )}
              <a
                href="/customer/support"
                className="flex-1 h-11 rounded-lg bg-surface-container-high text-on-surface font-semibold inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                Need help with this order?
              </a>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
