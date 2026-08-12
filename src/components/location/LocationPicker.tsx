'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Loader2, Search } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { useAuthStore } from '@/store/app-store';
import { geocodeAddressWithLabel, CITY_COORDS } from '@/lib/geolocation';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { LOCATIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const LocationMapSection = dynamic(
  () => import('@/components/maps/LocationMapSection').then((m) => m.LocationMapSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">
        Loading map…
      </div>
    ),
  }
);

interface LocationPickerProps {
  showMap?: boolean;
  compact?: boolean;
  className?: string;
}

export function LocationPicker({ showMap = true, compact = false, className }: LocationPickerProps) {
  const { location, setLocation, showToast, setCoords, setLocationLocked } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { refresh, isDetecting } = useCurrentLocation({ autoDetect: !showMap });
  const [manualInput, setManualInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveToBackend = async (label: string, lat: number, lng: number, locked = false) => {
    setCoords(lat, lng, label, locked ? null : undefined);
    setLocationLocked(locked);
    if (user) {
      setSaving(true);
      try {
        await api.location.update({ location: label, latitude: lat, longitude: lng });
        setUser({ ...user, location: label });
      } catch {
        showToast('Location saved on this device', 'info');
      } finally {
        setSaving(false);
      }
    }
  };

  const selectCity = async (city: string) => {
    const c = CITY_COORDS[city];
    if (c) await saveToBackend(city, c.lat, c.lng, true);
    else {
      setLocation(city);
      setLocationLocked(true);
    }
  };

  const searchLocation = async () => {
    if (!manualInput.trim()) return;
    setSearching(true);
    const result = await geocodeAddressWithLabel(manualInput);
    setSearching(false);
    if (result) {
      await saveToBackend(result.label, result.lat, result.lng, true);
      showToast(`Location set to ${result.label}`, 'success');
    } else {
      showToast('Location not found. Try a different address.', 'error');
    }
  };

  if (showMap) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className={cn('flex flex-wrap gap-3', compact && 'gap-2')}>
          <div className="flex flex-1 min-w-[200px] gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                placeholder="Or search a different area…"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <button
              type="button"
              onClick={searchLocation}
              disabled={searching}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium"
            >
              {searching ? '…' : 'Search'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin size={14} /> Quick select:
          </span>
          {LOCATIONS.slice(0, 6).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => selectCity(loc)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all',
                location === loc
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
              )}
            >
              {loc.split(',')[0]}
            </button>
          ))}
        </div>

        <LocationMapSection compact={compact} height={compact ? '280px' : '360px'} searchRadiusKm={10} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <button
        type="button"
        onClick={() => refresh()}
        disabled={isDetecting || saving}
        className={cn(
          'flex items-center gap-2 rounded-xl font-medium transition-all',
          compact ? 'px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700' : 'btn-primary'
        )}
      >
        {isDetecting || saving ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
        Use My Current Location
      </button>

      <div className="flex flex-1 min-w-[200px] gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            placeholder="Search any city or area in India..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <button
          type="button"
          onClick={searchLocation}
          disabled={searching}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium"
        >
          {searching ? '...' : 'Search'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <MapPin size={14} /> Quick select:
        </span>
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => selectCity(loc)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-all',
              location === loc
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            )}
          >
            {loc.split(',')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
