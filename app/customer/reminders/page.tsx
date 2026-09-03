'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { PersonalRemindersPanel } from '@/components/features/reminders';
import { NotificationPreferencesCard } from '@/components/features/notifications';

export default function CustomerRemindersPage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">
            Personal Reminders
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-1">
            Schedule payment reminders for yourself. You&apos;ll get in-app and mobile alerts on the due date based on your
            notification preferences.
          </p>
        </div>
        <Link
          href="/customer/notifications"
          className="font-label-md font-bold text-primary hover:underline inline-flex items-center gap-1"
        >
          View notification inbox
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      <Card className="bg-primary-fixed/30 border border-primary/10 p-4 flex gap-3" glass={false}>
        <span className="material-symbols-outlined text-primary shrink-0">info</span>
        <div className="font-body-md text-on-surface-variant">
          <p>
            <strong className="text-on-surface">Personal reminders</strong> are only for you and appear here and on your
            dashboard.
          </p>
          <p className="mt-1">
            <strong className="text-on-surface">Group reminders</strong> are managed inside each group&apos;s Reminders tab
            and notify all members.
          </p>
        </div>
      </Card>

      <PersonalRemindersPanel />

      <NotificationPreferencesCard />
    </div>
  );
}
