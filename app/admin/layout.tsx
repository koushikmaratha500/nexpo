'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';

const ADMIN_NAV_LINKS = [
  { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
  { name: 'Customers', path: '/admin/users', icon: 'group' },
  { name: 'Administrators', path: '/admin/admins', icon: 'shield_person' },
  { name: 'Categories', path: '/admin/categories', icon: 'category' },
  { name: 'Reports', path: '/admin/reports', icon: 'assessment' },
  { name: 'Settings', path: '/admin/settings', icon: 'settings' },
];

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-primary">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="font-label-md font-bold uppercase tracking-wider animate-pulse">Checking Admin Session...</p>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  // Public admin auth pages render without the admin shell
  const isPublicAuthPage =
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/forgot-password') ||
    pathname.startsWith('/admin/reset-password');

  if (isPublicAuthPage) {
    return <>{children}</>;
  }

  // Gate admin pages: show loading while checking session, render null (redirect handled by AuthContext) if not an admin.
  if (isLoading) {
    return <AdminLoadingFallback />;
  }

  if (!user || user.role !== 'ADMIN') {
    return null; // useEffect in AuthContext will redirect to /admin/login
  }

  return (
    <AppLayout
      navLinks={ADMIN_NAV_LINKS}
      appTitle="Corporate Pro Ledger"
      appSubtitle="Administrative Hub"
      roleLabel="Admin Hub"
      searchPlaceholder="Search governance details..."
      bottomNavCount={5}
      onLogout={logout}
    >
      {children}
    </AppLayout>
  );
}
