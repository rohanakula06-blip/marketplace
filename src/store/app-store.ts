'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserJourney = 'customer' | 'worker' | null;

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  location: string | null;
  language: string;
  largeText: boolean;
  reducedMotion: boolean;
  workerProfile: Record<string, unknown> | null;
}

interface AuthState {
  user: User | null;
  journey: UserJourney;
  isLoading: boolean;
  authReady: boolean;
  setUser: (user: User | null) => void;
  setJourney: (journey: UserJourney) => void;
  setLoading: (loading: boolean) => void;
  setAuthReady: (ready: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      journey: null,
      isLoading: true,
      authReady: false,
      setUser: (user) => set({ user }),
      setJourney: (journey) => set({ journey }),
      setLoading: (isLoading) => set({ isLoading }),
      setAuthReady: (authReady) => set({ authReady }),
      logout: () => set({ user: null, journey: null }),
    }),
    { name: 'localpro-auth', partialize: (s) => ({
      journey: s.journey,
      user: s.user ? { ...s.user, location: null } : null,
    }) }
  )
);

interface UIState {
  authModal: 'login' | 'register' | 'role-select' | null;
  authIntent: UserJourney;
  bookingModal: boolean;
  selectedWorkerId: string | null;
  workerProfileModal: string | null;
  jobModal: string | null;
  paymentModal: string | null;
  messageModal: { userId: string; bookingId?: string } | null;
  infoModal: 'contact' | 'safety' | 'help' | 'privacy' | 'terms' | 'ai' | 'features' | 'about' | 'messaging' | 'booking' | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  location: string;
  coords: { lat: number; lng: number };
  locationAccuracy: number | null;
  locationReady: boolean;
  locationSource: 'pending' | 'gps' | 'search';
  locationDetecting: boolean;
  locationError: string | null;
  language: string;
  largeText: boolean;
  reducedMotion: boolean;
  setAuthModal: (modal: UIState['authModal']) => void;
  setAuthIntent: (intent: UserJourney) => void;
  openAuth: (modal: 'login' | 'register', intent?: UserJourney) => void;
  setBookingModal: (open: boolean, workerId?: string) => void;
  setWorkerProfileModal: (id: string | null) => void;
  setJobModal: (id: string | null) => void;
  setPaymentModal: (id: string | null) => void;
  setMessageModal: (data: UIState['messageModal']) => void;
  setInfoModal: (modal: UIState['infoModal']) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  setLocation: (location: string) => void;
  setCoords: (lat: number, lng: number, label?: string, accuracyMeters?: number | null, source?: UIState['locationSource']) => void;
  resetLocation: () => void;
  applyGpsLocation: (lat: number, lng: number, label: string, accuracyMeters?: number | null) => void;
  setLocationDetecting: (detecting: boolean) => void;
  setLocationError: (error: string | null) => void;
  setLanguage: (language: string) => void;
  setLargeText: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      authModal: null,
      authIntent: null,
      bookingModal: false,
      selectedWorkerId: null,
      workerProfileModal: null,
      jobModal: null,
      paymentModal: null,
      messageModal: null,
      infoModal: null,
      toast: null,
      location: '',
      coords: { lat: 0, lng: 0 },
      locationAccuracy: null,
      locationReady: false,
      locationSource: 'pending',
      locationDetecting: false,
      locationError: null,
      language: 'en',
      largeText: false,
      reducedMotion: false,
      setAuthModal: (authModal) => set({ authModal }),
      setAuthIntent: (authIntent) => set({ authIntent }),
      openAuth: (modal, intent) => set({ authModal: modal, authIntent: intent || null }),
      setBookingModal: (open, workerId) =>
        set({ bookingModal: open, selectedWorkerId: workerId || null }),
      setWorkerProfileModal: (workerProfileModal) => set({ workerProfileModal }),
      setJobModal: (jobModal) => set({ jobModal }),
      setPaymentModal: (paymentModal) => set({ paymentModal }),
      setMessageModal: (messageModal) => set({ messageModal }),
      setInfoModal: (infoModal) => set({ infoModal }),
      showToast: (message, type = 'info') => set({ toast: { message, type } }),
      clearToast: () => set({ toast: null }),
      setLocation: (location) => set({ location }),
      setCoords: (lat, lng, label, accuracyMeters, source) =>
        set((s) => ({
          coords: { lat, lng },
          locationAccuracy: accuracyMeters !== undefined ? accuracyMeters : s.locationAccuracy,
          locationSource: source ?? s.locationSource,
          locationReady: source === 'gps' || source === 'search',
          ...(label ? { location: label } : {}),
        })),
      resetLocation: () =>
        set({
          location: '',
          coords: { lat: 0, lng: 0 },
          locationAccuracy: null,
          locationReady: false,
          locationSource: 'pending',
          locationError: null,
        }),
      applyGpsLocation: (lat, lng, label, accuracyMeters) =>
        set({
          coords: { lat, lng },
          location: label,
          locationAccuracy: accuracyMeters ?? null,
          locationReady: true,
          locationSource: 'gps',
          locationError: null,
        }),
      setLocationDetecting: (locationDetecting) => set({ locationDetecting }),
      setLocationError: (locationError) => set({ locationError }),
      setLanguage: (language) => set({ language }),
      setLargeText: (largeText) => set({ largeText }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    {
      name: 'localpro-ui-v7',
      partialize: (s) => ({
        language: s.language,
        largeText: s.largeText,
        reducedMotion: s.reducedMotion,
      }),
    }
  )
);
