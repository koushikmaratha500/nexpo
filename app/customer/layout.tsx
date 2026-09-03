'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';
import { OneSignalProvider } from '@/components/features/notifications';

const CUSTOMER_NAV_LINKS = [
  { name: 'Dashboard', path: '/customer', icon: 'dashboard' },
  { name: 'Transactions', path: '/customer/transactions', icon: 'receipt_long' },
  { name: 'Groups', path: '/customer/groups', icon: 'groups' },
  { name: 'Reminders', path: '/customer/reminders', icon: 'notifications_active' },
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
    <OneSignalProvider>
      <AppLayout
        navLinks={CUSTOMER_NAV_LINKS}
        appTitle="PaysaSuchan"
        appSubtitle="Personal & Group Ledger"
        roleLabel="Customer Hub"
        searchPlaceholder="Search personal ledger..."
        showNotifications
        showFab
        fabLabel="Add Transaction"
        fabIcon="add"
        fabHref="/customer/transactions"
        onFabClick={handleFabClick}
        onLogout={logout}
      >
        {children}
      </AppLayout>
    </OneSignalProvider>
  );
}
