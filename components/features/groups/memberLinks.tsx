'use client';

import type { GroupMemberItem } from './GroupMembersPanel';
import type { GroupBalanceMember } from './GroupTransactionsPanel';
import { UserProfileLink, type UserReference } from '@/components/features/users';

export function memberToUserRef(member: Pick<
  GroupMemberItem,
  'userId' | 'username' | 'firstName' | 'lastName' | 'email' | 'phone'
>): UserReference {
  return {
    userId: member.userId,
    username: member.username,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
  };
}

export function balanceMemberToUserRef(member: GroupBalanceMember): UserReference {
  return {
    userId: member.userId,
    username: member.username,
    firstName: member.firstName,
    lastName: member.lastName,
  };
}

export function MemberProfileLink({
  member,
  members,
  userId,
  className,
  fallback,
}: {
  member?: GroupMemberItem;
  members?: GroupMemberItem[];
  userId?: string;
  className?: string;
  fallback?: string;
}) {
  const resolved =
    member || (userId ? members?.find((row) => row.userId === userId) : undefined);
  const user: UserReference = resolved
    ? memberToUserRef(resolved)
    : {
        userId,
        firstName: userId?.slice(0, 8) || 'Unknown',
      };

  return <UserProfileLink user={user} className={className} fallback={fallback} />;
}
