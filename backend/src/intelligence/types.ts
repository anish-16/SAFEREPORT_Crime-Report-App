export type MediaKind = 'image' | 'video' | 'none';

export interface ImageScene {
  warmRatio: number; // fraction of pixels with red/orange dominance (fire candidate)
  coolRatio: number; // blue dominance (water / night candidate)
  greenRatio: number; // vegetation (outdoor candidate)
  grayRatio: number; // desaturated (concrete / UI candidate)
  isNight: boolean;
  isLikelyScreenshot: boolean; // no camera EXIF + flat UI-like colors
  hints: string[];
}

export interface ImageMetrics {
  width: number;
  height: number;
  megapixels: number;
  brightness: number; // 0..255
  contrast: number; // 0..255
  sharpness: number; // Laplacian variance, higher = sharper
  colorfulness: number; // 0..100
  blurDetected: boolean;
  tooDark: boolean;
  tooBright: boolean;
  perceptualHash: string; // 64-bit dHash for duplicate detection
  scene?: ImageScene;
  exif: {
    camera?: string;
    dateTime?: string;
    gps?: { lat: number; lon: number };
    software?: string;
    orientation?: number;
  };
  findings: string[];
}

export interface VideoMetrics {
  width?: number;
  height?: number;
  durationSec?: number;
  fps?: number;
  bitrateKbps?: number;
  hasAudio: boolean;
  container?: string;
  codec?: string;
  sampledFrames?: number;
  avgBrightness?: number;
  avgSharpness?: number;
  sceneChanges?: number;
  findings: string[];
}

export interface TextAnalysis {
  category: string;
  categoryConfidence: number; // 0..1
  categoryScores: { label: string; score: number }[];
  severity: number; // 1..10
  urgency: number; // 0..100
  sentiment: 'calm' | 'distressed' | 'panicked';
  entities: {
    phones: string[];
    emails: string[];
    plates: string[];
    locations: string[];
    weapons: string[];
    vehicles: string[];
  };
  qualityFlags: string[]; // specificity/detail signals
  summary: string;
}

/**
 * Draft content the engine auto-fills into the submit form (report type,
 * category, title, description). Everything is a suggestion the reporter
 * can edit before submitting — nothing is written to the DB verbatim
 * unless the user keeps it.
 */
export interface ReportSuggestions {
  category: string;
  authority: string; // designated authority this category routes to
  type: 'EMERGENCY' | 'NON_EMERGENCY';
  title: string;
  description: string;
  source: 'text' | 'media' | 'text+media';
}

export interface AnalysisResult {
  engineVersion: string;
  mediaKind: MediaKind;
  text: TextAnalysis;
  suggestions?: ReportSuggestions;
  image?: ImageMetrics;
  video?: VideoMetrics;
  evidenceScore: number; // 0..100 combined evidence quality
  duplicateOf?: string | null;
  triage: {
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedAction: string;
    confidence: number; // 0..1
  };
  findings: string[];
  analyzedAt: string;
}
