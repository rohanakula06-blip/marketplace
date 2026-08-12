'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Eye, EyeOff, Loader2, Smartphone, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { requestLiveLocation, resetLocationState } from '@/lib/location-service';

interface ProviderStatus {
  configured: boolean;
  activeProvider?: string | null;
  provider?: string | null;
}

export function AuthModals() {
  const { authModal, setAuthModal, authIntent, showToast } = useUIStore();
  const { setUser, setJourney } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [emailMode, setEmailMode] = useState<'password' | 'otp'>('password');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [smsStatus, setSmsStatus] = useState<ProviderStatus | null>(null);
  const [emailStatus, setEmailStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!authModal) {
      setPhoneOtpSent(false);
      setEmailOtpSent(false);
      setOtp('');
      setCountdown(0);
    } else {
      fetch('/api/auth/otp/send').then((r) => r.json()).then(setSmsStatus).catch(() => {});
      api.auth.emailStatus().then(setEmailStatus).catch(() => {});
    }
  }, [authModal]);

  if (!authModal || authModal === 'role-select') return null;

  const isLogin = authModal === 'login';

  const onAuthSuccess = async (user: Record<string, unknown>) => {
    setUser({ ...user, location: null } as unknown as Parameters<typeof setUser>[0]);
    if (authIntent) setJourney(authIntent);
    setAuthModal(null);
    resetLocationState();
    requestLiveLocation({ quiet: true, force: true });
    showToast(`Welcome, ${user.name}!`, 'success');

    if (authIntent === 'worker') {
      if (user.workerProfile) router.push('/dashboard/worker');
      else router.push('/register/worker');
    } else if (authIntent === 'customer') {
      router.push('/find-workers');
    } else if (user.role === 'worker' || user.workerProfile) {
      router.push('/dashboard/worker');
    } else {
      router.push('/dashboard/customer');
    }
  };

  const submitEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = isLogin
        ? await api.auth.login(form.email.trim().toLowerCase(), form.password, rememberMe)
        : await api.auth.register({ ...form, email: form.email.trim().toLowerCase(), journey: authIntent });
      onAuthSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (form.phone.length < 10) { showToast('Enter a valid mobile number', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.auth.sendOtp(form.phone);
      setPhoneOtpSent(true);
      setCountdown(60);
      showToast(`OTP sent to +91 ${form.phone}`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (otp.length !== 6) { showToast('Enter the 6-digit OTP', 'error'); return; }
    setLoading(true);
    try {
      const data = await api.auth.verifyOtp(form.phone, otp, { name: form.name || undefined, journey: authIntent || undefined });
      onAuthSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes('@')) { showToast('Enter a valid email address', 'error'); return; }
    setLoading(true);
    try {
      await api.auth.sendEmailOtp(email);
      setEmailOtpSent(true);
      setCountdown(60);
      showToast(`Login code sent to ${email}`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (otp.length !== 6) { showToast('Enter the 6-digit code from your email', 'error'); return; }
    setLoading(true);
    try {
      const data = await api.auth.verifyEmailOtp(form.email.trim().toLowerCase(), otp, {
        name: form.name || undefined,
        journey: authIntent || undefined,
      });
      onAuthSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Invalid code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetOtp = () => { setPhoneOtpSent(false); setEmailOtpSent(false); setOtp(''); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={() => setAuthModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={20} /></button>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">{isLogin ? 'Welcome Back' : 'Join LocalPro'}</h2>
        <p className="text-sm text-slate-500 mb-4">Sign in with your real email or mobile number</p>

        <div className="flex gap-2 mb-6">
          {(['email', 'phone'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); resetOtp(); }}
              className={cn('flex-1 py-2 rounded-lg text-sm font-medium', tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
              {t === 'phone' ? 'Mobile' : 'Email'}
            </button>
          ))}
        </div>

        {tab === 'email' && (
          <div className="space-y-4">
            {emailStatus && (
              <div className={cn('flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                emailStatus.configured ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
                {emailStatus.configured ? (
                  <><CheckCircle size={14} /> Real email active via <strong>{emailStatus.provider}</strong></>
                ) : (
                  <><AlertCircle size={14} /> Add SMTP or RESEND_API_KEY to .env — see EMAIL_SETUP.md</>
                )}
              </div>
            )}

            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['otp', 'password'] as const).map((m) => (
                <button key={m} onClick={() => { setEmailMode(m); resetOtp(); }}
                  className={cn('flex-1 py-2 rounded-lg text-xs font-medium', emailMode === m ? 'bg-white shadow text-blue-600' : 'text-slate-500')}>
                  {m === 'otp' ? 'Email Code' : 'Password'}
                </button>
              ))}
            </div>

            {emailMode === 'otp' ? (
              !emailOtpSent ? (
                <>
                  {!isLogin && (
                    <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                  )}
                  <input type="email" placeholder="your.email@gmail.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                  <button onClick={sendEmailOtp} disabled={loading || !emailStatus?.configured}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    Send Code to Email
                  </button>
                </>
              ) : (
                <>
                  <button onClick={resetOtp} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ArrowLeft size={14} /> {form.email}
                  </button>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800">
                    Check your inbox (and spam folder) for the 6-digit code sent to <strong>{form.email}</strong>
                  </div>
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-mono tracking-[0.5em]"
                    autoFocus />
                  <button onClick={verifyEmailOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full">
                    {loading && <Loader2 size={16} className="animate-spin inline mr-2" />}Verify & Login
                  </button>
                  <button onClick={sendEmailOtp} disabled={countdown > 0 || loading} className="w-full text-sm text-slate-500 disabled:opacity-50">
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </>
              )
            ) : (
              <form onSubmit={submitEmailPassword} className="space-y-4">
                {!isLogin && (
                  <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                )}
                <input required type="email" placeholder="your.email@gmail.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                <div className="relative">
                  <input required type={showPass ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Remember me
                    </label>
                    <Link
                      href="/forgot-password"
                      onClick={() => setAuthModal(null)}
                      className="text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading && <Loader2 size={16} className="animate-spin inline mr-2" />}
                  {isLogin ? 'Log In with Email' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'phone' && (
          <div className="space-y-4">
            {smsStatus && (
              <div className={cn('flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                smsStatus.configured ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
                {smsStatus.configured ? (
                  <><CheckCircle size={14} /> SMS via <strong>{smsStatus.activeProvider}</strong></>
                ) : (
                  <><AlertCircle size={14} /> Add TWO_FACTOR_API_KEY to .env</>
                )}
              </div>
            )}
            {!phoneOtpSent ? (
              <>
                {!isLogin && (
                  <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                )}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">+91</span>
                  <input type="tel" placeholder="Mobile number" maxLength={10} value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full rounded-xl border border-slate-200 pl-14 pr-4 py-3 text-sm" />
                </div>
                <button onClick={sendPhoneOtp} disabled={loading || form.phone.length < 10 || !smsStatus?.configured}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                  Send OTP to Mobile
                </button>
              </>
            ) : (
              <>
                <button onClick={resetOtp} className="flex items-center gap-1 text-sm text-blue-600"><ArrowLeft size={14} /> +91 {form.phone}</button>
                <input type="text" inputMode="numeric" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-mono tracking-[0.5em]" autoFocus />
                <button onClick={verifyPhoneOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full">Verify & Login</button>
                <button onClick={sendPhoneOtp} disabled={countdown > 0} className="w-full text-sm text-slate-500">
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setAuthModal(isLogin ? 'register' : 'login')} className="text-blue-600 font-medium hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
