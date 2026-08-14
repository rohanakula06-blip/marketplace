'use client';

import Link from 'next/link';
import { Search, Sparkles, MapPin } from 'lucide-react';
import { ActionCards } from './ActionCards';
import { LocationPicker } from '../location/LocationPicker';
import { useAuthStore } from '@/store/app-store';
import { Shield, Star, Lock, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { LandingCard, LandingStat } from '@/components/landing/LandingUi';

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
    <section id="home" className="relative min-h-screen overflow-hidden bg-teak-50">
      <div className="absolute inset-0 hero-teak-glow pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 pt-28 pb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teak-300/60 bg-teak-100/80 px-4 py-2 text-sm font-medium text-teak-800 mb-6">
            <Sparkles size={16} className="text-teak-600" />
            {t('hero.badge')}
          </div>

          <h1 className="text-4xl md:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.1] text-teak-950 mb-6">
            {t('hero.title1')}{' '}
            <span className="block text-teak-700">{t('hero.title2')}</span>
            <span className="block mt-1 text-teak-600">{t('hero.title3')}</span>
          </h1>

          <p className="text-lg text-teak-700 leading-relaxed max-w-xl mb-8">{t('hero.subtitle')}</p>

          <ActionCards variant="hero" theme="teak" />

          <div className="grid grid-cols-2 gap-3 mt-10 max-w-xl">
            {trustItems.map((item) => (
              <LandingCard key={item.titleKey} className="flex items-start gap-3 p-3.5">
                <div className="p-2 rounded-lg bg-teak-100 border border-teak-200">
                  <item.icon size={16} className="text-teak-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-teak-900">{t(item.titleKey)}</p>
                  <p className="text-xs text-teak-600 mt-0.5">{t(item.descKey)}</p>
                </div>
              </LandingCard>
            ))}
          </div>
        </div>

        <div className="mt-12 max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <LandingStat key={s.labelKey} icon={s.icon} value={s.value} label={t(s.labelKey)} />
          ))}
        </div>

        {user && (
          <LandingCard className="mt-8 max-w-3xl p-6 shadow-lg">
            <h3 className="font-semibold text-teak-900 mb-1 flex items-center gap-2">
              <MapPin size={18} className="text-teak-600" />
              {t('hero.setLocation')}
            </h3>
            <p className="text-sm text-teak-600 mb-4">{t('hero.setLocationHint')}</p>
            <LocationPicker showMap compact />
            <div className="mt-4">
              <Link
                href={findWorkersHref}
                className="inline-flex items-center gap-2 rounded-xl bg-teak-600 px-5 py-3 text-sm font-semibold text-teak-50 shadow-md shadow-teak-900/15 hover:bg-teak-700 hover:-translate-y-0.5 transition-all"
              >
                <Search size={16} /> {t('hero.findNearby')}
              </Link>
            </div>
          </LandingCard>
        )}
      </div>
    </section>
  );
}
