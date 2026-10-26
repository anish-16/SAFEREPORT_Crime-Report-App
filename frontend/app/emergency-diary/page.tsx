'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PhoneCall,
  Search,
  ShieldCheck,
  MapPin,
  Phone,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import {
  CITIES,
  COUNTRIES,
  CITY_AUTHORITIES,
  countryByCode,
  searchCities,
  type Authority,
} from '@/lib/emergency-data';
import { cn } from '@/lib/utils';

/**
 * Emergency Diary — type your city, the country auto-selects, and the full
 * list of authorities loads with a Call button per entry.
 *
 * Calling flow (strict): Call → confirmation popup → "Yes" opens the phone's
 * built-in dialer with the number ready. We NEVER place the call ourselves —
 * the user decides inside their own dialer.
 */

const KIND_META: Record<Authority['kind'], { label: string; classes: string }> = {
  Police: { label: 'Police', classes: 'bg-sky-500/15 text-sky-400' },
  Fire: { label: 'Fire', classes: 'bg-red-500/15 text-red-400' },
  Ambulance: { label: 'Ambulance', classes: 'bg-emerald-500/15 text-emerald-400' },
  Women: { label: 'Women', classes: 'bg-pink-500/15 text-pink-400' },
  Child: { label: 'Child', classes: 'bg-amber-500/15 text-amber-400' },
  Cyber: { label: 'Cyber', classes: 'bg-primary/15 text-primary' },
  Disaster: { label: 'Disaster', classes: 'bg-orange-500/15 text-orange-400' },
  Road: { label: 'Road', classes: 'bg-yellow-500/15 text-yellow-400' },
  Crisis: { label: 'Crisis', classes: 'bg-teal-500/15 text-teal-400' },
  Other: { label: 'Emergency', classes: 'bg-muted text-muted-foreground' },
};

const EXAMPLE_CITIES = ['Bengaluru', 'Delhi', 'Mumbai', 'Dubai', 'London', 'Singapore'];

function AuthorityRow({ a, onCall }: { a: Authority; onCall: (a: Authority) => void }) {
  const meta = KIND_META[a.kind];
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 transition hover:border-border hover:bg-muted">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.classes)}>
        <Phone className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{a.name}</p>
          <span className={cn('rounded px-1.5 py-0.5 text-step-small font-bold ', meta.classes)}>
            {meta.label}
          </span>
        </div>
        {a.note && <p className="mt-0.5 truncate text-step-small text-muted-foreground">{a.note}</p>}
      </div>
      <span className="hidden tabular-nums text-sm font-bold tabular-nums text-foreground/90 sm:block">
        {a.number}
      </span>
      <button
        onClick={() => onCall(a)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-step-small font-bold text-success-foreground transition hover:brightness-110"
      >
        <PhoneCall className="h-3.5 w-3.5" />
        Call
      </button>
    </li>
  );
}

export default function EmergencyDiaryPage() {
  const [cityQuery, setCityQuery] = useState('');
  const [city, setCity] = useState<{ name: string; country: string } | null>(null);
  const [countryCode, setCountryCode] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [confirm, setConfirm] = useState<Authority | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => searchCities(cityQuery), [cityQuery]);
  const country = countryByCode(countryCode);

  const extras =
    city && city.country === countryCode
      ? (CITY_AUTHORITIES[city.name.toLowerCase()] ?? [])
      : [];

  function pickCity(c: { name: string; country: string }) {
    setCity(c);
    setCityQuery(c.name);
    setCountryCode(c.country); // auto country selection
    setOpen(false);
    setActive(-1);
  }

  function dial(a: Authority) {
    // hand off to the phone's internal dialer — the user places the call
    const num = a.number.replace(/[^\d+]/g, '');
    setConfirm(null);
    try {
      window.location.href = `tel:${num}`;
    } catch {
      // desktop browsers without a telephony handler simply do nothing
    }
  }

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

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
      pickCity(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* header */}
      <div className="mb-8 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-step-small font-semibold text-primary">
          <PhoneCall className="h-3.5 w-3.5" /> Emergency Diary
        </span>
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">
          Every emergency number for your city
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Type your city — the country auto-selects and the list of authorities loads below with a
          Call button each. Tapping Call asks for confirmation, then opens{' '}
          <span className="font-semibold text-foreground">your phone&apos;s dialer</span> with the
          number ready. You decide whether to call — we never dial automatically.
        </p>
      </div>

      {/* selector */}
      <div className="card-base mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* city input */}
          <div ref={boxRef} className="relative">
            <label className="mb-1.5 block text-step-small font-medium text-muted-foreground">
              Type your city
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setCity(null);
                  setOpen(true);
                  setActive(-1);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                className="input-base pl-9"
                placeholder="e.g. Bengaluru, Delhi, Dubai, London…"
                aria-label="Your city"
              />
            </div>
            {open && suggestions.length > 0 && (
              <ul data-taste-skill-ignore="a real overlay menu keeps its lift" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto border border-border bg-card shadow-2xl">
                {suggestions.map((c, i) => {
                  const ctry = countryByCode(c.country);
                  return (
                    <li key={`${c.name}-${c.country}`}>
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => pickCity(c)}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition',
                          active === i ? 'bg-primary/10' : 'hover:bg-muted'
                        )}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="flex-1">{c.name}</span>
                        <span className="text-step-small text-muted-foreground">
                          {ctry?.flag} {ctry?.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!city && suggestions.length === 0 && cityQuery.trim().length >= 3 && (
              <p className="mt-1.5 text-step-small text-muted-foreground">
                Not in the bundled city list — pick your country manually on the right.
              </p>
            )}
          </div>

          {/* country (auto-selected) */}
          <div>
            <label className="mb-1.5 block text-step-small font-medium text-muted-foreground">
              Country <span className="opacity-60">(auto-selected from your city)</span>
            </label>
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="input-base appearance-none pr-9"
                aria-label="Country"
              >
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {city && country && city.country === country.code && (
              <p className="mt-1.5 flex items-center gap-1.5 text-step-small font-medium text-success">
                <ShieldCheck className="h-3 w-3" /> Auto-selected from “{city.name}”
              </p>
            )}
          </div>
        </div>

        {!country && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-step-small text-muted-foreground">
            <span>Try:</span>
            {EXAMPLE_CITIES.map((name) => (
              <button
                key={name}
                onClick={() => {
                  const c = CITIES.find((x) => x.name === name);
                  if (c) pickCity(c);
                }}
                className="rounded-full border border-border bg-muted px-3 py-1 transition hover:border-accent/40 hover:text-accent"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* authority list */}
      {!country ? (
        <div className="card-base flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-primary">
            <MapPin className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold">Type your city to open your diary</p>
          <p className="max-w-sm text-step-small leading-relaxed text-muted-foreground">
            The country selects itself from what you type, then every police, fire, ambulance and
            helpline number that serves you appears below — bundled offline, no API needed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {extras.length > 0 && city && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4" /> City desks — {city.name}
              </h2>
              <ul className="space-y-2.5">
                {extras.map((a) => (
                  <AuthorityRow key={`x-${a.number}-${a.name}`} a={a} onCall={setConfirm} />
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> National authorities —{' '}
              <span className="text-foreground">
                {country.flag} {country.name}
              </span>
            </h2>
            <ul className="space-y-2.5">
              {country.authorities.map((a) => (
                <AuthorityRow key={`${a.number}-${a.name}`} a={a} onCall={setConfirm} />
              ))}
            </ul>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/[0.06] p-4 text-step-small leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>
              Numbers are standard national/regional helplines bundled with this app. If you are
              ever unsure, dial your country&apos;s general emergency line (112 / 911 / 100).
              SafeReport never places a call for you — every call goes through your own dialer
              after you confirm.
            </span>
          </div>
        </div>
      )}

      {/* confirmation modal */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirm(null);
          }}
        >
          <div className="card-base w-full max-w-sm animate-fade-up p-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <PhoneCall className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold">Call {confirm.name}?</h3>
            <p className="mt-3 border border-border bg-card px-4 py-2.5 text-xl font-semibold tabular-nums">
              {confirm.number}
            </p>
            <p className="mt-4 text-step-small leading-relaxed text-muted-foreground">
              You will be handed to <span className="font-semibold text-foreground">your phone&apos;s
              dialer</span> with this number ready. SafeReport does <em>not</em> place the call —
              from the dialer it is your decision whether to press call (you can edit the number
              there too).
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => dial(confirm)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-success-foreground transition hover:brightness-110"
              >
                <Phone className="h-4 w-4" />
                Yes, open dialer
              </button>
            </div>
            <button
              onClick={() => setConfirm(null)}
              className="mt-3 text-step-small text-muted-foreground underline hover:text-foreground"
            >
              Never mind
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
