'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { UserProfileLink } from '@/components/features/users';

export interface AdminGroupListItem {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string;
    email?: string | null;
  };
}

interface AdminGroupListProps {
  groups: AdminGroupListItem[];
  isLoading?: boolean;
}

function groupInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AdminGroupList({ groups, isLoading = false }: AdminGroupListProps) {
  if (isLoading) {
    return <div className="py-12 text-center text-on-surface-variant">Loading groups...</div>;
  }

  if (groups.length === 0) {
    return (
      <Card className="bg-surface-container-lowest py-16 px-6 text-center" glass={false}>
        <p className="font-body-md text-on-surface-variant">No groups found.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map((group) => (
        <Link key={group.id} href={`/admin/groups/${group.id}`} className="group block">
          <Card
            className="bg-surface-container-lowest h-full p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 border border-transparent"
            glass={false}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-title-sm font-black">
                {groupInitials(group.name) || 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-title-md text-title-md font-bold text-primary truncate group-hover:underline">
                  {group.name}
                </h3>
                <p className="font-body-md text-on-surface-variant mt-1 line-clamp-2">
                  {group.description || 'No description provided.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/20 text-label-md text-on-surface-variant">
              <span>{group.memberCount} member{group.memberCount === 1 ? '' : 's'}</span>
              <span>
                By{' '}
                <UserProfileLink user={group.createdBy} mode="always" />
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
