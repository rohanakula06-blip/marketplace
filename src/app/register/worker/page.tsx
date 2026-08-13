'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TeakAuthShell } from '@/components/auth/TeakAuthShell';
import { LocationControls } from '@/components/maps/LocationControls';
import { LocationMapSection } from '@/components/maps/LocationMapSection';
import { RegisterAccountForm, type RegisterAccountData } from '@/components/auth/RegisterAccountForm';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { Loader2, CheckCircle, Briefcase } from 'lucide-react';
import { requestLiveLocation } from '@/lib/location-service';
import { api, ApiError } from '@/lib/api';

const CATEGORIES = [
  'electrician', 'plumber', 'tutor', 'cleaning', 'carpenter',
  'painter', 'appliance', 'mechanic', 'beauty', 'gardening', 'pest', 'moving',
];

export default function WorkerRegisterPage() {
  const { showToast, location, locationReady, coords } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setJourney = useAuthStore((s) => s.setJourney);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [account, setAccount] = useState<RegisterAccountData>({ name: '', email: '', password: '', phone: '' });
  const [profile, setProfile] = useState({
    category: 'electrician',
    skills: '',
    experience: '1',
    pricing: '',
    bio: '',
    languages: 'English, Telugu',
    travelRadius: '15',
  });

  useEffect(() => {
    if (user?.workerProfile) {
      router.replace('/dashboard/worker');
    }
  }, [user, router]);

  useEffect(() => {
    requestLiveLocation({ quiet: true, force: true });
  }, []);

  const handleAccountCreated = (registered: Record<string, unknown>) => {
    setUser({ ...registered, location: null } as unknown as Parameters<typeof setUser>[0]);
    setJourney('worker');
    showToast('Account verified! Complete your professional profile below.', 'success');
  };

  const registerProfessional = async () => {
    if (!account.name || !account.email || !account.password) {
      showToast('Fill in name, email and password', 'error');
      return;
    }
    if (!profile.skills || !profile.pricing) {
      showToast('Add your skills and pricing', 'error');
      return;
    }
    if (!locationReady || !coords.lat) {
      showToast('Set your service location first (GPS or search)', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.registerWorker({
        ...account,
        email: account.email.trim().toLowerCase(),
        ...profile,
        location,
        latitude: coords.lat,
        longitude: coords.lng,
        serviceAreas: location.split(',')[0],
      });

      setUser({ ...data.user, location: null } as unknown as Parameters<typeof setUser>[0]);
      setJourney('worker');
      setDone(true);
      showToast('You are registered! Customers can now find you nearby.', 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const completeExistingProfile = async () => {
    if (!user) return;
    if (!locationReady || !coords.lat) {
      showToast('Set your service location first', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.location.update({
        location,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      await api.workers.createProfile(user.id, {
        ...profile,
        location,
        latitude: coords.lat,
        longitude: coords.lng,
        serviceAreas: location.split(',')[0],
      });
      const me = await api.auth.me();
      if (me.user) setUser(me.user as unknown as Parameters<typeof setUser>[0]);
      setDone(true);
      showToast('Professional profile created!', 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Profile submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => {
    if (user && !user.workerProfile) {
      completeExistingProfile();
    } else if (!user) {
      registerProfessional();
    }
  };

  const inputClass =
    'w-full rounded-xl border border-teak-200 bg-white px-4 py-3 text-sm text-teak-900 placeholder:text-teak-400 focus:outline-none focus:ring-2 focus:ring-teak-500/30';

  return (
    <TeakAuthShell wide showLanguage={false}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teak-700 mb-4 shadow-md shadow-teak-900/15">
          <Briefcase size={32} className="text-teak-50" />
        </div>
        <h1 className="text-3xl font-bold text-teak-950">Register as a Professional</h1>
        <p className="text-teak-600 mt-2 text-sm">
          Password, email code, or mobile OTP — then complete your profile
        </p>
      </div>

      {done ? (
        <div className="text-center py-6">
          <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-bold text-teak-950 mb-2">You&apos;re live on LocalPro!</h2>
          <p className="text-teak-600 mb-6">
            Customers near your location can discover and book you.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/worker')}
            className="rounded-xl bg-teak-600 px-6 py-3 text-sm font-semibold text-teak-50 hover:bg-teak-700"
          >
            Go to Professional Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {!user && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-teak-900">Account</h2>
              <RegisterAccountForm
                variant="professional"
                journey="worker"
                embedded
                onSuccess={handleAccountCreated}
                onAccountChange={setAccount}
                footer={
                  <p className="text-center text-sm text-teak-700">
                    Already a user?{' '}
                    <Link href="/login/professional" className="text-teak-800 font-semibold hover:underline">
                      Sign in
                    </Link>
                  </p>
                }
              />
            </div>
          )}

          {user && !user.workerProfile && (
            <p className="text-sm text-teak-800 bg-teak-100 border border-teak-200 rounded-xl px-4 py-3">
              Signed in as <strong>{user.name}</strong>. Complete your professional profile below.
            </p>
          )}

          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-teak-900">Professional profile</h2>
            <select
              value={profile.category}
              onChange={(e) => setProfile({ ...profile, category: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <input
              placeholder="Skills (e.g. Wiring, Switchboards, LED Installation)"
              value={profile.skills}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                min={0}
                placeholder="Years experience"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Pricing (e.g. ₹400 visit + ₹200/hr)"
                value={profile.pricing}
                onChange={(e) => setProfile({ ...profile, pricing: e.target.value })}
                className={inputClass}
              />
            </div>
            <textarea
              placeholder="Brief bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className={`${inputClass} min-h-[80px]`}
            />
            <input
              placeholder="Languages"
              value={profile.languages}
              onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <h2 className="font-semibold text-lg text-teak-900 mb-3">Service location</h2>
            <p className="text-sm text-teak-600 mb-3">
              Where you work — customers find you by distance from this point.
            </p>
            <LocationControls compact className="mb-4" />
            <LocationMapSection compact height="260px" searchRadiusKm={15} />
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              loading ||
              (!user && (!account.name.trim() || !account.email.trim() || !account.password))
            }
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teak-600 py-3 text-sm font-semibold text-teak-50 hover:bg-teak-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {user && !user.workerProfile ? 'Create Professional Profile' : 'Register & Go Live'}
          </button>
        </div>
      )}
    </TeakAuthShell>
  );
}
