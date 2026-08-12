'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Loader2, Search } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { useAuthStore } from '@/store/app-store';
import { useGeolocation, resolveLocationFromGps, geocodeAddressWithLabel, CITY_COORDS } from '@/lib/geolocation';
import { isKrishnaWestLng, formatAccuracy } from '@/lib/location-utils';
import { LOCATIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const MapView = dynamic(() => import('@/components/maps/MapView'), { ssr: false, loading: () => (
  <div className="h-[300px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading map...</div>
)});

interface LocationPickerProps {
  showMap?: boolean;
  compact?: boolean;
  className?: string;
}

export function LocationPicker({ showMap = true, compact = false, className }: LocationPickerProps) {
  const { location, setLocation, coords, setCoords, showToast, setLocationLocked, locationAccuracy } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { getCurrentPosition, loading: geoLoading, error: geoError } = useGeolocation();
  const [manualInput, setManualInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountSynced, setAccountSynced] = useState(false);

  const saveToBackend = async (
    label: string,
    lat: number,
    lng: number,
    locked = false,
    accuracyMeters?: number | null
  ) => {
    setCoords(lat, lng, label, accuracyMeters ?? null);
    setLocationLocked(locked);
    setAccountSynced(false);
    if (user) {
      setSaving(true);
      try {
        await api.location.update({ location: label, latitude: lat, longitude: lng });
        setUser({ ...user, location: label });
        setAccountSynced(true);
      } catch {
        showToast('Location saved on this device', 'info');
      } finally {
        setSaving(false);
      }
    }
  };

  const detectLocation = async () => {
    try {
      setLocationLocked(false);
      const pos = await getCurrentPosition();
      const resolved = await resolveLocationFromGps(pos);
      await saveToBackend(resolved.label, resolved.lat, resolved.lng, false, resolved.accuracy);

      if (isKrishnaWestLng(pos.lng) || (pos.accuracy != null && pos.accuracy > 8000)) {
        showToast('GPS looks approximate. Tap Amalapuram if you are in Konaseema.', 'info');
      } else {
        showToast(`Location set to ${resolved.label}`, 'success');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Location failed', 'error');
    }
  };

  const selectCity = async (city: string) => {
    const c = CITY_COORDS[city];
    if (c) await saveToBackend(city, c.lat, c.lng, true, null);
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

  const showGudivadaHint =
    (isKrishnaWestLng(coords.lng) || location.toLowerCase().includes('gudivada')) &&
    (locationAccuracy == null || locationAccuracy > 3000);

  return (
    <div className={cn('space-y-4', className)}>
      {showGudivadaHint && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Showing <strong>Gudivada/Krishna</strong> from approximate GPS. If you are in{' '}
          <strong>Amalapuram</strong>, tap <strong>Amalapuram</strong> below.
        </div>
      )}

      <div className={cn('flex flex-wrap gap-3', compact && 'gap-2')}>
        <button onClick={detectLocation} disabled={geoLoading || saving}
          className={cn('flex items-center gap-2 rounded-xl font-medium transition-all',
            compact ? 'px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700' : 'btn-primary')}>
          {geoLoading || saving ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          Use My Current Location
        </button>
        <div className="flex flex-1 min-w-[200px] gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={manualInput} onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
              placeholder="Search e.g. Amalapuram..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <button onClick={searchLocation} disabled={searching}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium">
            {searching ? '...' : 'Search'}
          </button>
        </div>
      </div>

      {geoError && <p className="text-sm text-red-500">{geoError}</p>}

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={14} /> Quick select:</span>
        {LOCATIONS.map((loc) => (
          <button key={loc} onClick={() => selectCity(loc)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-all',
              location === loc ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400',
              loc.startsWith('Amalapuram') && 'ring-2 ring-blue-200')}>
            {loc.split(',')[0]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm flex-wrap">
        <MapPin size={16} className="text-blue-600" />
        <span className="text-slate-600">Active location:</span>
        <span className="font-semibold text-slate-900">{location}</span>
        <span className="text-slate-400 text-xs">
          ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
          {formatAccuracy(locationAccuracy ?? undefined) ? ` · ${formatAccuracy(locationAccuracy ?? undefined)}` : ''}
        </span>
        {user && accountSynced && <span className="text-xs text-green-600">· synced to account</span>}
      </div>

      {showMap && <MapView center={[coords.lat, coords.lng]} zoom={13} radiusKm={10} height={compact ? '250px' : '320px'} />}
    </div>
  );
}
