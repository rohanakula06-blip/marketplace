'use client';

import { useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { geocodeAddressWithLabel } from '@/lib/geolocation';
import { applySessionSearchLocation } from '@/lib/location-service';
import { formatAccuracy } from '@/lib/location-utils';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface LocationControlsProps {
  compact?: boolean;
  className?: string;
}

export function LocationControls({ compact = false, className }: LocationControlsProps) {
  const { location, coords, locationAccuracy, locationReady, showToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const { useGps } = useCurrentLocation();
  const [manualInput, setManualInput] = useState('');
  const [searching, setSearching] = useState(false);

  const saveSearch = async (label: string, lat: number, lng: number) => {
    applySessionSearchLocation(label, lat, lng);
    if (user) {
      try {
        await api.location.update({ location: label, latitude: lat, longitude: lng });
      } catch {
        showToast('Location updated for this session', 'info');
      }
    }
  };

  const searchLocation = async () => {
    if (!manualInput.trim()) return;
    setSearching(true);
    const result = await geocodeAddressWithLabel(manualInput);
    setSearching(false);
    if (result) {
      await saveSearch(result.label, result.lat, result.lng);
      showToast(`Location set to ${result.label}`, 'success');
    } else {
      showToast('Location not found. Try e.g. Amalapuram or Visakhapatnam', 'error');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <button
        type="button"
        onClick={() => useGps()}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl font-medium transition-all',
          compact ? 'px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700' : 'btn-primary'
        )}
      >
        <Navigation size={16} />
        Use my current location
      </button>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            placeholder="Search city or area…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <button
          type="button"
          onClick={searchLocation}
          disabled={searching}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium"
        >
          {searching ? '…' : 'Go'}
        </button>
      </div>

      {locationReady && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-600">Active: </span>
            <span className="font-semibold text-slate-900">{location}</span>
            <p className="text-xs text-slate-400 mt-0.5">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              {formatAccuracy(locationAccuracy ?? undefined)
                ? ` · ${formatAccuracy(locationAccuracy ?? undefined)}`
                : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
