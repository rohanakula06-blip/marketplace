'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const workerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type?: 'worker' | 'user' | 'job';
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prev = useRef(center);
  useEffect(() => {
    if (prev.current[0] !== center[0] || prev.current[1] !== center[1]) {
      map.setView(center, zoom);
      prev.current = center;
    }
  }, [center, zoom, map]);
  return null;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  radiusKm?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (id: string) => void;
}

export default function MapView({
  center,
  zoom = 13,
  markers = [],
  radiusKm,
  height = '400px',
  className = '',
  onMarkerClick,
}: MapViewProps) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 shadow-lg ${className}`} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        {radiusKm && (
          <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08, weight: 2 }} />
        )}
        <Marker position={center} icon={userIcon}>
          <Popup>Your location</Popup>
        </Marker>
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={m.type === 'user' ? userIcon : workerIcon}
            eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
          >
            <Popup>
              <strong>{m.title}</strong>
              {m.subtitle && <><br /><span className="text-sm">{m.subtitle}</span></>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
