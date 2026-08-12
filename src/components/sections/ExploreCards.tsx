'use client';

import { Sparkles, Shield, MessageSquare, Calendar, Info, Mail } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/useTranslation';

const EXPLORE_ITEMS = [
  { id: 'ai' as const, icon: Sparkles, label: 'Ask AI', desc: 'Describe your problem', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'features' as const, icon: Sparkles, label: 'AI Features', desc: 'Smart matching tools', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'about' as const, icon: Info, label: 'About Us', desc: 'How LocalPro works', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { id: 'safety' as const, icon: Shield, label: 'Safety', desc: 'Verified professionals', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'messaging' as const, icon: MessageSquare, label: 'Messaging', desc: 'Secure in-app chat', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'booking' as const, icon: Calendar, label: 'Bookings', desc: 'Full booking flow', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'contact' as const, icon: Mail, label: 'Contact', desc: 'Get in touch', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export function ExploreCards() {
  const setInfoModal = useUIStore((s) => s.setInfoModal);
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { t } = useTranslation();

  if (!authReady || !user) return null;

  return (
    <section className="section-padding bg-white border-t border-slate-100">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">{t('explore.title')}</h2>
        <p className="text-slate-600 text-center mb-8">{t('explore.subtitle')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {EXPLORE_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setInfoModal(item.id)}
              className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${item.color}`}
            >
              <item.icon size={24} className="mb-3" />
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs opacity-80 mt-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
