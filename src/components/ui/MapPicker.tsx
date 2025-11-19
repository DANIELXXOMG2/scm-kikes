'use client';

import { useEffect, useState } from 'react';

import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  const map = useMapEvents({
    click(event) {
      setPosition(event.latlng);
      map.flyTo(event.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} icon={customIcon} />;
}

interface MapPickerProps {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER = { lat: 4.142, lng: -73.6266 };

export default function MapPicker({ lat, lng, onLocationSelect }: MapPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null,
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (position) {
      onLocationSelect(position.lat, position.lng);
    }
  }, [position, onLocationSelect]);

  if (!isClient) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-accent/20 bg-secondary text-sm text-text-dark/70">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-accent/20 z-0">
      <MapContainer center={position || DEFAULT_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
