'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Card } from '@/components/ui/Card';

interface UpcomingReminder {
  id: string;
  title: string;
  amount?: number | null;
  dueDate: string;
  status: string;
}

export function UpcomingReminders() {
  const [items, setItems] = useState<UpcomingReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await axios.get<{ items: UpcomingReminder[] }>('/api/user/reminders/upcoming');
        setItems(response.data.items || []);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card className="col-span-12 bg-surface-container-lowest flex flex-col gap-4" glass={false}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-title-md text-title-md font-bold text-primary">Upcoming reminders</h4>
          <p className="font-label-md text-on-surface-variant">Due in the next 7 days</p>
        </div>
        <Link href="/customer/reminders" className="font-label-md font-bold text-primary hover:underline">
          Manage
        </Link>
      </div>

      {isLoading ? (
        <p className="font-body-md text-on-surface-variant">Loading reminders...</p>
      ) : items.length === 0 ? (
        <p className="font-body-md text-on-surface-variant">No upcoming reminders this week.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/20 px-4 py-3"
            >
              <div>
                <p className="font-body-md font-bold text-on-surface">{item.title}</p>
                <p className="font-label-md text-on-surface-variant">
                  Due {new Date(item.dueDate).toLocaleDateString()}
                </p>
              </div>
              {item.amount != null && (
                <span className="font-title-sm font-bold text-primary">₹{Number(item.amount).toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
