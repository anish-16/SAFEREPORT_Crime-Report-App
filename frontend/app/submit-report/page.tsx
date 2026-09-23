'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Upload,
  X,
  Brain,
  Send,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  MapPin,
  Paperclip,
  FileText,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, hasSession } from '@/lib/api';
import type { AnalysisResult, ReportType } from '@/lib/types';
import { AnalysisPanel } from '@/components/analysis-panel';
import { LocationInput } from '@/components/location-input';
import { PriorityBadge } from '@/components/badges';
import { CATEGORY_LABELS, CATEGORY_AUTHORITY } from '@/lib/categories';
import { cn } from '@/lib/utils';

/**
 * Enterprise-style anonymous incident intake.
 * - location auto-detects by default, with pincode/city/state suggestions
 * - the local intelligence engine auto-fills type, category, title and
 *   description from photo/video/text — every field stays editable
 * - the right rail previews exactly what will be submitted, live
 */

interface AutoFill {
  type: boolean;
  category: boolean;
  title: boolean;
  description: boolean;
}

export default function SubmitReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReportType>('NON_EMERGENCY');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });
  const [file, setFile] = useState<File | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisErr, setAnalysisErr] = useState('');

  const [auto, setAuto] = useState<AutoFill>({
    type: false,
    category: false,
    title: false,
    description: false,
  });
  /** once a field is touched by the reporter, the engine never overwrites it */
  const locked = useRef<AutoFill>({ type: false, category: false, title: false, description: false });
  const applied = useRef<AutoFill>({ type: false, category: false, title: false, description: false });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !hasSession()) router.replace('/auth/signin');
  }, [loading, router]);

  // live analysis (debounced) whenever inputs settle
  useEffect(() => {
    if (!hasSession()) return;
    if (title.trim().length < 4 && description.trim().length < 15 && !file) {
      setAnalysis(null);
      return;
    }
    const t = setTimeout(async () => {
      setAnalyzing(true);
      setAnalysisErr('');
      try {
        const form = new FormData();
        form.append('title', title);
        form.append('description', description);
        if (location.trim()) form.append('location', location.trim());
        if (file) form.append('media', file);
        const { analysis } = await api.postForm<{ analysis: AnalysisResult }>('/reports/analyze', form);
        setAnalysis(analysis);

        // auto-fill any field the reporter hasn't touched yet
        const s = analysis.suggestions;
        if (s) {
          if (!locked.current.category && !applied.current.category) {
            applied.current.category = true;
            setCategory(s.category);
            setAuto((a) => ({ ...a, category: true }));
          }
          if (!locked.current.type && !applied.current.type) {
            applied.current.type = true;
            setType(s.type);
            setAuto((a) => ({ ...a, type: true }));
          }
          if (!locked.current.title && !applied.current.title) {
            applied.current.title = true;
            setTitle(s.title);
            setAuto((a) => ({ ...a, title: true }));
          }
          if (!locked.current.description && !applied.current.description) {
            applied.current.description = true;
            setDescription(s.description);
            setAuto((a) => ({ ...a, description: true }));
          }
        }
      } catch (err) {
        setAnalysisErr(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setAnalyzing(false);
      }
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, location, file]);

  function edit<K extends keyof AutoFill>(key: K, apply: () => void) {
    locked.current[key] = true;
    if (auto[key]) setAuto((a) => ({ ...a, [key]: false }));
    apply();
  }

  function onPickFile(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > 60 * 1024 * 1024) {
      setError('File too large (max 60 MB)');
      return;
    }
    setError('');
    setFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('type', type);
      if (category) form.append('category', category);
      if (location.trim()) form.append('location', location.trim());
      if (coords.lat !== null) form.append('latitude', String(coords.lat));
      if (coords.lon !== null) form.append('longitude', String(coords.lon));
      if (file) form.append('media', file);
      const { report } = await api.postForm<{ report: { reportId: string } }>('/reports', form);
      setDoneId(report.reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (doneId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="card-base animate-fade-up p-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <Send className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold">Report submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save this report ID — you can use it to track progress without an account:
          </p>
          <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 py-3 font-mono text-lg font-bold text-primary">
            {doneId}
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-success/25 bg-success/[0.06] p-3 text-left text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              Filed <span className="font-semibold text-foreground">anonymously</span> — no name,
              email or phone was written into the report. Your account is linked only so{' '}
              <span className="font-semibold text-foreground">you</span> can track it.
            </span>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push(`/track-report?id=${doneId}`)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Track it
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold"
            >
              My dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const authority =
    (category && CATEGORY_AUTHORITY[category]) ||
    analysis?.suggestions?.authority ||
    CATEGORY_AUTHORITY['General Incident'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* header */}
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-success">
            <Lock className="h-3 w-3" /> Anonymous Intake
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-muted-foreground">
            FORM SR-F2 · INCIDENT REPORT
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
          File an incident report
        </h1>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] p-4 text-sm leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p>
            Your name and personal details are{' '}
            <span className="font-semibold text-foreground">never written into this report</span>.
            You are signed in as{' '}
            <span className="font-semibold text-foreground">{user?.email}</span> only so{' '}
            <span className="font-semibold text-foreground">you</span> can track your own
            submissions — nobody else can see them, and the public never sees who filed.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* form */}
        <form onSubmit={onSubmit} className="card-base space-y-7 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* 01 — classification */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black text-primary">01</span>
                <h2 className="text-xs font-bold uppercase tracking-widest">Classification</h2>
              </div>
              {auto.type && (
                <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  <Sparkles className="h-3 w-3" /> AI-filled · editable
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['NON_EMERGENCY', 'EMERGENCY'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => edit('type', () => setType(t))}
                  className={
                    type === t
                      ? t === 'EMERGENCY'
                        ? 'rounded-xl border border-destructive bg-destructive/15 px-4 py-3 text-sm font-bold text-destructive transition'
                        : 'rounded-xl border border-primary bg-primary/15 px-4 py-3 text-sm font-bold text-primary transition'
                      : 'rounded-xl border border-white/10 px-4 py-3 text-sm text-muted-foreground transition hover:bg-white/[0.04]'
                  }
                >
                  <span className="block">{t === 'EMERGENCY' ? '🚨 Emergency' : '📋 Non-emergency'}</span>
                  <span className="mt-0.5 block text-[10px] font-medium opacity-70">
                    {t === 'EMERGENCY' ? 'Immediate response required' : 'General report'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                Incident category
                {auto.category && (
                  <span className="flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    <Sparkles className="h-2.5 w-2.5" /> AI-classified · editable
                  </span>
                )}
              </label>
              <select
                required
                value={category}
                onChange={(e) => {
                  locked.current.category = true;
                  if (auto.category) setAuto((a) => ({ ...a, category: false }));
                  setCategory(e.target.value);
                }}
                className="input-base"
              >
                <option value="">Select or let the AI classify…</option>
                {CATEGORY_LABELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Routed to:{' '}
                <span className="font-semibold text-foreground/80">{authority}</span>
                {analysis?.suggestions && (
                  <>
                    {' · '}
                    AI draft from{' '}
                    <span className="text-foreground/80">
                      {analysis.suggestions.source === 'text'
                        ? 'your text'
                        : analysis.suggestions.source === 'media'
                          ? 'your photo / video'
                          : 'text + media'}
                    </span>
                  </>
                )}
              </p>
            </div>
          </section>

          {/* 02 — details */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black text-primary">02</span>
                <h2 className="text-xs font-bold uppercase tracking-widest">What happened</h2>
              </div>
              {auto.title && (
                <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  <Sparkles className="h-3 w-3" /> AI-filled · editable
                </span>
              )}
            </div>

            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
            <input
              required
              minLength={4}
              value={title}
              onChange={(e) => edit('title', () => setTitle(e.target.value))}
              className="input-base"
              placeholder="e.g. Phone snatched near metro station"
            />

            <label className="mb-1.5 mt-4 block text-xs font-medium text-muted-foreground">
              Description{' '}
              <span className="text-muted-foreground/60">(min 15 chars)</span>
              {auto.description && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  <Sparkles className="h-2.5 w-2.5" /> AI-filled · editable
                </span>
              )}
            </label>
            <textarea
              required
              minLength={15}
              rows={6}
              value={description}
              onChange={(e) => edit('description', () => setDescription(e.target.value))}
              className="input-base resize-y"
              placeholder="Include time, place, vehicle plates, description of suspects, direction they fled…"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {description.trim().length} characters
            </p>
          </section>

          {/* 03 — location */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black text-primary">03</span>
                <h2 className="text-xs font-bold uppercase tracking-widest">Location</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Auto-detected
              </span>
            </div>
            <LocationInput
              value={location}
              onChange={(v) => setLocation(v)}
              onCoordsChange={(lat, lon) => setCoords({ lat, lon })}
            />
          </section>

          {/* 04 — evidence */}
          <section>
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black text-primary">04</span>
                <h2 className="text-xs font-bold uppercase tracking-widest">Evidence</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Photo / video · max 60 MB
              </span>
            </div>
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                {file.type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(file)} alt="preview" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    className="h-14 w-24 rounded-lg bg-black object-cover"
                    muted
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB ·{' '}
                    {analyzing ? 'analyzing…' : 'analyzed — fields auto-filled above'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onPickFile(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/[0.04]">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Drop a file or click to browse</span>
                <span className="text-xs text-muted-foreground">
                  Attach evidence — the engine fills your report fields from it
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit report anonymously
              </>
            )}
          </button>
        </form>

        {/* live rail */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* correlated preview of the actual report */}
          <div className="card-base mb-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-primary/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Report preview
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Live · updates as you type
              </span>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                    type === 'EMERGENCY'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {type === 'EMERGENCY' ? '🚨 Emergency' : '📋 Non-emergency'}
                </span>
                <span className="rounded-md bg-white/[0.07] px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {category || 'Uncategorized'}
                </span>
                {analysis && <PriorityBadge priority={analysis.triage.priority} />}
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-bold leading-snug',
                    title ? 'text-foreground' : 'text-muted-foreground/50 italic'
                  )}
                >
                  {title || 'Your report title will appear here…'}
                </p>
                <p
                  className={cn(
                    'mt-1.5 line-clamp-3 text-xs leading-relaxed',
                    description ? 'text-muted-foreground' : 'text-muted-foreground/50 italic'
                  )}
                >
                  {description || 'The description will mirror here as you write it…'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {location || <span className="italic opacity-60">Location auto-detecting…</span>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                {file ? file.name : <span className="italic opacity-60">No evidence attached</span>}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground/80">Routed to: </span>
                {authority}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  Anonymous — no identity fields
                </span>
                <span className="font-mono">ID: assigned on submit</span>
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Brain className="h-4 w-4 text-primary" />
            Live analysis
            {analyzing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          </div>

          {analysisErr && (
            <div className="card-base p-4 text-sm text-destructive">{analysisErr}</div>
          )}

          {analysis ? (
            <AnalysisPanel analysis={analysis} />
          ) : (
            <div className="card-base flex flex-col items-center gap-2 p-8 text-center">
              <Brain className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">{analyzing ? 'Analyzing…' : 'Waiting for input'}</p>
              <p className="text-xs text-muted-foreground">
                Attach a photo or video — or start typing — and the engine classifies the incident
                and drafts your report fields for you to review. All processing runs on this
                machine.
              </p>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">No cloud AI.</strong> Classification uses a local
            lexicon, images are measured for blur/exposure/EXIF, and videos are probed with a local
            media stack — nothing is sent to Gemini, OpenAI, or any external model API.
          </div>
        </div>
      </div>
    </div>
  );
}
