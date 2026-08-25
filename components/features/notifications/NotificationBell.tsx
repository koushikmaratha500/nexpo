'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ items: NotificationItem[]; unreadCount: number }>(
        '/api/user/notifications?pageSize=8',
      );
      setItems(response.data.items || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch {
      // Silent in header — user may not be authenticated yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    try {
      await axios.patch(`/api/user/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      addToast('Failed to mark notification as read', 'error');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post('/api/user/notifications/read-all');
      setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      addToast('Failed to mark all as read', 'error');
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all duration-200 cursor-pointer"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-md">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[90vw] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
            <p className="font-title-sm font-bold text-primary">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-label-md font-bold text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-on-surface-variant font-body-md">Loading...</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-on-surface-variant font-body-md">No notifications yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.readAt) markRead(item.id);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${
                    item.readAt ? 'opacity-70' : 'bg-primary/5'
                  }`}
                >
                  <p className="font-label-md font-bold text-primary">{item.title}</p>
                  <p className="font-body-md text-on-surface-variant mt-1">{item.body}</p>
                  <p className="font-label-md text-on-surface-variant/70 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-outline-variant/20">
            <Link
              href="/customer/notifications"
              className="font-label-md font-bold text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
