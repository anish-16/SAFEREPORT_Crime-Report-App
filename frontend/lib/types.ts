export type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type ReportType = 'EMERGENCY' | 'NON_EMERGENCY';
export type Role = 'USER' | 'MODERATOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface StatusEvent {
  id: string;
  from: ReportStatus | null;
  to: ReportStatus;
  note: string | null;
  createdAt: string;
}

export interface TextAnalysis {
  category: string;
  categoryConfidence: number;
  categoryScores: { label: string; score: number }[];
  severity: number;
  urgency: number;
  sentiment: 'calm' | 'distressed' | 'panicked';
  entities: {
    phones: string[];
    emails: string[];
    plates: string[];
    locations: string[];
    weapons: string[];
    vehicles: string[];
  };
  qualityFlags: string[];
  summary: string;
}

export interface ImageScene {
  warmRatio: number;
  coolRatio: number;
  greenRatio: number;
  grayRatio: number;
  isNight: boolean;
  isLikelyScreenshot: boolean;
  hints: string[];
}

export interface ImageMetrics {
  width: number;
  height: number;
  megapixels: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  colorfulness: number;
  blurDetected: boolean;
  tooDark: boolean;
  tooBright: boolean;
  perceptualHash: string;
  scene?: ImageScene;
  exif: { camera?: string; dateTime?: string; gps?: { lat: number; lon: number }; software?: string };
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

export interface ReportSuggestions {
  category: string;
  authority: string;
  type: ReportType;
  title: string;
  description: string;
  source: 'text' | 'media' | 'text+media';
}

export interface AnalysisResult {
  engineVersion: string;
  mediaKind: 'image' | 'video' | 'none';
  text: TextAnalysis;
  suggestions?: ReportSuggestions;
  image?: ImageMetrics;
  video?: VideoMetrics;
  evidenceScore: number;
  duplicateOf?: string | null;
  triage: {
    status: ReportStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedAction: string;
    confidence: number;
  };
  findings: string[];
  analyzedAt: string;
}

export interface Report {
  id: string;
  reportId: string;
  userId?: string | null;
  type: ReportType;
  title: string;
  description: string;
  category?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  thumbUrl?: string | null;
  analysis?: AnalysisResult | null;
  severity?: number | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  events: StatusEvent[];
  user?: { id: string; name: string; email: string } | null;
}
