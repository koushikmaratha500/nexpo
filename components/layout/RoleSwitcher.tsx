'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Read the environment variable
  const showHelper = process.env.NEXT_PUBLIC_SHOW_TESTING_HELPER === 'true';

  if (!showHelper || !user) return null;

  return (
    <div className="fixed bottom-20 right-6 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end gap-2 select-none font-body-md">
      {isOpen && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-4 flex flex-col gap-1 w-48 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider px-2 py-1">
            Testing Role Switcher
          </p>
          <div className="h-px bg-outline-variant mb-1"></div>
          <button
            onClick={() => {
              switchRole('ADMIN');
              setIsOpen(false);
            }}
            className={`flex items-center justify-between px-4 py-2 rounded-lg text-left transition-colors font-body-md ${
              user.role === 'ADMIN'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span>Administrator</span>
            {user.role === 'ADMIN' && <span className="material-symbols-outlined text-sm">check</span>}
          </button>
          <button
            onClick={() => {
              switchRole('CUSTOMER');
              setIsOpen(false);
            }}
            className={`flex items-center justify-between px-4 py-2 rounded-lg text-left transition-colors font-body-md ${
              user.role === 'CUSTOMER'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span>Customer / User</span>
            {user.role === 'CUSTOMER' && <span className="material-symbols-outlined text-sm">check</span>}
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-outline-variant"
        title="Switch user role"
      >
        <span className="material-symbols-outlined">published_with_changes</span>
      </button>
    </div>
  );
}
