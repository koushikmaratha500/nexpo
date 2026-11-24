'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';
import { OneSignalProvider } from '@/components/features/notifications';
import { PlanBanner, PlanProvider, UpgradeWall, usePlan } from '@/components/features/billing';
import { CustomerPresenceHeartbeat } from '@/components/features/presence';
import { AiChatHistoryMenu } from '@/components/features/assistant';
import type { NavLink } from '@/components/layout/SidebarNav';

const CUSTOMER_NAV_LINKS: NavLink[] = [
  { name: 'Dashboard', path: '/customer', icon: 'dashboard' },
  { name: 'Transactions', path: '/customer/transactions', icon: 'receipt_long' },
  { name: 'Groups', path: '/customer/groups', icon: 'groups' },
  { name: 'Reminders', path: '/customer/reminders', icon: 'notifications_active' },
  {
    name: 'AI Assistant',
    path: '/customer/assistant',
    icon: 'smart_toy',
    renderSubMenu: (onNavigate) => <AiChatHistoryMenu onNavigate={onNavigate} />,
  },
  { name: 'Settings', path: '/customer/settings', icon: 'settings' },
];

/** Phone bottom tabs, matching the native app; Groups and Reminders stay in the menu. */
const CUSTOMER_PHONE_TABS = [
  { name: 'Home', path: '/customer', icon: 'home' },
  { name: 'Expenses', path: '/customer/transactions', icon: 'receipt_long' },
  { name: 'AI Assistant', path: '/customer/assistant', icon: 'smart_toy' },
  { name: 'Profile', path: '/customer/settings', icon: 'person' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OneSignalProvider>
      <Suspense fallback={null}>
        <PlanProvider>
          <CustomerShell>{children}</CustomerShell>
        </PlanProvider>
      </Suspense>
    </OneSignalProvider>
  );
}

function CustomerShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const { plan } = usePlan();

  const handleFabClick = () => {
    router.push('/customer/transactions?openAdd=true');
  };

  return (
      <AppLayout
        navLinks={CUSTOMER_NAV_LINKS}
        phoneNavLinks={CUSTOMER_PHONE_TABS}
        appTitle="PaysaSuchan"
        appSubtitle="Personal & Group Ledger"
        roleLabel="Customer Hub"
        searchPlaceholder="Search personal ledger..."
        showNotifications
        showFab={!plan?.writesLocked}
        fabLabel="Add Transaction"
        fabIcon="add"
        fabHref="/customer/transactions"
        onFabClick={handleFabClick}
        onLogout={logout}
      >
        <CustomerPresenceHeartbeat />
        <PlanBanner />
        {children}
        <UpgradeWall />
      </AppLayout>
  );
}
