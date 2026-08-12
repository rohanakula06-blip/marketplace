'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const workerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const jobIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<span class="user-location-dot"></span><span class="user-location-pulse"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type?: 'worker' | 'user' | 'job';
}

function zoomForAccuracy(accuracyMeters?: number | null): number {
  if (accuracyMeters == null) return 14;
  if (accuracyMeters <= 50) return 17;
  if (accuracyMeters <= 200) return 16;
  if (accuracyMeters <= 1000) return 15;
  if (accuracyMeters <= 5000) return 13;
  return 12;
}

function MapController({
  center,
  zoom,
  fly,
}: {
  center: [number, number];
  zoom: number;
  fly: boolean;
}) {
  const map = useMap();
  const prev = useRef({ lat: center[0], lng: center[1], zoom });

  useEffect(() => {
    const moved =
      prev.current.lat !== center[0] ||
      prev.current.lng !== center[1] ||
      prev.current.zoom !== zoom;

    if (!moved) return;

    if (fly) {
      map.flyTo(center, zoom, { duration: 0.65 });
    } else {
      map.setView(center, zoom, { animate: false });
    }
    prev.current = { lat: center[0], lng: center[1], zoom };
  }, [center, zoom, map, fly]);

  return null;
}

export interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  searchRadiusKm?: number;
  accuracyMeters?: number | null;
  height?: string;
  className?: string;
  onMarkerClick?: (id: string) => void;
  onRecenter?: () => void;
  recentering?: boolean;
  showRecenter?: boolean;
  animateCenter?: boolean;
}

export default function MapView({
  center,
  zoom,
  markers = [],
  searchRadiusKm,
  accuracyMeters,
  height = '400px',
  className = '',
  onMarkerClick,
  onRecenter,
  recentering = false,
  showRecenter = true,
  animateCenter = true,
}: MapViewProps) {
  const effectiveZoom = zoom ?? zoomForAccuracy(accuracyMeters);

  const markerIcon = useMemo(
    () => ({
      worker: workerIcon,
      job: jobIcon,
      user: userIcon,
    }),
    []
  );

  return (
    <div className={cn('relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg', className)} style={{ height }}>
      <MapContainer
        key={`map-${center[0].toFixed(4)}-${center[1].toFixed(4)}`}
        center={center}
        zoom={effectiveZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={effectiveZoom} fly={animateCenter} />

        {accuracyMeters != null && accuracyMeters > 0 && (
          <Circle
            center={center}
            radius={accuracyMeters}
            pathOptions={{
              color: '#22c55e',
              fillColor: '#22c55e',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6 4',
            }}
          />
        )}

        {searchRadiusKm != null && (
          <Circle
            center={center}
            radius={searchRadiusKm * 1000}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 0.06,
              weight: 2,
            }}
          />
        )}

        <Marker position={center} icon={userIcon}>
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>

        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={markerIcon[m.type ?? 'worker'] ?? workerIcon}
            eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
          >
            <Popup>
              <strong>{m.title}</strong>
              {m.subtitle && (
                <>
                  <br />
                  <span className="text-sm">{m.subtitle}</span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showRecenter && onRecenter && (
        <button
          type="button"
          onClick={onRecenter}
          disabled={recentering}
          className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
          aria-label="Center map on my location"
        >
          {recentering ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
          My location
        </button>
      )}
    </div>
  );
}
