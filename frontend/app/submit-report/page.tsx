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
  Route,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
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
  const { loading } = useAuth();
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

  /** AI provider config (open endpoint): when a key exists, enrich the draft. */
  const [aiCfg, setAiCfg] = useState<{ hasKey: boolean; model: string; providerLabel: string } | null>(null);
  useEffect(() => {
    api
      .get<{ settings: { hasKey: boolean; model: string; providerLabel: string } }>('/ai/settings')
      .then(({ settings }) => setAiCfg(settings))
      .catch(() => setAiCfg(null));
  }, []);

  /** content already sent through the AI pass, so each draft is billed once */
  const aiDoneFor = useRef('');
  const aiRunning = useRef(false);

  useEffect(() => {
    // live analysis (debounced) whenever inputs settle — no login required
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
        // a local refresh must not erase the AI verdict already shown for this
        // same draft (the location field often settles after the AI pass ran)
        setAnalysis((prev) => {
          if (!prev || (!prev.ai && !prev.aiError)) return analysis;
          const k = `${title}\u0000${description}\u0000${location}\u0000${file?.name ?? ''}`;
          if (aiDoneFor.current !== k) return analysis;
          return { ...analysis, ai: prev.ai, aiError: prev.aiError };
        });
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

  /**
   * AI enrichment: once the draft settles (3.5s without typing) and an API
   * key is configured in Settings → AI, the chosen model reviews the report
   * and returns a refined classification. Each distinct draft is sent once.
   */
  useEffect(() => {

    if (!aiCfg?.hasKey) return;
    if (title.trim().length < 8 || description.trim().length < 30) return;
    const key = `${title}\u0000${description}\u0000${location}\u0000${file?.name ?? ''}`;
    if (aiDoneFor.current === key) return;

    const t = setTimeout(async () => {
      if (aiRunning.current || aiDoneFor.current === key) return;
      aiRunning.current = true;
      try {
        const form = new FormData();
        form.append('title', title);
        form.append('description', description);
        if (location.trim()) form.append('location', location.trim());
        if (file) form.append('media', file);
        const { analysis } = await api.postForm<{ analysis: AnalysisResult }>(
          '/reports/analyze?ai=1',
          form
        );
        aiDoneFor.current = key;
        setAnalysis(analysis);

        // fields the reporter never touched may be upgraded to the AI draft
        const s = analysis.suggestions;
        if (s && analysis.ai) {
          if (!locked.current.category && s.category && s.category !== category) {
            setCategory(s.category);
            setAuto((a) => ({ ...a, category: true }));
          }
          if (!locked.current.type && s.type && s.type !== type) {
            setType(s.type);
            setAuto((a) => ({ ...a, type: true }));
          }
        }
      } catch {
        // AI pass failed — the local analysis already on screen stays put
      } finally {
        aiRunning.current = false;
      }
    }, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, location, file, aiCfg]);

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
          <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 py-3 tabular-nums text-lg font-bold text-primary">
            {doneId}
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-success/25 bg-success/[0.06] p-3 text-left text-step-small leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              Filed <span className="font-semibold text-foreground">anonymously</span> — no name,
              email or phone was written into the report. It already shows up under{' '}
              <span className="font-semibold text-foreground">My Reports</span> on this browser, so
              you can follow every status change without an account.
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
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold"
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-step-small font-bold  text-success">
            <Lock className="h-3 w-3" /> Anonymous Intake
          </span>
          <span className="rounded-full border border-border bg-muted px-3 py-1 tabular-nums text-step-small text-muted-foreground">
            FORM SR-F2 · INCIDENT REPORT
          </span>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight">File an incident report</h1>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] p-4 text-sm leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            No account needed — submit straight away. Your name and personal details are{' '}
            <span className="font-semibold text-foreground">never written into this report</span>;
            it is tracked by a private key kept in this browser, so{' '}
            <span className="font-semibold text-foreground">only you</span> see it under My
            Reports. Your history stays in this browser under a private key only this device
            holds.
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
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-step-body font-semibold">Classification</h2>
              </div>
              {auto.type && (
                <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-step-small font-bold  text-primary">
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
                      : 'rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted'
                  }
                >
                  <span className="block">{t === 'EMERGENCY' ? 'Emergency' : 'Non-emergency'}</span>
                  <span className="mt-0.5 block text-step-small font-medium opacity-70">
                    {t === 'EMERGENCY' ? 'Immediate response required' : 'General report'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1.5 flex items-center gap-2 text-step-small font-medium text-muted-foreground">
                Incident category
                {auto.category && (
                  <span className="flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-step-small font-bold  text-primary">
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
              <p className="mt-1 text-step-small text-muted-foreground">
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
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-step-body font-semibold">What happened</h2>
              </div>
              {auto.title && (
                <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-step-small font-bold  text-primary">
                  <Sparkles className="h-3 w-3" /> AI-filled · editable
                </span>
              )}
            </div>

            <label className="mb-1.5 block text-step-small font-medium text-muted-foreground">Title</label>
            <input
              required
              minLength={4}
              value={title}
              onChange={(e) => edit('title', () => setTitle(e.target.value))}
              className="input-base"
              placeholder="e.g. Phone snatched near metro station"
            />

            <label className="mb-1.5 mt-4 block text-step-small font-medium text-muted-foreground">
              Description{' '}
              <span className="text-muted-foreground/60">(min 15 chars)</span>
              {auto.description && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-step-small font-bold  text-primary">
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
            <p className="mt-1 text-step-small text-muted-foreground">
              {description.trim().length} characters
            </p>
          </section>

          {/* 03 — location */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-step-body font-semibold">Location</h2>
              </div>
              <span className="text-step-small font-bold  text-muted-foreground">
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
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-step-body font-semibold">Evidence</h2>
              </div>
              <span className="text-step-small font-bold  text-muted-foreground">
                Photo / video · max 60 MB
              </span>
            </div>
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3">
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
                  <p className="text-step-small text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB ·{' '}
                    {analyzing ? 'analyzing…' : 'analyzed — fields auto-filled above'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onPickFile(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/[0.04]">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Drop a file or click to browse</span>
                <span className="text-step-small text-muted-foreground">
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
            <div className="flex items-center justify-between bg-primary/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Report preview
              </div>
              <span className="text-step-small font-semibold text-muted-foreground">
                Live · updates as you type
              </span>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-step-small font-bold ',
                    type === 'EMERGENCY'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {type === 'EMERGENCY' ? 'Emergency' : 'Non-emergency'}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-step-small font-semibold text-muted-foreground">
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
                    'mt-1.5 line-clamp-3 text-step-small leading-relaxed',
                    description ? 'text-muted-foreground' : 'text-muted-foreground/50 italic'
                  )}
                >
                  {description || 'The description will mirror here as you write it…'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-step-small text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {location || <span className="italic opacity-60">Location auto-detecting…</span>}
              </div>
              <div className="flex items-center gap-1.5 text-step-small text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                {file ? file.name : <span className="italic opacity-60">No evidence attached</span>}
              </div>
              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-step-small text-muted-foreground">
                <span className="font-semibold text-foreground/80">Routed to: </span>
                {authority}
              </div>
              <div className="mt-2 flex items-center justify-between text-step-small text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  Anonymous — no identity fields
                </span>
                <span className="tabular-nums">ID: assigned on submit</span>
              </div>
            </div>
          </div>

          {analysisErr && (
            <div className="card-base mt-3 flex items-center gap-2 p-4 text-sm text-destructive">{analysisErr}</div>
          )}

          {analysis ? (
            <div className="mt-3">
              <AnalysisPanel analysis={analysis} />
            </div>
          ) : (
            <div className="card-base mt-3 flex flex-col items-center gap-2 p-8 text-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                Live analysis
                {analyzing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
              </div>
              <p className="text-sm font-medium">{analyzing ? 'Analyzing…' : 'Waiting for input'}</p>
              <p className="text-step-small text-muted-foreground">
                Attach a photo or video — or start typing — and the engine classifies the incident
                and drafts your report fields for you to review. All processing runs on this
                machine.
              </p>
            </div>
          )}

          <div className="mt-3 card-base p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Route className="h-4 w-4 text-primary" />
              What happens next
            </p>
            <ol className="space-y-3">
              {[
                ['You file it', 'You get a report ID and a private tracking key, kept only in this browser.'],
                ['The engine triages it', 'Priority band, evidence score and the right authority — seconds, on this machine.'],
                ['It reaches an authority', 'The report lands in the review queue with your anonymous description intact.'],
                ['You follow the timeline', 'Pending → In progress → Resolved updates appear on your tracking page.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-step-small font-bold tabular-nums text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-step-small font-semibold">{t}</p>
                    <p className="mt-0.5 text-step-small leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-muted p-3 text-step-small leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Local by default, AI when you add a key.</strong>{' '}
            Classification runs on this machine: a local lexicon, image blur / exposure / EXIF
            measurement and local media probing. Only when an AI key is saved under AI settings
            does that model read the incident text and never your identity.
          </div>
        </div>
      </div>
    </div>
  );
}
