'use client';

import Link from 'next/link';
import { Search, Sparkles, MapPin } from 'lucide-react';
import { ActionCards } from './ActionCards';
import { LocationPicker } from '../location/LocationPicker';
import { useAuthStore } from '@/store/app-store';
import { Shield, Star, Lock, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function HeroSection() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const findWorkersHref = user
    ? user.workerProfile
      ? '/dashboard/worker'
      : '/find-workers'
    : '/register';

  const trustItems = [
    { icon: Shield, titleKey: 'hero.verifiedPros', descKey: 'hero.verifiedProsDesc' },
    { icon: MapPin, titleKey: 'hero.hyperlocal', descKey: 'hero.hyperlocalDesc' },
    { icon: Star, titleKey: 'hero.topRated', descKey: 'hero.topRatedDesc' },
    { icon: Lock, titleKey: 'hero.secure', descKey: 'hero.secureDesc' },
  ] as const;

  const stats = [
    { icon: Users, value: '12K+', labelKey: 'hero.statCustomers' },
    { icon: Shield, value: '4.5K+', labelKey: 'hero.statWorkers' },
    { icon: Star, value: '25K+', labelKey: 'hero.statJobs' },
    { icon: MapPin, value: '4.8', labelKey: 'hero.statRating' },
  ] as const;

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-[#060912]">
      <div
        className="absolute inset-0 z-0 hero-bg-scene"
        style={{ backgroundImage: "url('/hero-background.png')" }}
      />
      <div className="absolute inset-0 z-[1] hero-overlay-night" />
      <div className="absolute inset-0 z-[1] hero-pin-glow pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 pt-28 pb-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 mb-6 backdrop-blur-sm">
              <Sparkles size={16} className="text-amber-400" />
              {t('hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.1] text-white mb-6">
              {t('hero.title1')}{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400">
                {t('hero.title2')}
              </span>
              <span className="block mt-1 text-blue-300">{t('hero.title3')}</span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-xl mb-8">{t('hero.subtitle')}</p>

            <ActionCards variant="hero" />

            <div className="grid grid-cols-2 gap-3 mt-10 max-w-xl">
              {trustItems.map((item) => (
                <div
                  key={item.titleKey}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3.5"
                >
                  <div className="p-2 rounded-lg bg-amber-500/15">
                    <item.icon size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{t(item.titleKey)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7" aria-hidden />
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.labelKey}>
                <s.icon className="mx-auto text-amber-400 mb-2" size={22} />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>

        {user && (
          <div className="mt-8 max-w-3xl rounded-2xl border border-white/10 bg-slate-900/75 backdrop-blur-xl shadow-2xl shadow-black/50 p-6">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <MapPin size={18} className="text-amber-400" />
              {t('hero.setLocation')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{t('hero.setLocationHint')}</p>
            <LocationPicker showMap compact />
            <div className="mt-4">
              <Link
                href={findWorkersHref}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all"
              >
                <Search size={16} /> {t('hero.findNearby')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
