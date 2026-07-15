import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ClipboardCheck, PlayCircle, CheckCircle2, Inbox } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationIcon(type: Notification['type']) {
  switch (type) {
    case 'review_requested':
      return Inbox;
    case 'review_started':
      return PlayCircle;
    case 'review_completed':
      return ClipboardCheck;
    case 'approved':
      return CheckCircle2;
    default:
      return Bell;
  }
}

function notificationHref(
  notification: Notification,
  role: string | undefined
): string | null {
  if (!notification.submission_id) return null;
  if (role === 'professor') {
    return `/professor/submissions/${notification.submission_id}`;
  }
  return `/analysis/${notification.submission_id}`;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    open,
    setOpen,
    markRead,
    markAllRead,
  } = useNotifications();

  const handleClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    const href = notificationHref(notification, user?.role);
    if (href) {
      navigate(href);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</p>
              ) : (
                notifications.map((notification) => {
                  const Icon = notificationIcon(notification.type);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleClick(notification)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                        !notification.is_read && 'bg-brand-50/40'
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 text-brand-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="mt-1 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
