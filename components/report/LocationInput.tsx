import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
}

const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LocationMarker = ({ position, onCoordinatesChange }: { position: [number, number] | null, onCoordinatesChange?: (lat: number | null, lng: number | null) => void }) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position);
  const map = useMap();

  useEffect(() => {
    if (position) {
      setMarkerPosition(position);
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setMarkerPosition([e.latlng.lat, e.latlng.lng]);
      onCoordinatesChange?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return markerPosition ? <Marker position={markerPosition} icon={markerIcon} /> : null;
};

export function LocationInput({ value, onChange, onCoordinatesChange }: LocationInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(() => {
    const [lat, lng] = value.split(",").map(Number);
    return !isNaN(lat) && !isNaN(lng) ? [lat, lng] : null;
  });

  const getLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCoords: [number, number] = [latitude, longitude];
          setCoordinates(newCoords);
          onCoordinatesChange?.(latitude, longitude);
          onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsGettingLocation(false);
        },
        (error) => {
          setLocationError(error.message);
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Unable to get your location");
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-400">Location</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter location or use map"
          className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 pl-4 pr-12 py-3.5 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        />
        <button
          type="button"
          onClick={getLocation}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isGettingLocation}
          title="Get current location"
        >
          📍
        </button>
      </div>
      {locationError && <p className="text-sm text-red-400">{locationError}</p>}
      <MapContainer center={coordinates || [51.505, -0.09]} zoom={13} style={{ height: "300px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker position={coordinates} onCoordinatesChange={(lat, lng) => {
          if (lat !== null && lng !== null) {
            setCoordinates([lat, lng]);
            onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            onCoordinatesChange?.(lat, lng);
          }
        }} />
      </MapContainer>
    </div>
  );
}
