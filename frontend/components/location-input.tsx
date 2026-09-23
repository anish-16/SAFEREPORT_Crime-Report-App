'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, Loader2, X, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Location field:
 *  - auto-detects the reporter's position on mount (browser geolocation +
 *    OpenStreetMap Nominatim reverse geocode) and fills itself by default
 *  - shows live suggestions as the user types a pincode, city, state or country
 *  - always editable — GPS fill is just the starting value
 * No API key required (Nominatim is keyless for reasonable usage).
 */

interface Props {
  value: string;
  onChange: (v: string) => void;
  onCoordsChange?: (lat: number | null, lon: number | null) => void;
  detectByDefault?: boolean;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

function formatAddress(addr: Record<string, string | undefined>, fallback: string): string {
  const label =
    [
      addr.neighbourhood || addr.suburb || addr.road || addr.hamlet || addr.pedestrian,
      addr.city || addr.town || addr.village || addr.county,
      addr.state,
      addr.country,
    ]
      .filter(Boolean)
      .join(', ') || fallback;
  return label;
}

export function LocationInput({ value, onChange, onCoordsChange, detectByDefault = true }: Props) {
  const [detecting, setDetecting] = useState(false);
  const [geoErr, setGeoErr] = useState('');
  const [auto, setAuto] = useState(false);
  const [fromSuggestion, setFromSuggestion] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const seq = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGeoErr('Geolocation is not supported here — type a city, pincode or address instead.');
      return;
    }
    setDetecting(true);
    setGeoErr('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `${NOMINATIM}/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('reverse geocode failed');
          const data = (await res.json()) as {
            display_name?: string;
            address?: Record<string, string | undefined>;
          };
          const label = formatAddress(data.address ?? {}, data.display_name ?? '');
          if (label) {
            onChange(label);
            setAuto(true);
            setFromSuggestion(false);
            onCoordsChange?.(latitude, longitude);
          } else {
            setGeoErr('Could not resolve your coordinates into an address.');
          }
        } catch {
          setGeoErr('Could not resolve your coordinates into an address.');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        setGeoErr(
          err.code === 1
            ? 'Location permission denied — type a city, pincode or address instead.'
            : "Couldn't read your location — type a city, pincode or address instead."
        );
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300_000 }
    );
  }

  // default auto-detection when the form opens
  useEffect(() => {
    if (detectByDefault) void detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live suggestions while typing (pincode / city / state / country)
  useEffect(() => {
    const q = value.trim();
    if (!open || q.length < 3) {
      setSuggestions([]);
      setActive(-1);
      return;
    }
    const mySeq = ++seq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM}/search?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = (await res.json()) as Suggestion[];
        if (mySeq !== seq.current) return;
        setSuggestions(Array.isArray(data) ? data : []);
        setActive(-1);
      } catch {
        if (mySeq === seq.current) setSuggestions([]);
      } finally {
        if (mySeq === seq.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [value, open]);

  // click outside closes the dropdown
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function pick(s: Suggestion) {
    onChange(s.display_name);
    setSuggestions([]);
    setOpen(false);
    setActive(-1);
    setAuto(false);
    setFromSuggestion(true);
    onCoordsChange?.(Number(s.lat), Number(s.lon));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setAuto(false);
            setFromSuggestion(false);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="input-base pl-9 pr-20"
          placeholder={
            detecting
              ? 'Auto-detecting your location…'
              : 'Type a pincode, city, state or country…'
          }
          aria-label="Incident location"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <button
              type="button"
              onClick={detectLocation}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-primary"
              aria-label="Use my current location"
              title="Use my current location"
            >
              <Navigation className="h-4 w-4" />
            </button>
          )}
          {value && !detecting && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setAuto(false);
                setFromSuggestion(false);
                onCoordsChange?.(null, null);
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              aria-label="Clear location"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl">
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lon}-${i}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
                className={cn(
                  'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition',
                  active === i ? 'bg-primary/10' : 'hover:bg-white/[0.05]'
                )}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-xs leading-snug text-foreground">
                  {s.display_name}
                </span>
                {s.type && (
                  <span className="mt-0.5 shrink-0 rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {s.type}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* status line */}
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
        {detecting ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Detecting your location…
          </span>
        ) : auto ? (
          <span className="flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-0.5 font-medium text-success">
            <LocateFixed className="h-3 w-3" /> Auto-detected via GPS — edit freely
          </span>
        ) : fromSuggestion ? (
          <span className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
            <MapPin className="h-3 w-3" /> Selected from suggestions
          </span>
        ) : geoErr ? (
          <span className="flex items-center gap-2 text-warning">
            {geoErr}
            <button type="button" onClick={detectLocation} className="underline hover:text-primary">
              Retry
            </button>
          </span>
        ) : (
          <span className="text-muted-foreground">
            Suggestions appear as you type a pincode, city, state or country.
          </span>
        )}
        {searching && <span className="text-muted-foreground">Searching…</span>}
      </div>
    </div>
  );
}
