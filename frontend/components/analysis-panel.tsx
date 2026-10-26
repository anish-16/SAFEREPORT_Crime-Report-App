'use client';

import { Brain, Camera, Video, FileText, MapPin, AlertTriangle, Sparkles, Cpu, ShieldAlert } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { PriorityBadge, SeverityMeter } from './badges';
import { cn } from '@/lib/utils';

/**
 * Renders the analysis output: triage verdict, category, severity/urgency,
 * evidence findings and detected entities — plus the external AI pass when a
 * provider key is configured (Settings → AI).
 */
export function AnalysisPanel({ analysis, compact = false }: { analysis: AnalysisResult; compact?: boolean }) {
  const { text, triage, findings, image, video, mediaKind, ai, aiError } = analysis;

  return (
    <div className="card-base overflow-hidden">
      <div className="flex items-center justify-between bg-primary/[0.06] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="h-4 w-4 text-primary" />
          {ai ? `Intelligence · local + ${ai.providerLabel}` : 'Local Intelligence Analysis'}
        </div>
        <PriorityBadge priority={triage.priority} />
      </div>

      <div className="space-y-4 p-4">
        {/* external AI pass (bring-your-own-key) */}
        {ai && (
          <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-3">
            <div className="mb-1 flex items-center gap-2 text-step-small font-bold  text-primary">
              <Cpu className="h-3.5 w-3.5" />
              {ai.providerLabel} · {ai.model}
              {ai.usedMedia ? ' · saw the photo' : ''}
            </div>
            {ai.summary && (
              <p className="text-sm leading-relaxed text-foreground/90">{ai.summary}</p>
            )}
            {ai.findings && ai.findings.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {ai.findings.map((f, i) => (
                  <li key={i} className="flex gap-2 text-step-small leading-relaxed text-muted-foreground">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-step-small text-muted-foreground">
              {ai.category && <span>Category: <span className="text-foreground/80">{ai.category}</span></span>}
              {ai.severity != null && <span>Severity {ai.severity}/10</span>}
              {ai.priority && <span>Priority {ai.priority}</span>}
              {ai.authority && <span>Routes to {ai.authority}</span>}
            </div>
          </div>
        )}
        {aiError && aiError !== 'no-key' && aiError !== 'skipped' && (
          <p className="flex items-start gap-2 text-step-small leading-snug text-warning">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            AI pass skipped ({aiError}) — showing the built-in engine result.
          </p>
        )}

        {/* verdict */}
        <div className="rounded-xl border border-border bg-muted p-3">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-step-small font-bold  text-primary">Auto-Triage</span>
            <span className="text-step-small text-muted-foreground">
              · {Math.round(triage.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{triage.recommendedAction}</p>
          {analysis.suggestions && (
            <p className="mt-3 flex items-center gap-1.5 text-step-small text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Draft ready — category, type, title & description pre-filled from{' '}
              {analysis.suggestions.source === 'text'
                ? 'your text'
                : analysis.suggestions.source === 'media'
                  ? 'your photo / video'
                  : 'text + media'}
              . Edit anything before submitting.
            </p>
          )}
        </div>

        {/* category + meters */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3">
            <p className="mb-1 text-step-small font-medium text-muted-foreground">Category</p>
            <p className="text-sm font-semibold">{text.category}</p>
            <p className="mt-0.5 text-step-small text-muted-foreground">
              {Math.round(text.categoryConfidence * 100)}% match
            </p>
            {analysis.suggestions?.authority && (
              <p className="mt-1 text-step-small leading-snug text-muted-foreground">
                <span className="font-semibold text-foreground/80">Routes to:</span>{' '}
                {analysis.suggestions.authority}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="mb-1 text-step-small font-medium text-muted-foreground">Urgency</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    text.urgency >= 70 ? 'bg-destructive' : text.urgency >= 40 ? 'bg-warning' : 'bg-success'
                  )}
                  style={{ width: `${text.urgency}%` }}
                />
              </div>
              <span className="text-step-small font-semibold tabular-nums text-muted-foreground">{text.urgency}%</span>
            </div>
            <p className="mt-1.5 text-step-small capitalize text-muted-foreground">
              Reporter sounds {text.sentiment}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="mb-2 text-step-small font-medium text-muted-foreground">Severity</p>
          <SeverityMeter value={text.severity} />
        </div>

        {/* media forensics */}
        {!compact && (image || video) && (
          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center gap-2 text-step-small font-bold  text-muted-foreground">
              {mediaKind === 'image' ? <Camera className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
              {mediaKind === 'image' ? 'Image Forensics' : 'Video Forensics'}
            </div>
            {image && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-step-small text-muted-foreground">
                  <span>{image.width}×{image.height} ({image.megapixels} MP)</span>
                  <span>Brightness {image.brightness}</span>
                  <span>Contrast {image.contrast}</span>
                  <span>Sharpness {image.sharpness}</span>
                  {image.exif.camera && <span className="text-foreground/80">{image.exif.camera}</span>}
                  {image.exif.gps && <span className="text-primary">GPS present</span>}
                </div>
              </div>
            )}
            {video && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-step-small text-muted-foreground">
                {video.width && <span>{video.width}×{video.height}</span>}
                {video.durationSec && <span>{Math.round(video.durationSec)}s</span>}
                {video.fps && <span>{video.fps} fps</span>}
                <span>{video.container || 'video'}{video.codec ? ` · ${video.codec}` : ''}</span>
                {video.sampledFrames !== undefined && <span>{video.sampledFrames} frames sampled</span>}
              </div>
            )}
          </div>
        )}

        {/* findings */}
        {!compact && findings.length > 0 && (
          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center gap-2 text-step-small font-bold  text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Findings
            </div>
            <ul className="space-y-1.5">
              {findings.map((f, i) => (
                <li key={i} className="flex gap-2 text-step-small leading-relaxed text-muted-foreground">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* entities */}
        {!compact && (
          <div className="space-y-2">
            {text.qualityFlags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {text.qualityFlags.map((q) => (
                  <span key={q} className="rounded-md bg-success/10 px-2 py-0.5 text-step-small text-success">
                    {q}
                  </span>
                ))}
              </div>
            )}
            {(text.entities.plates.length > 0 || text.entities.weapons.length > 0 || text.entities.vehicles.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {text.entities.plates.map((p) => (
                  <span key={p} className="rounded-md bg-accent/10 px-2 py-0.5 text-step-small tabular-nums text-primary">
                    {p}
                  </span>
                ))}
                {text.entities.weapons.map((w) => (
                  <span key={w} className="rounded-md bg-destructive/10 px-2 py-0.5 text-step-small text-destructive">
                    {w}
                  </span>
                ))}
                {text.entities.vehicles.map((v) => (
                  <span key={v} className="rounded-md bg-warning/10 px-2 py-0.5 text-step-small text-warning">
                    {v}
                  </span>
                ))}
              </div>
            )}
            {text.entities.locations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {text.entities.locations.map((l) => (
                  <span key={l} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-step-small text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {l}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!compact && (
          <div className="mt-4 flex items-center gap-2 pt-1 text-step-small text-muted-foreground">
            <FileText className="h-3 w-3" />
            Engine {analysis.engineVersion} · analyzed {new Date(analysis.analyzedAt).toLocaleString()}
            {analysis.ai && (
              <>
                {' · '}
                {analysis.ai.providerLabel} pass · {analysis.ai.model}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
