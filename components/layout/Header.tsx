'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';

interface HeaderProps {
  onMenuToggle?: () => void;
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
}

export function Header({
  onMenuToggle,
  searchPlaceholder = 'Search data...',
  onSearchChange
}: HeaderProps) {
  const { user } = useAuth();

  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '';
  const initials = user ? (user.firstName?.[0] || '') + (user.lastName?.[0] || '') : '';

  return (
    <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40 bg-surface border-b border-outline-variant">
      {/* Search / Mobile Menu */}
      <div className="flex items-center gap-4 flex-1">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1 text-primary hover:bg-surface-container-low rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-md">menu</span>
          </button>
        )}
        <div className="relative w-full max-w-md focus-within:ring-2 ring-primary/10 rounded-lg transition-all">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg font-body-md text-body-md focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/50 text-on-surface"
            placeholder={searchPlaceholder}
            type="text"
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>

      {/* Action Items */}
      <div className="flex items-center gap-6">

        {/* Notifications & Help (Hidden per user request) */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-px bg-outline-variant mx-2 hidden sm:block"></div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={fullName}
                  className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center text-xs">
                  {initials}
                </div>
              )}

              <div className="text-left hidden sm:block">
                <p className="font-title-md text-label-md font-bold leading-none text-on-surface">{fullName}</p>
                <p className="font-label-md text-[10px] text-on-surface-variant mt-1 capitalize">
                  {user.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
