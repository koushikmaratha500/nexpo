'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import axios from 'axios';

interface BillingOverview {
  totalRevenueInr: string;
  totalRevenuePaise: number;
  mrrEstimateInr: string;
  paymentCount: number;
  activeSubscriptions: number;
  planCounts: Record<string, number>;
  planStatusCounts: Record<string, number>;
  recentPayments: Array<{
    id: string;
    amountInr: string;
    sku: string;
    provider: string;
    createdAt: string;
    invoiceNumber: string | null;
    user: { id: string; firstName: string; lastName: string | null; email: string | null };
  }>;
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    axios
      .get<BillingOverview>('/api/admin/billing/overview')
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(
          axios.isAxiosError(err) && err.response?.data?.error
            ? String(err.response.data.error)
            : 'Failed to load billing overview',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-on-surface-variant">Loading billing overview…</p>;
  }

  if (error) {
    return <p className="text-error">{error}</p>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="border-b border-outline-variant/30 pb-6">
        <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">
          Billing & Revenue
        </h2>
        <p className="font-body-lg text-on-surface-variant mt-1">
          GST-inclusive payments, plan mix, and recent checkout activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glass={false} className="bg-surface-container-lowest p-4">
          <p className="text-xs uppercase font-bold text-on-surface-variant">Total revenue</p>
          <p className="text-2xl font-black text-primary mt-1">{data.totalRevenueInr}</p>
          <p className="text-sm text-on-surface-variant">{data.paymentCount} payments</p>
        </Card>
        <Card glass={false} className="bg-surface-container-lowest p-4">
          <p className="text-xs uppercase font-bold text-on-surface-variant">MRR estimate</p>
          <p className="text-2xl font-black text-primary mt-1">{data.mrrEstimateInr}</p>
          <p className="text-sm text-on-surface-variant">Active Starter subs</p>
        </Card>
        <Card glass={false} className="bg-surface-container-lowest p-4">
          <p className="text-xs uppercase font-bold text-on-surface-variant">Active subscriptions</p>
          <p className="text-2xl font-black text-primary mt-1">{data.activeSubscriptions}</p>
        </Card>
        <Card glass={false} className="bg-surface-container-lowest p-4">
          <p className="text-xs uppercase font-bold text-on-surface-variant">Pro lifetime</p>
          <p className="text-2xl font-black text-primary mt-1">{data.planCounts.PRO ?? 0}</p>
          <p className="text-sm text-on-surface-variant">Starter: {data.planCounts.STARTER ?? 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card glass={false} className="bg-surface-container-lowest p-4">
          <h3 className="font-title-md font-bold text-primary mb-3">Plan mix</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(data.planCounts).map(([plan, count]) => (
              <li key={plan} className="flex justify-between">
                <span>{plan}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card glass={false} className="bg-surface-container-lowest p-4">
          <h3 className="font-title-md font-bold text-primary mb-3">Plan status</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(data.planStatusCounts).map(([status, count]) => (
              <li key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card glass={false} className="bg-surface-container-lowest p-4 overflow-x-auto">
        <h3 className="font-title-md font-bold text-primary mb-3">Recent payments</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-on-surface-variant">
                  No payments yet.
                </TableCell>
              </TableRow>
            ) : (
              data.recentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    {[payment.user.firstName, payment.user.lastName].filter(Boolean).join(' ')}
                    <br />
                    <span className="text-xs text-on-surface-variant">{payment.user.email}</span>
                  </TableCell>
                  <TableCell>{payment.sku}</TableCell>
                  <TableCell>{payment.amountInr}</TableCell>
                  <TableCell>{payment.provider}</TableCell>
                  <TableCell>{payment.invoiceNumber ?? '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
