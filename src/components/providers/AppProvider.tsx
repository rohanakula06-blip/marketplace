'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { AuthModals } from '@/components/modals/AuthModals';
import { BookingModal } from '@/components/modals/BookingModal';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { WorkerProfileModal } from '@/components/modals/WorkerProfileModal';
import { MessageModal } from '@/components/modals/MessageModal';
import { InfoModal } from '@/components/modals/InfoModal';
import { Wifi, WifiOff } from 'lucide-react';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const { largeText, reducedMotion, showToast, setCoords } = useUIStore();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Check backend + restore session on load
  useEffect(() => {
    async function init() {
      try {
        const health = await api.health();
        if (health.status === 'ok') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch {
        setBackendStatus('error');
        const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        showToast(
          isLocal
            ? 'Backend unavailable. Start the server with npm run dev'
            : 'Database not connected. Set DATABASE_URL and JWT_SECRET in Vercel, then redeploy.',
          'error'
        );
      }

      try {
        const { user: sessionUser } = await api.auth.me();
        if (sessionUser) {
          setUser(sessionUser as unknown as Parameters<typeof setUser>[0]);
          try {
            const loc = await api.location.get();
            if (loc.latitude && loc.longitude) {
              setCoords(loc.latitude, loc.longitude, loc.location);
            }
          } catch {
            // guest user — no location in DB
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    }
    init();
  }, [setUser, setAuthReady, setCoords, showToast]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }, [largeText, reducedMotion]);

  return (
    <>
      {backendStatus === 'connected' && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
          <Wifi size={12} />
          Backend connected · Database live
        </div>
      )}
      {backendStatus === 'error' && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded-full border border-red-200 shadow-sm">
          <WifiOff size={12} />
          Backend disconnected
        </div>
      )}
      {children}
      <Toast />
      <AuthModals />
      <BookingModal />
      <PaymentModal />
      <WorkerProfileModal />
      <MessageModal />
      <InfoModal />
    </>
  );
}
