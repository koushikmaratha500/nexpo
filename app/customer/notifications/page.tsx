'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export default function CustomerNotificationsPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ items: NotificationItem[]; unreadCount: number }>(
        '/api/user/notifications?pageSize=50',
      );
      setItems(response.data.items || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch {
      addToast('Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    await axios.patch(`/api/user/notifications/${id}/read`);
    await loadNotifications();
  };

  const markAllRead = async () => {
    await axios.post('/api/user/notifications/read-all');
    await loadNotifications();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">
            Notifications
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-1">
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant">Loading notifications...</p>
      ) : items.length === 0 ? (
        <Card className="bg-surface-container-lowest p-8 text-center" glass={false}>
          <p className="text-on-surface-variant">Your inbox is empty.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`bg-surface-container-lowest p-4 ${item.readAt ? 'opacity-75' : 'border-primary/20'}`}
              glass={false}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-title-md font-bold text-primary">{item.title}</h3>
                  <p className="font-body-md text-on-surface-variant mt-1">{item.body}</p>
                  <p className="font-label-md text-on-surface-variant/70 mt-2">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                {!item.readAt && (
                  <Button variant="secondary" onClick={() => markRead(item.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
