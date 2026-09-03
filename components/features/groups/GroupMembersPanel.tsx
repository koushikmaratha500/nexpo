'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserProfileLink } from '@/components/features/users';
import { memberToUserRef } from './memberLinks';

export interface GroupMemberItem {
  memberId: string;
  userId: string;
  username?: string | null;
  firstName: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface GroupMembersPanelProps {
  members: GroupMemberItem[];
  readOnly?: boolean;
  myRole?: 'ADMIN' | 'MEMBER';
  currentUserEmail?: string;
  currentUserUsername?: string;
  onInvite?: (payload: { username?: string; email?: string; phone?: string }) => Promise<void>;
  onPromote?: (memberId: string) => Promise<void>;
  onRemove?: (memberId: string) => Promise<void>;
}

export function GroupMembersPanel({
  members,
  readOnly = false,
  myRole = 'MEMBER',
  currentUserEmail,
  currentUserUsername,
  onInvite,
  onPromote,
  onRemove,
}: GroupMembersPanelProps) {
  const [inviteMode, setInviteMode] = useState<'username' | 'email' | 'phone'>('username');
  const [inviteValue, setInviteValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onInvite) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onInvite({
        ...(inviteMode === 'username' ? { username: inviteValue.trim() } : {}),
        ...(inviteMode === 'email' ? { email: inviteValue.trim() } : {}),
        ...(inviteMode === 'phone' ? { phone: inviteValue.trim() } : {}),
      });
      setInviteValue('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && myRole === 'ADMIN' && onInvite && (
        <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
          <div>
            <h3 className="font-title-md text-title-md font-bold text-primary">Invite Member</h3>
            <p className="font-label-md text-on-surface-variant mt-1">
              Add someone by username, email, or phone. Existing users join immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['username', 'email', 'phone'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInviteMode(mode)}
                className={`px-3 py-1.5 rounded-full text-label-md font-bold ${
                  inviteMode === mode
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={inviteValue}
              onChange={(e) => setInviteValue(e.target.value)}
              placeholder={
                inviteMode === 'username'
                  ? 'jane_doe'
                  : inviteMode === 'email'
                    ? 'jane@example.com'
                    : '+919876543210'
              }
              className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting...' : 'Send Invite'}
            </Button>
          </form>
          {errorMsg && <p className="text-error text-body-md">{errorMsg}</p>}
        </Card>
      )}

      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="px-6 py-4 border-b border-outline-variant/30">
          <h3 className="font-title-md text-title-md font-bold text-primary">Members</h3>
        </div>
        <div className="divide-y divide-outline-variant/20">
          {members.map((member) => {
            const isSelf =
              (currentUserEmail && member.email === currentUserEmail) ||
              (currentUserUsername && member.username === currentUserUsername);
            return (
              <div key={member.memberId} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-body-md font-bold text-primary">
                    <UserProfileLink
                      user={memberToUserRef(member)}
                      linkClassName="text-primary font-bold hover:underline"
                    >
                      {`${member.firstName}${member.lastName ? ` ${member.lastName}` : ''}`.trim()}
                    </UserProfileLink>
                    {isSelf ? ' (You)' : ''}
                  </p>
                  <p className="font-label-md text-on-surface-variant">
                    {member.username ? (
                      <>
                        <UserProfileLink user={{ userId: member.userId, username: member.username }} />
                        {(member.email || member.phone) && ' · '}
                      </>
                    ) : null}
                    {member.email ? (
                      <UserProfileLink user={{ userId: member.userId, email: member.email }} />
                    ) : member.phone ? (
                      <UserProfileLink user={{ userId: member.userId, phone: member.phone }} />
                    ) : !member.username ? (
                      'No contact'
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-[11px] font-bold uppercase bg-secondary-container/20 text-on-secondary-container">
                    {member.role}
                  </span>
                  {!readOnly && myRole === 'ADMIN' && member.role === 'MEMBER' && onPromote && (
                    <Button type="button" variant="secondary" onClick={() => onPromote(member.memberId)}>
                      Promote
                    </Button>
                  )}
                  {!readOnly && (myRole === 'ADMIN' || isSelf) && onRemove && (
                    <Button type="button" variant="secondary" onClick={() => onRemove(member.memberId)}>
                      {isSelf ? 'Leave' : 'Remove'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
