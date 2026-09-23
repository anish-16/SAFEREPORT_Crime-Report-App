import type { AnalysisResult, MediaKind, ReportSuggestions } from './types';
import { analyzeText } from './textAnalyzer';
import { analyzeImage } from './imageAnalyzer';
import { analyzeVideo } from './videoAnalyzer';

/**
 * The fusion engine: combines text analysis + media forensics into one
 * triage verdict (status, priority, recommended action). Runs entirely
 * on this server — no third-party AI API is ever called.
 */

export interface EngineInput {
  title: string;
  description: string;
  media?: {
    kind: 'image' | 'video';
    buffer: Buffer;
    originalName: string;
  } | null;
  /** Optional duplicate check against an existing perceptual hash */
  existingHashes?: { reportId: string; hash: string }[];
  /** Reporter-typed location, folded into the drafted title/description */
  location?: string;
}

const ENGINE_VERSION = 'safereport-local-intel-1.0.0';

/** Category → the authority this report is routed to for review. */
const AUTHORITY_MAP: Record<string, string> = {
  'Violence / Assault': 'Police Control Room (Law & Order)',
  'Theft / Burglary': 'Police Station (Crime Desk)',
  'Fraud / Cybercrime': 'Cyber Crime Cell',
  'Drugs / Substance': 'Police Narcotics Unit',
  'Vandalism / Property': 'Police (Property Offences)',
  'Harassment / Stalking': 'Police (Safety Cell)',
  'Traffic / Road Safety': 'Traffic Police / Road Safety Unit',
  'Missing Person': 'Police (Missing Persons Bureau)',
  'Fire / Emergency': 'Fire & Rescue Department',
  'Water Logging / Flood': 'Disaster Management / Municipal Corp',
  'Bullying / Misconduct': 'Local Police + Institutional Authority',
  'Public Safety Hazard': 'Municipal / Public Works + Police',
  'General Incident': 'Local Police / Designated Duty Desk',
  Uncategorized: 'Local Police / Designated Duty Desk',
};

const EMERGENCY_CATEGORIES = new Set([
  'Violence / Assault',
  'Fire / Emergency',
  'Missing Person',
  'Water Logging / Flood',
  'Public Safety Hazard',
]);

function shortLocation(loc?: string): string | undefined {
  if (!loc) return undefined;
  const parts = loc.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.slice(0, 2).join(', ');
}

/**
 * Drafts the report form fields (type, category, title, description) from
 * whatever signals exist — text, image scene stats, video probe. The user
 * reviews and can edit every field before submitting.
 */
function draftSuggestions(args: {
  inputTitle: string;
  inputDescription: string;
  text: AnalysisResult['text'];
  image?: AnalysisResult['image'];
  video?: AnalysisResult['video'];
  mediaKind: MediaKind;
  location?: string;
}): ReportSuggestions {
  const { inputTitle, inputDescription, text, image, video, mediaKind } = args;
  const loc = shortLocation(args.location);

  // --- category: prefer the text classifier, else infer from media scene ---
  let category: string;
  let source: ReportSuggestions['source'];
  if (text.category !== 'Uncategorized' && text.categoryConfidence > 0) {
    category = text.category;
    source = mediaKind === 'none' ? 'text' : 'text+media';
  } else if (image?.scene) {
    const s = image.scene;
    if (s.warmRatio > 0.3 && image.brightness > 60) { category = 'Fire / Emergency'; source = 'media'; }
    else if (s.coolRatio > 0.42 && image.brightness < 110) { category = 'Water Logging / Flood'; source = 'media'; }
    else if (s.isLikelyScreenshot) { category = 'Fraud / Cybercrime'; source = 'media'; }
    else if (image.tooDark || s.isNight) { category = 'Public Safety Hazard'; source = 'media'; }
    else { category = 'General Incident'; source = 'media'; }
  } else if (video) {
    category = video.avgBrightness !== undefined && video.avgBrightness < 60
      ? 'Public Safety Hazard'
      : 'General Incident';
    source = 'media';
  } else {
    category = 'General Incident';
    source = 'text';
  }

  // --- emergency / non-emergency ---
  const type: ReportSuggestions['type'] =
    text.severity >= 7 || text.urgency >= 65 || EMERGENCY_CATEGORIES.has(category)
      ? 'EMERGENCY'
      : 'NON_EMERGENCY';

  // --- title draft ---
  let title = inputTitle.trim();
  if (title.length < 4) {
    const ident = [
      ...text.entities.plates.slice(0, 1),
      ...text.entities.weapons.slice(0, 1),
      ...text.entities.vehicles.slice(0, 1),
    ];
    if (ident.length > 0) title = `${category} reported — ${ident.join(', ')}`;
    else if (loc) title = `${category} reported near ${loc}`;
    else if (mediaKind === 'image') title = `${category} — photo evidence attached`;
    else if (mediaKind === 'video') title = `${category} — video evidence attached`;
    else title = `${category} reported`;
    title = title.slice(0, 90);
  }

  // --- description draft ---
  let description = inputDescription.trim();
  if (description.length < 15) {
    const sentences: string[] = [];
    sentences.push(
      `An incident classified as "${category}" was reported${loc ? ` near ${loc}` : ''}.`
    );
    if (image) {
      const cap = `${image.width}×${image.height}${
        image.exif.dateTime ? `, captured ${new Date(image.exif.dateTime).toLocaleString('en-GB')}` : ''
      }`;
      sentences.push(`Photo evidence attached (${cap}).`);
    } else if (video) {
      const bits = [
        video.durationSec ? `${Math.round(video.durationSec)}s` : null,
        video.width && video.height ? `${video.width}×${video.height}` : null,
        video.container ?? null,
      ].filter(Boolean);
      sentences.push(`Video evidence attached${bits.length ? ` (${bits.join(', ')})` : ''}.`);
    }
    const ents = [
      ...text.entities.plates.map((p) => `vehicle plate ${p}`),
      ...text.entities.weapons.map((w) => `weapon: ${w}`),
      ...text.entities.vehicles.slice(0, 2).map((v) => `vehicle: ${v}`),
      ...text.entities.phones.slice(0, 1).map((p) => `phone: ${p}`),
    ];
    if (ents.length) sentences.push(`Detected details — ${ents.join('; ')}.`);
    sentences.push(
      'Draft prepared by the local intelligence engine — edit this to state exactly what happened, when, and who was involved.'
    );
    description = sentences.join(' ').slice(0, 2000);
  }

  return {
    category,
    authority: AUTHORITY_MAP[category] ?? AUTHORITY_MAP.Uncategorized,
    type,
    title,
    description,
    source,
  };
}

function evidenceScore(input: {
  text: ReturnType<typeof analyzeText>;
  image?: AnalysisResult['image'];
  video?: AnalysisResult['video'];
}): { score: number; findings: string[] } {
  const findings: string[] = [];
  let score = 30; // baseline from a filed report existing at all

  // text quality contributes up to 35
  const tf = input.text.qualityFlags.length;
  score += Math.min(35, tf * 9);
  if (tf >= 3) findings.push('Report text is specific and well-detailed.');
  else if (tf <= 1) findings.push('Report lacks specifics (time, place, identifiers).');

  // category confidence contributes up to 15
  score += Math.round(input.text.categoryConfidence * 15);

  // media contributes up to 20
  if (input.image) {
    const im = input.image;
    let mediaPts = 20;
    if (im.blurDetected) mediaPts -= 8;
    if (im.tooDark || im.tooBright) mediaPts -= 5;
    if (im.width * im.height < 400 * 300) mediaPts -= 5;
    if (im.exif.gps) mediaPts += 3;
    score += Math.max(0, Math.min(20, mediaPts));
    findings.push(...im.findings);
  } else if (input.video) {
    let mediaPts = 18;
    if (input.video.sampledFrames && input.video.sampledFrames >= 3) mediaPts += 2;
    if (input.video.avgSharpness !== undefined && input.video.avgSharpness < 60) mediaPts -= 6;
    score += Math.max(0, Math.min(20, mediaPts));
    findings.push(...input.video.findings);
  } else {
    findings.push('No photo or video attached — text-only report.');
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), findings };
}

function deriveTriage(args: {
  severity: number;
  urgency: number;
  evidence: number;
  mediaKind: MediaKind;
  category: string;
}): AnalysisResult['triage'] {
  const { severity, urgency, evidence, category } = args;

  // priority bands from severity + urgency
  const signal = severity * 10 + urgency * 0.3;
  let priority: AnalysisResult['triage']['priority'];
  if (signal >= 75) priority = 'CRITICAL';
  else if (signal >= 55) priority = 'HIGH';
  else if (signal >= 35) priority = 'MEDIUM';
  else priority = 'LOW';

  // status: strong evidence + high priority → auto-escalate; weak → review first
  let status: AnalysisResult['triage']['status'] = 'PENDING';
  let action: string;
  if (priority === 'CRITICAL') {
    status = 'IN_PROGRESS';
    action =
      'Auto-escalated: high-severity incident with sufficient detail. Dispatch review immediately.';
  } else if (priority === 'HIGH') {
    status = 'PENDING';
    action = 'Prioritize in the review queue. Verify evidence quality and assign an officer.';
  } else if (evidence < 45) {
    status = 'PENDING';
    action = 'Evidence is thin — consider requesting more detail or media from the reporter.';
  } else if (category === 'Uncategorized') {
    status = 'PENDING';
    action = 'Category unclear — a moderator should classify this report manually.';
  } else {
    status = 'PENDING';
    action = 'Standard queue. Review during normal processing hours.';
  }

  const confidence = Math.max(
    0.2,
    Math.min(0.98, 0.35 + (evidence / 100) * 0.35 + (severity / 10) * 0.3)
  );

  return {
    status,
    priority,
    recommendedAction: action,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export async function runAnalysis(input: EngineInput): Promise<AnalysisResult> {
  const text = analyzeText(input.title, input.description);
  const findings: string[] = [];
  let mediaKind: MediaKind = 'none';
  let image: AnalysisResult['image'];
  let video: AnalysisResult['video'];
  let duplicateOf: string | null = null;

  if (input.media) {
    if (input.media.kind === 'image') {
      image = await analyzeImage(input.media.buffer);
      mediaKind = 'image';
      if (input.existingHashes && image) {
        for (const existing of input.existingHashes) {
          // quick Hamming check
          let diff = 0;
          const a = image.perceptualHash;
          const b = existing.hash;
          if (a && b && a.length === b.length) {
            for (let i = 0; i < a.length; i++) {
              let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
              while (x) {
                diff += x & 1;
                x >>= 1;
              }
            }
            if (diff <= 8) {
              duplicateOf = existing.reportId;
              findings.push(`Visually near-identical to existing report ${existing.reportId}.`);
              break;
            }
          }
        }
      }
    } else {
      video = await analyzeVideo(input.media.buffer, input.media.originalName);
      mediaKind = 'video';
    }
  }

  const ev = evidenceScore({ text, image, video });
  findings.unshift(...ev.findings);

  const triage = deriveTriage({
    severity: text.severity,
    urgency: text.urgency,
    evidence: ev.score,
    mediaKind,
    category: text.category,
  });

  const suggestions = draftSuggestions({
    inputTitle: input.title,
    inputDescription: input.description,
    text,
    image,
    video,
    mediaKind,
    location: input.location,
  });

  return {
    engineVersion: ENGINE_VERSION,
    mediaKind,
    text,
    suggestions,
    image,
    video,
    evidenceScore: ev.score,
    duplicateOf,
    triage,
    findings,
    analyzedAt: new Date().toISOString(),
  };
}
