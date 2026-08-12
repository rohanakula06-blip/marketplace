'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { LocationPicker } from '@/components/location/LocationPicker';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { Loader2, CheckCircle, Briefcase } from 'lucide-react';

const CATEGORIES = [
  'electrician', 'plumber', 'tutor', 'cleaning', 'carpenter',
  'painter', 'appliance', 'mechanic', 'beauty', 'gardening', 'pest', 'moving',
];

const STEPS = ['Account', 'Profile', 'Verification'];

export default function WorkerRegisterPage() {
  const { openAuth, showToast, coords } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [step, setStep] = useState(user ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState({ name: '', email: '', password: '', phone: '' });
  const [profile, setProfile] = useState({
    category: 'electrician',
    skills: '',
    experience: '1',
    pricing: '',
    bio: '',
    languages: 'English, Hindi',
    travelRadius: '15',
  });

  const registerAccount = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...account,
        journey: 'worker',
        location: coords.lat ? `${coords.lat}, ${coords.lng}` : 'Konaseema, Andhra Pradesh',
        latitude: coords.lat,
        longitude: coords.lng,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setUser(data.user);
      setStep(1);
      showToast('Account created! Complete your professional profile.', 'success');
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  };

  const submitProfile = async () => {
    if (!user && step === 0) { openAuth('register', 'worker'); return; }
    setLoading(true);
    const res = await fetch(`/api/workers/${user!.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        serviceAreas: 'Local area',
      }),
    });
    setLoading(false);
    if (res.ok) {
      setStep(2);
      showToast('Profile submitted for verification!', 'success');
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (me.user) setUser(me.user);
    } else {
      const data = await res.json();
      showToast(data.error || 'Profile submission failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-2xl px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Briefcase size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Join as a Professional</h1>
          <p className="text-slate-500 mt-2">Enroll manually, get verified, and receive booking notifications</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-4 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i <= step ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {step === 0 && !user && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Create Your Account</h2>
              {['name', 'email', 'phone', 'password'].map((field) => (
                <input
                  key={field}
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={account[field as keyof typeof account]}
                  onChange={(e) => setAccount({ ...account, [field]: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              ))}
              <div className="pt-2">
                <p className="text-sm font-medium text-slate-700 mb-3">Service Location</p>
                <LocationPicker showMap compact />
              </div>
              <button onClick={registerAccount} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />} Create Account & Continue
              </button>
              <p className="text-center text-sm text-slate-500">
                Already registered? <button onClick={() => openAuth('login', 'worker')} className="text-blue-600 font-medium">Log in</button>
              </p>
            </div>
          )}

          {(step === 1 || (step === 0 && user)) && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Professional Profile</h2>
              <select
                value={profile.category}
                onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input placeholder="Skills (e.g. Wiring, Switchboards, LED Installation)" value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Years of experience" value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                <input placeholder="Pricing (e.g. ₹400 visit + ₹200/hr)" value={profile.pricing}
                  onChange={(e) => setProfile({ ...profile, pricing: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              </div>
              <textarea placeholder="Brief bio about your experience" value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm min-h-[80px]" />
              <input placeholder="Languages spoken" value={profile.languages}
                onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <LocationPicker showMap compact />
              <button onClick={submitProfile} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />} Submit for Verification
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-6">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Submitted!</h2>
              <p className="text-slate-500 mb-6">Your profile is under review. You&apos;ll receive notifications when customers book you.</p>
              <div className="space-y-2 text-sm text-left bg-slate-50 rounded-xl p-4 mb-6">
                {['Profile Submitted', 'Documents Under Review', 'Skills Verified', 'Account Approved', 'Ready to Find Work'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i === 0 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {i === 0 ? '✓' : i + 1}
                    </div>
                    <span className={i === 0 ? 'text-green-700 font-medium' : 'text-slate-500'}>{s}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/dashboard/worker')} className="btn-primary">Go to Worker Dashboard</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
