'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { requestLiveLocation, resetLocationState, bootstrapLocationFromProfile } from '@/lib/location-service';
import { Toast } from '@/components/ui/Toast';
import { AuthModals } from '@/components/modals/AuthModals';
import { BookingModal } from '@/components/modals/BookingModal';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { WorkerProfileModal } from '@/components/modals/WorkerProfileModal';
import { MessageModal } from '@/components/modals/MessageModal';
import { ReviewModal } from '@/components/modals/ReviewModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { InfoModal } from '@/components/modals/InfoModal';
import { Wifi, WifiOff } from 'lucide-react';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const { largeText, reducedMotion, showToast, language } = useUIStore();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [uiHydrated, setUiHydrated] = useState(false);

  useEffect(() => {
    if (useUIStore.persist.hasHydrated()) {
      setUiHydrated(true);
      return;
    }
    return useUIStore.persist.onFinishHydration(() => setUiHydrated(true));
  }, []);

  useEffect(() => {
    if (!uiHydrated) return;

    async function bootstrap() {
      resetLocationState();

      try {
        const health = await api.health();
        setBackendStatus(health.status === 'ok' ? 'connected' : 'error');
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
        setUser(
          sessionUser
            ? ({ ...(sessionUser as object), location: null } as Parameters<typeof setUser>[0])
            : null
        );
        if (sessionUser) {
          await bootstrapLocationFromProfile();
        }
      } catch {
        setUser(null);
      } finally {
        setAuthReady(true);
      }

      requestLiveLocation({ quiet: true, force: false });
    }

    bootstrap();
  }, [uiHydrated, setUser, setAuthReady, showToast]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }, [largeText, reducedMotion]);

  useEffect(() => {
    document.documentElement.lang = language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en';
  }, [language]);

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
      <ReviewModal />
      <ReportModal />
      <InfoModal />
    </>
  );
}
