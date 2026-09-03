'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAdminUserDetailPath } from '@/lib/navigation/userDetail';

export interface UserReference {
  id?: string | null;
  userId?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export function resolveUserId(user: UserReference): string | null {
  return user.id || user.userId || null;
}

export function formatUserLabel(user: UserReference, fallback = '—'): string {
  if (user.username) return `@${user.username}`;
  if (user.email) return user.email;
  const phone = user.phone || user.mobile;
  if (phone) return phone;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || fallback;
}

interface UserProfileLinkProps {
  user: UserReference;
  className?: string;
  linkClassName?: string;
  fallback?: string;
  /** auto: link only on /admin routes; always: always link when user id exists */
  mode?: 'auto' | 'always' | 'never';
  children?: React.ReactNode;
}

export function UserProfileLink({
  user,
  className,
  linkClassName = 'text-primary font-bold hover:underline',
  fallback = '—',
  mode = 'auto',
  children,
}: UserProfileLinkProps) {
  const pathname = usePathname();
  const userId = resolveUserId(user);
  const label = children ?? formatUserLabel(user, fallback);
  const shouldLink =
    Boolean(userId) &&
    mode !== 'never' &&
    (mode === 'always' || (mode === 'auto' && pathname.startsWith('/admin')));

  if (!shouldLink || !userId) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link href={getAdminUserDetailPath(userId)} className={`${linkClassName} ${className || ''}`.trim()}>
      {label}
    </Link>
  );
}
