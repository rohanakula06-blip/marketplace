'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

type LoginMethod = 'password' | 'email-otp' | 'mobile-otp';

interface ProviderStatus {
  configured: boolean;
  activeProvider?: string | null;
  provider?: string | null;
}

interface LoginFormProps {
  variant: 'customer' | 'professional';
  journey: 'customer' | 'worker';
  onSuccess: (user: Record<string, unknown>) => void;
  footer?: React.ReactNode;
}

const ACCENT = {
  customer: {
    btn: 'bg-blue-600 hover:bg-blue-700',
    tab: 'bg-blue-600 text-white',
    link: 'text-blue-600',
    ring: 'focus:ring-blue-500/30',
    badge: 'bg-blue-50 border-blue-100 text-blue-800',
    checkbox: 'text-blue-600 focus:ring-blue-500',
  },
  professional: {
    btn: 'bg-teal-600 hover:bg-teal-700',
    tab: 'bg-teal-600 text-white',
    link: 'text-teal-600',
    ring: 'focus:ring-teal-500/30',
    badge: 'bg-teal-50 border-teal-100 text-teal-800',
    checkbox: 'text-teal-600 focus:ring-teal-500',
  },
};

export function LoginForm({ variant, journey, onSuccess, footer }: LoginFormProps) {
  const accent = ACCENT[variant];
  const { showToast } = useUIStore();
  const { t } = useTranslation();

  const [method, setMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
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
    fetch('/api/auth/otp/send')
      .then((r) => r.json())
      .then(setSmsStatus)
      .catch(() => {});
    api.auth.emailStatus().then(setEmailStatus).catch(() => {});
  }, []);

  const resetOtp = () => {
    setOtpSent(false);
    setOtp('');
    setCountdown(0);
  };

  const switchMethod = (m: LoginMethod) => {
    setMethod(m);
    resetOtp();
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.login(email.trim().toLowerCase(), password, rememberMe);
      onSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) {
      showToast('Enter a valid email address', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.auth.sendEmailOtp(normalized);
      setOtpSent(true);
      setCountdown(60);
      showToast(`Login code sent to ${normalized}`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (otp.length !== 6) {
      showToast('Enter the 6-digit code from your email', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.auth.verifyEmailOtp(email.trim().toLowerCase(), otp, { journey });
      onSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Invalid code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (phone.length < 10) {
      showToast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.auth.sendOtp(phone);
      setOtpSent(true);
      setCountdown(60);
      showToast(`OTP sent to +91 ${phone}`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (otp.length !== 6) {
      showToast('Enter the 6-digit OTP', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.auth.verifyOtp(phone, otp, { journey });
      onSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2',
    accent.ring
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        {(
          [
            { id: 'password' as const, label: t('auth.passwordTab'), icon: KeyRound },
            { id: 'email-otp' as const, label: t('auth.emailOtpTab'), icon: Mail },
            { id: 'mobile-otp' as const, label: t('auth.mobileOtpTab'), icon: Smartphone },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchMethod(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-colors',
              method === id ? accent.tab : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
            )}
          >
            <Icon size={14} className="hidden sm:block" />
            {label}
          </button>
        ))}
      </div>

      {method === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn('mt-1', inputClass)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">{t('auth.password')}</label>
            <div className="relative mt-1">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(inputClass, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={cn('rounded border-slate-300', accent.checkbox)}
              />
              {t('auth.rememberMe')}
            </label>
            <Link href="/forgot-password" className={cn(accent.link, 'hover:underline')}>
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60',
              accent.btn
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {t('auth.signInBtn')}
          </button>
        </form>
      )}

      {method === 'email-otp' && (
        <div className="space-y-4">
          {emailStatus && (
            <div
              className={cn(
                'flex items-center gap-2 text-xs px-3 py-2 rounded-lg border',
                emailStatus.configured
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              {emailStatus.configured ? (
                <>
                  <CheckCircle size={14} /> Email OTP active via <strong>{emailStatus.provider}</strong>
                </>
              ) : (
                <>
                  <AlertCircle size={14} /> Email not configured — add SMTP or RESEND_API_KEY to .env
                </>
              )}
            </div>
          )}

          {!otpSent ? (
            <>
              <input
                type="email"
                placeholder={t('auth.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={sendEmailOtp}
                disabled={loading || !emailStatus?.configured}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50',
                  accent.btn
                )}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {t('auth.sendCodeEmail')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={resetOtp}
                className={cn('flex items-center gap-1 text-sm hover:underline', accent.link)}
              >
                <ArrowLeft size={14} /> {email}
              </button>
              <div className={cn('rounded-xl border p-3 text-sm', accent.badge)}>
                Check your inbox (and spam) for the 6-digit code sent to <strong>{email}</strong>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder={t('auth.enter6Digit')}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn(inputClass, 'text-center text-2xl font-mono tracking-[0.5em]')}
                autoFocus
              />
              <button
                type="button"
                onClick={verifyEmailOtp}
                disabled={loading || otp.length !== 6}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60',
                  accent.btn
                )}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {t('auth.verifySignIn')}
              </button>
              <button
                type="button"
                onClick={sendEmailOtp}
                disabled={countdown > 0 || loading}
                className="w-full text-sm text-slate-700 disabled:opacity-50"
              >
                {countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.resendCode')}
              </button>
            </>
          )}
        </div>
      )}

      {method === 'mobile-otp' && (
        <div className="space-y-4">
          {smsStatus && (
            <div
              className={cn(
                'flex items-center gap-2 text-xs px-3 py-2 rounded-lg border',
                smsStatus.configured
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              {smsStatus.configured ? (
                <>
                  <CheckCircle size={14} /> SMS OTP via <strong>{smsStatus.activeProvider}</strong>
                </>
              ) : (
                <>
                  <AlertCircle size={14} /> SMS not configured — add TWO_FACTOR_API_KEY to .env
                </>
              )}
            </div>
          )}

          {!otpSent ? (
            <>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">+91</span>
                <input
                  type="tel"
                  placeholder={t('auth.enterMobile')}
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={cn(inputClass, 'pl-14')}
                />
              </div>
              <button
                type="button"
                onClick={sendPhoneOtp}
                disabled={loading || phone.length < 10 || !smsStatus?.configured}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50',
                  accent.btn
                )}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                {t('auth.sendOtpMobile')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={resetOtp}
                className={cn('flex items-center gap-1 text-sm hover:underline', accent.link)}
              >
                <ArrowLeft size={14} /> +91 {phone}
              </button>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder={t('auth.enter6Otp')}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn(inputClass, 'text-center text-2xl font-mono tracking-[0.5em]')}
                autoFocus
              />
              <button
                type="button"
                onClick={verifyPhoneOtp}
                disabled={loading || otp.length !== 6}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60',
                  accent.btn
                )}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {t('auth.verifySignIn')}
              </button>
              <button
                type="button"
                onClick={sendPhoneOtp}
                disabled={countdown > 0 || loading}
                className="w-full text-sm text-slate-700 disabled:opacity-50"
              >
                {countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.resendOtp')}
              </button>
            </>
          )}
        </div>
      )}

      {footer}
    </div>
  );
}
