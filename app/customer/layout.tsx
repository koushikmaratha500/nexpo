'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/customer', icon: 'dashboard' },
    { name: 'Transactions', path: '/customer/transactions', icon: 'receipt_long' },
    { name: 'Reports', path: '/customer/reports', icon: 'bar_chart' },
    { name: 'Settings', path: '/customer/settings', icon: 'settings' },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface-container-low p-4 gap-2 w-64 z-50">
        <div className="mb-6 px-2 py-4 border-b border-outline-variant/50 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-sm">corporate_fare</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-black text-primary leading-tight">Expensify Pro</h1>
            <p className="font-label-md text-[10px] text-on-surface-variant font-bold opacity-70">
              Corporate Tier
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 mt-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
              >
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                </div>
                <span className="font-body-md text-body-md">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-outline-variant pt-4 flex flex-col gap-1">
          <Link
            href="/customer/support"
            className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">help</span>
            </div>
            <span className="font-body-md text-body-md">Help Center</span>
          </Link>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            type="button"
            className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg text-left transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </div>
            <span className="font-body-md text-body-md">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Out Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-surface-container-low border-r border-outline-variant h-full flex flex-col p-4 gap-2 animate-in slide-in-from-left duration-200">
            <div className="mb-6 px-2 py-4 border-b border-outline-variant/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-sm">corporate_fare</span>
                </div>
                <div>
                  <h1 className="font-headline-sm text-headline-sm font-black text-primary leading-tight">Expensify Pro</h1>
                  <p className="font-label-md text-[10px] text-on-surface-variant font-bold">Client Hub</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-on-surface-variant hover:text-primary p-1 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-surface-container-high text-primary font-bold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                      }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                    </div>
                    <span className="font-body-md text-body-md">{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-outline-variant pt-4 flex flex-col gap-1">
              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                type="button"
                className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
                <span className="font-body-md text-body-md">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-y-auto pb-20 lg:pb-0">
        <Header
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          searchPlaceholder="Search personal ledger..."
        />
        <main className="flex-1 p-6 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navbar (Matches design spec) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-45 flex justify-around items-center px-4 py-2 pb-safe bg-surface-container-lowest border-t border-outline-variant shadow-2xl">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-transform active:scale-95 ${isActive
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
      {/* Floating "+" FAB */}
      <button
         onClick={() => router.push('/customer/transactions?openAdd=true')}
         className="fixed right-[50px] bottom-[50px] z-50 w-14 h-14 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer"
         title="Add Transaction"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>

      {/* Logout Confirmation Modal */}
      <Modal 
        isOpen={isLogoutConfirmOpen} 
        onClose={() => setIsLogoutConfirmOpen(false)} 
        title="Confirm Logout" 
        customHeader={true} 
        cardPadding="p-0" 
        maxWidth="max-w-md"
      >
        <div className="pt-xl px-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-error text-[32px]">warning</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm font-black">Confirm Logout</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
            Are you sure you want to log out of your session?
          </p>
        </div>
        <div className="p-lg bg-surface-container-low flex flex-col-reverse sm:flex-row gap-md sm:justify-end border-t border-outline-variant mt-lg">
          <button 
            type="button"
            className="px-xl h-11 flex items-center justify-center rounded-lg border border-outline text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-colors active:scale-95 duration-150 font-semibold cursor-pointer" 
            onClick={() => setIsLogoutConfirmOpen(false)}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="px-xl h-11 flex items-center justify-center rounded-lg bg-error text-on-error font-title-md text-title-md shadow-md hover:opacity-90 transition-all active:scale-95 duration-150 font-semibold cursor-pointer" 
            onClick={() => {
              setIsLogoutConfirmOpen(false);
              logout();
            }}
          >
            Logout
          </button>
        </div>
      </Modal>

    </div>
  );
}
