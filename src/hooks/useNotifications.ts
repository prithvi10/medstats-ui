import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { count } = await api.notifications.unreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore polling errors
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n) => !n.is_read).length);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (open) {
      refreshNotifications();
    }
  }, [open, refreshNotifications]);

  const markRead = useCallback(async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    open,
    setOpen,
    markRead,
    markAllRead,
    refreshNotifications,
  };
}
