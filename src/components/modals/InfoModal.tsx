'use client';

import { useState } from 'react';
import { X, Loader2, Send, Mail, Phone, MapPin } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { api, ApiError } from '@/lib/api';
import { AIQuickRequest } from '@/components/sections/AIQuickRequest';
import { SafetySection } from '@/components/sections/SafetySection';
import { AIFeatures } from '@/components/sections/AIFeatures';
import { ProblemSolution } from '@/components/sections/ProblemSolution';
import { MessagingPreview } from '@/components/sections/MessagingPreview';
import { BookingTracker } from '@/components/sections/BookingTracker';

const TITLES: Record<string, string> = {
  contact: 'Contact Us',
  safety: 'Safety & Trust',
  help: 'Help Centre',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  ai: 'LocalPro AI Assistant',
  features: 'AI Features',
  about: 'About LocalPro',
  messaging: 'Secure Messaging',
  booking: 'Booking Lifecycle',
};

function ContactForm() {
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.contact.send(form);
      showToast(res.emailSent ? 'Message sent! We will reply soon.' : 'Message received!', 'success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-sm">
          <Mail className="text-blue-600 mb-2" size={18} />
          <p className="font-medium text-slate-900">Email</p>
          <p className="text-slate-600">rohanakula06@gmail.com</p>
        </div>
        <div className="glass rounded-xl p-4 text-sm">
          <Phone className="text-blue-600 mb-2" size={18} />
          <p className="font-medium text-slate-900">Phone</p>
          <p className="text-slate-600">+91 98765 43210</p>
        </div>
        <div className="glass rounded-xl p-4 text-sm">
          <MapPin className="text-blue-600 mb-2" size={18} />
          <p className="font-medium text-slate-900">Location</p>
          <p className="text-slate-600">Konaseema, Andhra Pradesh</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-light w-full rounded-xl px-4 py-3 text-sm" />
          <input required type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-light w-full rounded-xl px-4 py-3 text-sm" />
        </div>
        <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-light w-full rounded-xl px-4 py-3 text-sm" />
        <textarea required placeholder="Your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-light w-full rounded-xl px-4 py-3 text-sm min-h-[100px]" />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send Message
        </button>
      </form>
    </div>
  );
}

function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="prose prose-slate max-w-none">
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <div className="text-sm text-slate-600 space-y-3 leading-relaxed">{children}</div>
    </div>
  );
}

export function InfoModal() {
  const { infoModal, setInfoModal } = useUIStore();
  if (!infoModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">{TITLES[infoModal]}</h2>
          <button onClick={() => setInfoModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {infoModal === 'contact' && <ContactForm />}
          {infoModal === 'safety' && <div className="-m-6"><SafetySection /></div>}
          {infoModal === 'ai' && <AIQuickRequest />}
          {infoModal === 'features' && <div className="-m-6 pt-0"><AIFeatures /></div>}
          {infoModal === 'about' && <div className="-m-6"><ProblemSolution /></div>}
          {infoModal === 'messaging' && <div className="-m-6 pt-0"><MessagingPreview /></div>}
          {infoModal === 'booking' && <div className="-m-6"><BookingTracker /></div>}
          {infoModal === 'help' && (
            <StaticPage title="Help Centre">
              <p><strong>Finding a worker:</strong> Go to Find Workers, set your location, and book a verified professional.</p>
              <p><strong>Finding work:</strong> Register as a worker, then browse open jobs on Find Jobs.</p>
              <p><strong>Login issues:</strong> Use email + password, mobile OTP, or email code from the Log In popup.</p>
              <p><strong>Bookings:</strong> View and manage all bookings from My Bookings in the navbar.</p>
              <p>Demo login: priya@demo.com / password123</p>
            </StaticPage>
          )}
          {infoModal === 'privacy' && (
            <StaticPage title="Privacy Policy">
              <p>LocalPro is a hackathon prototype. We store account data locally in SQLite for demo purposes.</p>
              <p>Phone numbers are not shared between users — all communication happens in-app.</p>
              <p>Payment data is simulated only; no real charges are made in this demo.</p>
              <p>Contact us via the Contact popup if you have questions about your data.</p>
            </StaticPage>
          )}
          {infoModal === 'terms' && (
            <StaticPage title="Terms & Conditions">
              <p>By using LocalPro you agree this is a demonstration marketplace for educational purposes.</p>
              <p>Workers and customers are responsible for verifying credentials before booking.</p>
              <p>LocalPro provides matching tools but does not guarantee service outcomes in this prototype.</p>
              <p>Disputes should be reported through the in-app messaging and contact form.</p>
            </StaticPage>
          )}
        </div>
      </div>
    </div>
  );
}
