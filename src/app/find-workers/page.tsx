'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Star, MapPin, Shield, MessageCircle, Filter, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { LocationControls } from '@/components/maps/LocationControls';
import { useUIStore } from '@/store/app-store';
import { api } from '@/lib/api';
import type { MapMarker } from '@/components/maps/MapView';

const LocationMapSection = dynamic(
  () => import('@/components/maps/LocationMapSection').then((m) => m.LocationMapSection),
  { ssr: false }
);

interface Worker {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: number;
  pricing: string;
  experience: number;
  matchScore: number;
  verificationStatus: string;
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
}

export default function FindWorkersPage() {
  const { coords, location, locationReady, setBookingModal, setWorkerProfileModal, setMessageModal } = useUIStore();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const nearestDistance = workers[0]?.distance;
  const noLocalWorkers = !loading && workers.length > 0 && nearestDistance != null && nearestDistance > 50;

  useEffect(() => {
    if (!locationReady) return;
    setLoading(true);
    api.workers
      .list({ lat: coords.lat, lng: coords.lng, category: category || undefined, sort: 'nearest' })
      .then((d) => setWorkers(d.workers as unknown as Worker[]))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [coords, category, locationReady]);

  const mapMarkers: MapMarker[] = workers.slice(0, 15).map((w) => ({
    id: w.id,
    lat: w.latitude ?? coords.lat,
    lng: w.longitude ?? coords.lng,
    title: w.name,
    subtitle: `${w.category} · ${w.distance} km · ${w.rating}★`,
    type: 'worker' as const,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Find Nearby Professionals</h1>
          <p className="text-slate-500 mt-1">Map centers on your GPS location automatically</p>
        </div>

        {noLocalWorkers && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Your location looks correct ({location.split(',')[0]}), but demo professionals are seeded around{' '}
            <strong>Konaseema</strong> only — nearest is ~{nearestDistance} km away.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" /> Location
              </h3>
              <LocationControls compact />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Filter size={18} className="text-blue-600" /> Filter
              </h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">All Categories</option>
                {['electrician', 'plumber', 'tutor', 'cleaning', 'carpenter', 'painter', 'appliance', 'mechanic', 'beauty', 'gardening'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                  <Loader2 size={18} className="animate-spin" /> Loading…
                </div>
              ) : workers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No professionals found nearby.</div>
              ) : (
                workers.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                        {w.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-slate-900 truncate">{w.name}</h4>
                          {w.verificationStatus === 'verified' && (
                            <Shield size={14} className="text-teal-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500 capitalize">{w.category}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-0.5">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            {w.rating}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MapPin size={12} />
                            {w.distance} km
                          </span>
                          <span className="text-blue-600 font-medium">{w.matchScore}% match</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{w.pricing}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setWorkerProfileModal(w.id)}
                        className="flex-1 text-xs py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setMessageModal({ userId: w.id })}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        onClick={() => setBookingModal(true, w.id)}
                        className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <LocationMapSection
              markers={mapMarkers}
              searchRadiusKm={15}
              height="calc(100vh - 180px)"
              onMarkerClick={(id) => setWorkerProfileModal(id)}
              footer={
                <p className="text-xs text-slate-400 text-center">
                  {workers.length} professionals · blue circle = 15 km search radius · green dot = you
                </p>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
