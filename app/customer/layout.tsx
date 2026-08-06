'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';

const CUSTOMER_NAV_LINKS = [
  { name: 'Dashboard', path: '/customer', icon: 'dashboard' },
  { name: 'Transactions', path: '/customer/transactions', icon: 'receipt_long' },
  { name: 'Reports', path: '/customer/reports', icon: 'bar_chart' },
  { name: 'AI Assistant', path: '/customer/assistant', icon: 'smart_toy' },
  { name: 'Settings', path: '/customer/settings', icon: 'settings' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleFabClick = () => {
    router.push('/customer/transactions?openAdd=true');
  };

  return (
    <AppLayout
      navLinks={CUSTOMER_NAV_LINKS}
      appTitle="Expensify Pro"
      appSubtitle="Corporate Tier"
      roleLabel="Customer Hub"
      searchPlaceholder="Search personal ledger..."
      showFab
      fabLabel="Add Transaction"
      fabIcon="add"
      fabHref="/customer/transactions"
      onFabClick={handleFabClick}
      onLogout={logout}
    >
      {children}
    </AppLayout>
  );
}
