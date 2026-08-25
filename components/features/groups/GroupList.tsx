'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export interface GroupListItem {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  myRole: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

interface GroupListProps {
  groups: GroupListItem[];
  isLoading?: boolean;
  searchQuery?: string;
}

function groupInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Created today';
  if (diffDays === 1) return 'Created yesterday';
  if (diffDays < 30) return `Created ${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function GroupList({ groups, isLoading = false, searchQuery = '' }: GroupListProps) {
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        (group.description?.toLowerCase().includes(query) ?? false),
    );
  }, [groups, searchQuery]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="bg-surface-container-lowest p-5 animate-pulse" glass={false}>
            <div className="h-12 w-12 rounded-2xl bg-surface-container-low mb-4" />
            <div className="h-5 w-2/3 rounded bg-surface-container-low mb-2" />
            <div className="h-4 w-full rounded bg-surface-container-low" />
          </Card>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="bg-surface-container-lowest py-16 px-6 text-center flex flex-col items-center gap-4" glass={false}>
        <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">groups</span>
        </div>
        <div>
          <h3 className="font-title-md text-title-md font-bold text-primary">No groups yet</h3>
          <p className="font-body-md text-on-surface-variant mt-2 max-w-md mx-auto">
            Create a group for roommates, trips, or teams. Group expenses stay separate from your personal ledger.
          </p>
        </div>
      </Card>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <Card className="bg-surface-container-lowest py-12 px-6 text-center" glass={false}>
        <p className="font-body-md text-on-surface-variant">
          No groups match &ldquo;{searchQuery.trim()}&rdquo;.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredGroups.map((group) => (
        <Link key={group.id} href={`/customer/groups/${group.id}`} className="group block">
          <Card
            className="bg-surface-container-lowest h-full p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 border border-transparent"
            glass={false}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-title-sm font-black">
                {groupInitials(group.name) || 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-title-md text-title-md font-bold text-primary truncate group-hover:underline">
                    {group.name}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      group.myRole === 'ADMIN'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {group.myRole === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>
                </div>
                <p className="font-body-md text-on-surface-variant mt-1 line-clamp-2 min-h-[2.5rem]">
                  {group.description || 'Shared expenses and balances for this group.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
              <div className="flex items-center gap-3 text-label-md text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">group</span>
                  {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {formatRelativeDate(group.createdAt)}
                </span>
              </div>
              <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                arrow_forward
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
