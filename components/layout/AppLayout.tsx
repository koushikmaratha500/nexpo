'use client';

import React, { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { SidebarNav, NavLink } from '@/components/layout/SidebarNav';
import { LogoutConfirmModal } from '@/components/layout/LogoutConfirmModal';

export interface AppLayoutProps {
  children: React.ReactNode;
  navLinks: NavLink[];
  appTitle: string;
  appSubtitle: string;
  roleLabel: string;
  searchPlaceholder?: string;
  showHelpCenter?: boolean;
  showFab?: boolean;
  fabLabel?: string;
  fabIcon?: string;
  bottomNavCount?: number;
  fabHref?: string;
  onFabClick?: () => void;
  onLogout: () => void;
}

export function AppLayout({
  children,
  navLinks,
  appTitle,
  appSubtitle,
  roleLabel,
  searchPlaceholder = 'Search data...',
  showHelpCenter = true,
  showFab = false,
  fabLabel,
  fabIcon = 'add',
  bottomNavCount,
  onFabClick,
  onLogout,
}: AppLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogoutConfirm = useCallback(() => {
    setIsLogoutConfirmOpen(false);
    onLogout();
  }, [onLogout]);

  const bottomNavLinks = bottomNavCount ? navLinks.slice(0, bottomNavCount) : navLinks;

  return (
    <div className="min-h-screen bg-background text-on-background flex overflow-hidden">
      {/* Shared SidebarNav (desktop + mobile drawer) */}
      <SidebarNav
        navLinks={navLinks}
        roleLabel={roleLabel}
        appTitle={appTitle}
        appSubtitle={appSubtitle}
        showHelpCenter={showHelpCenter}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        onLogoutClick={() => {
          setIsMobileMenuOpen(false);
          setIsLogoutConfirmOpen(true);
        }}
        onLinkClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-y-auto pb-20 lg:pb-0">
        <Header
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          searchPlaceholder={searchPlaceholder}
        />
        <main className="flex-1 p-6 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navbar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-2 pb-safe bg-surface-container-lowest border-t border-outline-variant shadow-2xl">
        {bottomNavLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-transform active:scale-95 ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              <span className="text-[10px] font-label-md mt-1">{link.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Optional Floating Action Button */}
      {showFab && (
        <button
          onClick={onFabClick}
          className="fixed right-[50px] bottom-[50px] z-50 w-14 h-14 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer"
          title={fabLabel || 'Add'}
        >
          <span className="material-symbols-outlined text-[32px]">{fabIcon}</span>
        </button>
      )}

      {/* Shared Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
