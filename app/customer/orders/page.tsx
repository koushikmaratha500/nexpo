'use client';

import React from 'react';
import { OrdersPanel } from '@/components/features/billing';

export default function CustomerOrdersPage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="border-b border-outline-variant/30 pb-6">
        <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Orders &amp; invoices</h2>
        <p className="font-body-lg text-on-surface-variant mt-1">
          Every plan purchase with its GST invoice, payment details and refund status.
        </p>
      </div>
      <OrdersPanel />
    </div>
  );
}
