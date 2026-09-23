'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2, MapPin, Calendar, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import type { Report } from '@/lib/types';
import { StatusBadge } from '@/components/badges';
import { AnalysisPanel } from '@/components/analysis-panel';
import { formatDate } from '@/lib/utils';

function TrackForm() {
  const params = useSearchParams();
  const [id, setId] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function lookup(code: string) {
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    setReport(null);
    setLoaded(true);
    try {
      const clean = code.trim().toUpperCase();
      const { report } = await api.get<{ report: Report }>(`/reports/track/${clean}`);
      setReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setBusy(false);
    }
  }

  // auto-lookup from ?id=
  useEffect(() => {
    const preset = params.get('id');
    if (preset && !loaded) {
      setId(preset);
      void lookup(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const timeline = report?.events ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Track a report</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter the report ID (e.g. <span className="font-mono text-accent">SR-1A2B3C4D</span>) to see
          its live status — no login needed.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(id);
        }}
        className="mb-8 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="input-base pl-10 font-mono uppercase"
            placeholder="SR-XXXXXXXX"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
        </button>
      </form>

      {error && (
        <div className="card-base flex items-center gap-2 border-destructive/30 p-4 text-sm text-destructive">
          <ShieldAlert className="h-4 w-4" />
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-4 animate-fade-up">
          <div className="card-base p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-sm font-bold text-accent">{report.reportId}</span>
                <h2 className="mt-1 text-lg font-bold">{report.title}</h2>
              </div>
              <StatusBadge status={report.status} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {report.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(report.createdAt)}
              </span>
              {report.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {report.location}
                </span>
              )}
              <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5">{report.type.replace('_', ' ')}</span>
              {report.category && <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5">{report.category}</span>}
            </div>

            {report.mediaUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                {report.mediaType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={report.mediaUrl} alt="Evidence" className="max-h-96 w-full object-contain bg-black/40" />
                ) : (
                  <video src={report.mediaUrl} controls className="max-h-96 w-full bg-black" />
                )}
              </div>
            )}
          </div>

          {/* timeline */}
          <div className="card-base p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Status timeline</h3>
            <ol className="relative space-y-5 border-l border-white/10 pl-5">
              {timeline.map((ev, i) => (
                <li key={ev.id} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background ${
                      i === timeline.length - 1 ? 'bg-primary' : 'bg-muted-foreground/50'
                    }`}
                  />
                  <p className="text-sm font-semibold">
                    {ev.to.replace('_', ' ')}
                    {i === 0 && <span className="ml-2 text-[10px] font-normal uppercase text-muted-foreground">initial</span>}
                  </p>
                  {ev.note && <p className="mt-0.5 text-xs text-muted-foreground">{ev.note}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatDate(ev.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>

          {report.analysis && <AnalysisPanel analysis={report.analysis} />}
        </div>
      )}

      {loaded && !report && !error && !busy && (
        <p className="text-center text-sm text-muted-foreground">No report found.</p>
      )}
    </div>
  );
}

export default function TrackReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <TrackForm />
    </Suspense>
  );
}
