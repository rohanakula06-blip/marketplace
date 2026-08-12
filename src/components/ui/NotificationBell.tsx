'use client';

import { useEffect, useState } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.notifications.list();
      setNotifications(data.notifications as unknown as Notification[]);
    } catch { /* not logged in */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unread}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900">Notifications</h4>
              <div className="flex gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 flex items-center gap-1"><CheckCheck size={14} /> Mark all read</button>
                )}
                <button onClick={() => setOpen(false)}><X size={16} className="text-slate-400" /></button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">No notifications yet</p>
              ) : notifications.map((n) => (
                <div key={n.id} className={cn('px-4 py-3 border-b border-slate-50 hover:bg-slate-50', !n.isRead && 'bg-blue-50/50')}>
                  <p className="font-medium text-sm text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <Link href="/bookings" onClick={() => setOpen(false)} className="block text-center py-3 text-sm text-blue-600 font-medium hover:bg-slate-50">
              View all bookings →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
