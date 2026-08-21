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

export type RegisterMethod = 'password' | 'email-otp' | 'mobile-otp';

export interface RegisterAccountData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

interface ProviderStatus {
  configured: boolean;
  activeProvider?: string | null;
  provider?: string | null;
}

interface RegisterAccountFormProps {
  variant: 'customer' | 'professional';
  journey: 'customer' | 'worker';
  /** When true, password tab syncs fields to parent instead of submitting (worker register flow). */
  embedded?: boolean;
  onSuccess: (user: Record<string, unknown>) => void;
  onAccountChange?: (data: RegisterAccountData) => void;
  footer?: React.ReactNode;
  submitLabel?: string;
}

const ACCENT = {
  customer: {
    btn: 'bg-blue-600 hover:bg-blue-700',
    tab: 'bg-blue-600 text-white',
    link: 'text-blue-600',
    ring: 'focus:ring-blue-500/30',
    badge: 'bg-blue-50 border-blue-100 text-blue-800',
  },
  professional: {
    btn: 'bg-teal-600 hover:bg-teal-700',
    tab: 'bg-teal-600 text-white',
    link: 'text-teal-600',
    ring: 'focus:ring-teal-500/30',
    badge: 'bg-teal-50 border-teal-100 text-teal-800',
  },
};

export function RegisterAccountForm({
  variant,
  journey,
  embedded = false,
  onSuccess,
  onAccountChange,
  footer,
  submitLabel = 'Create Account',
}: RegisterAccountFormProps) {
  const accent = ACCENT[variant];
  const { showToast } = useUIStore();

  const [method, setMethod] = useState<RegisterMethod>('password');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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

  useEffect(() => {
    if (!embedded || !onAccountChange) return;
    onAccountChange({ name, email, password, phone });
  }, [embedded, name, email, password, phone, onAccountChange]);

  const resetOtp = () => {
    setOtpSent(false);
    setOtp('');
    setCountdown(0);
  };

  const switchMethod = (m: RegisterMethod) => {
    setMethod(m);
    resetOtp();
  };

  const inputClass = cn(
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2',
    accent.ring
  );

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Enter your full name', 'error');
      return;
    }
    if (!email.trim() || !password) {
      showToast('Fill in email and password', 'error');
      return;
    }
    if (embedded) return;

    setLoading(true);
    try {
      const data = await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        journey,
      });
      onSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async () => {
    if (!name.trim()) {
      showToast('Enter your full name first', 'error');
      return;
    }
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
      showToast(`Verification code sent to ${normalized}`, 'success');
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
      const data = await api.auth.verifyEmailOtp(email.trim().toLowerCase(), otp, {
        name: name.trim(),
        journey,
      });
      onSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Invalid code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (!name.trim()) {
      showToast('Enter your full name first', 'error');
      return;
    }
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
      const data = await api.auth.verifyOtp(phone, otp, { name: name.trim(), journey });
      onSuccess(data.user);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        {(
          [
            { id: 'password' as const, label: 'Password', icon: KeyRound },
            { id: 'email-otp' as const, label: 'Email OTP', icon: Mail },
            { id: 'mobile-otp' as const, label: 'Mobile OTP', icon: Smartphone },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchMethod(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors',
              method === id ? accent.tab : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon size={14} className="hidden sm:block" />
            {label}
          </button>
        ))}
      </div>

      {method === 'password' && (
        <form onSubmit={handlePasswordRegister} className="space-y-4">
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={inputClass}
          />
          <div className="relative">
            <input
              required
              type={showPass ? 'text' : 'password'}
              minLength={6}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {!embedded && (
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60',
                accent.btn
              )}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {submitLabel}
            </button>
          )}
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
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={sendEmailOtp}
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50',
                  accent.btn
                )}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Send Code to Email
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
                Check your inbox for the 6-digit code sent to <strong>{email}</strong>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
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
                Verify & Create Account
              </button>
              <button
                type="button"
                onClick={sendEmailOtp}
                disabled={countdown > 0 || loading}
                className="w-full text-sm text-slate-500 disabled:opacity-50"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
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
              <input
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">+91</span>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={cn(inputClass, 'pl-14')}
                />
              </div>
              <button
                type="button"
                onClick={sendPhoneOtp}
                disabled={loading || phone.length < 10}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50',
                  accent.btn
                )}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                Send OTP to Mobile
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
                placeholder="Enter 6-digit OTP"
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
                Verify & Create Account
              </button>
              <button
                type="button"
                onClick={sendPhoneOtp}
                disabled={countdown > 0 || loading}
                className="w-full text-sm text-slate-500 disabled:opacity-50"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </>
          )}
        </div>
      )}

      {footer}
    </div>
  );
}
