import crypto from 'crypto';
import { prisma } from './prisma';
import { CATEGORY_LABELS } from '@/lib/categories';
import type { AnalysisResult, AiInsight, ReportStatus, ReportType } from '@/lib/types';

/**
 * Pluggable AI analysis — bring your own key.
 *
 * Paste any provider's API key into Settings → AI and the report analyzer
 * starts using that model. Keys are stored server-side, encrypted at rest,
 * never returned to the browser (only a masked hint). When no key is
 * configured the app keeps working on the built-in local engine.
 */

export type ProviderStyle = 'openai' | 'anthropic' | 'gemini';

export interface ProviderDef {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  style: ProviderStyle;
  /** providers whose chat API rejects image input (text-only pass) */
  textOnly?: boolean;
}

export const PROVIDERS: ProviderDef[] = [
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', style: 'openai' },
  { id: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', style: 'openai' },
  { id: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini', style: 'openai' },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', style: 'openai', textOnly: true },
  { id: 'xai', label: 'xAI (Grok)', baseUrl: 'https://api.x.ai/v1', defaultModel: 'grok-2-latest', style: 'openai' },
  { id: 'mistral', label: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', defaultModel: 'mistral-small-latest', style: 'openai', textOnly: true },
  { id: 'anthropic', label: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-5-haiku-latest', style: 'anthropic' },
  { id: 'gemini', label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.0-flash', style: 'gemini' },
  { id: 'custom', label: 'Custom (OpenAI-compatible)', baseUrl: '', defaultModel: '', style: 'openai' },
];

export function providerById(id: string | null | undefined): ProviderDef {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

/** Guess the provider from the key shape so pasting "just works". */
export function detectProvider(key: string): ProviderDef {
  const k = key.trim();
  if (k.startsWith('sk-ant-')) return providerById('anthropic');
  if (k.startsWith('AIza')) return providerById('gemini');
  if (k.startsWith('gsk_')) return providerById('groq');
  if (k.startsWith('sk-or-')) return providerById('openrouter');
  if (k.startsWith('xai-')) return providerById('xai');
  if (k.startsWith('sk-')) return providerById('openai');
  return providerById('openai');
}

export function maskKey(key: string): string {
  if (key.length <= 10) return '••••';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

// ---------- encrypted storage ----------

const ENC_PREFIX = 'enc:v1:';

function masterKey(): Buffer {
  return crypto.scryptSync(process.env.JWT_SECRET || 'safereport-dev-secret', 'safereport-ai-key', 32);
}

function encryptValue(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

function decryptValue(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored;
  try {
    const [ivHex, tagHex, ctHex] = stored.slice(ENC_PREFIX.length).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

// ---------- settings ----------

export interface AiSettingsPublic {
  enabled: boolean;
  provider: string;
  providerLabel: string;
  model: string;
  baseUrl: string;
  hasKey: boolean;
  keyHint: string | null;
  source: 'settings' | 'env' | null;
}

export interface AiConfig {
  provider: ProviderDef;
  model: string;
  apiKey: string;
  baseUrl: string;
  source: 'settings' | 'env';
}

async function settingsRow() {
  try {
    return await prisma.aiSetting.findUnique({ where: { id: 'main' } });
  } catch {
    // schema not pushed yet — fall back to env
    return null;
  }
}

/** Resolved AI config, or null when no key is available (local engine only). */
export async function loadAiConfig(): Promise<AiConfig | null> {
  const row = await settingsRow();
  if (row && row.enabled && row.apiKey) {
    const apiKey = decryptValue(row.apiKey);
    if (apiKey) {
      const provider = providerById(row.provider);
      const baseUrl = row.baseUrl?.trim() || provider.baseUrl;
      if (baseUrl) {
        return {
          provider,
          model: row.model?.trim() || provider.defaultModel,
          baseUrl,
          apiKey,
          source: 'settings',
        };
      }
    }
  }
  const envKey = process.env.AI_API_KEY?.trim();
  if (envKey) {
    const provider = process.env.AI_PROVIDER
      ? providerById(process.env.AI_PROVIDER)
      : detectProvider(envKey);
    const baseUrl = provider.baseUrl;
    return {
      provider,
      model: process.env.AI_MODEL?.trim() || provider.defaultModel,
      baseUrl,
      apiKey: envKey,
      source: 'env',
    };
  }
  return null;
}

export async function getAiSettingsPublic(): Promise<AiSettingsPublic> {
  const row = await settingsRow();
  const cfg = await loadAiConfig();
  if (!cfg) {
    return {
      enabled: row?.enabled ?? true,
      provider: row?.provider || '',
      providerLabel: row?.provider ? providerById(row.provider).label : '',
      model: row?.model || '',
      baseUrl: row?.baseUrl || '',
      hasKey: false,
      keyHint: null,
      source: null,
    };
  }
  return {
    enabled: cfg.source === 'settings' ? (row?.enabled ?? true) : true,
    provider: cfg.provider.id,
    providerLabel: cfg.provider.label,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    hasKey: true,
    keyHint: maskKey(cfg.apiKey),
    source: cfg.source,
  };
}

export interface SaveAiInput {
  provider?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  enabled?: boolean;
}

export async function saveAiSettings(input: SaveAiInput): Promise<void> {
  const provider =
    input.provider && PROVIDERS.some((p) => p.id === input.provider)
      ? input.provider
      : input.apiKey
        ? detectProvider(input.apiKey).id
        : undefined;

  const existing = await settingsRow();
  const data: Record<string, unknown> = {};
  if (provider) data.provider = provider;
  if (input.model !== undefined) data.model = input.model.trim() || null;
  if (input.baseUrl !== undefined) data.baseUrl = input.baseUrl.trim() || null;
  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.apiKey !== undefined) {
    const key = input.apiKey.trim();
    data.apiKey = key ? encryptValue(key) : null;
  }

  if (existing) {
    await prisma.aiSetting.update({ where: { id: 'main' }, data });
  } else {
    await prisma.aiSetting.create({
      data: {
        id: 'main',
        provider: provider || 'openai',
        model: input.model?.trim() || null,
        baseUrl: input.baseUrl?.trim() || null,
        enabled: input.enabled ?? true,
        apiKey: input.apiKey?.trim() ? encryptValue(input.apiKey.trim()) : null,
      },
    });
  }
}

export async function clearAiKey(): Promise<void> {
  const existing = await settingsRow();
  if (existing) await prisma.aiSetting.update({ where: { id: 'main' }, data: { apiKey: null } });
}

// ---------- provider calls ----------

const SYSTEM_PROMPT = [
  'You are SafeReport, the incident-triage analyst inside an anonymous crime-reporting platform.',
  'You read a citizen report (plus optional photo evidence) and produce a precise triage verdict.',
  'Never invent facts that are not in the report. Keep the reporter voice factual and neutral.',
  'Answer with a single JSON object only — no prose, no markdown fences.',
].join(' ');

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const j = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
    if (typeof j.error === 'string') return j.error;
    if (j.error && typeof j.error === 'object' && j.error.message) return j.error.message;
    if (j.message) return j.message;
  } catch {
    /* not JSON */
  }
  return text.slice(0, 300) || `HTTP ${res.status}`;
}

function extractText(data: unknown): string {
  const d = data as {
    choices?: { message?: { content?: string } }[];
    content?: { text?: string }[];
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    d.choices?.[0]?.message?.content ??
    d.content?.map((c) => c.text || '').join('') ??
    d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ??
    ''
  );
}

async function sendPrompt(
  cfg: AiConfig,
  prompt: string,
  image?: { mime: string; base64: string } | null
): Promise<Response> {
  const useImage = !!image && !cfg.provider.textOnly;

  if (cfg.provider.style === 'anthropic') {
    const content: unknown[] = [{ type: 'text', text: prompt }];
    if (useImage && image) {
      content.push({ type: 'image', source: { type: 'base64', media_type: image.mime, data: image.base64 } });
    }
    return postJson(
      `${cfg.baseUrl}/messages`,
      { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
      {
        model: cfg.model,
        max_tokens: 1600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }
    );
  }

  if (cfg.provider.style === 'gemini') {
    const parts: unknown[] = [{ text: prompt }];
    if (useImage && image) parts.push({ inline_data: { mime_type: image.mime, data: image.base64 } });
    return postJson(
      `${cfg.baseUrl}/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`,
      {},
      {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }
    );
  }

  const content: unknown[] = [{ type: 'text', text: prompt }];
  if (useImage && image) {
    content.push({ type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.base64}` } });
  }
  return postJson(
    `${cfg.baseUrl}/chat/completions`,
    { authorization: `Bearer ${cfg.apiKey}` },
    {
      model: cfg.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: useImage ? content : prompt },
      ],
    }
  );
}

/** Returns the model's text reply; if the image is rejected, retries text-only. */
async function callProvider(
  cfg: AiConfig,
  prompt: string,
  image?: { mime: string; base64: string } | null
): Promise<string> {
  let res = await sendPrompt(cfg, prompt, image);
  if (!res.ok && image && !cfg.provider.textOnly) {
    res = await sendPrompt(cfg, prompt, null);
  }
  if (!res.ok) throw new Error(`${cfg.provider.label}: ${await readError(res)}`);
  const text = extractText(await res.json());
  if (!text.trim()) throw new Error(`${cfg.provider.label}: empty response`);
  return text;
}

// ---------- analysis ----------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback?: T): T | undefined {
  if (typeof value === 'string') {
    const v = value.toUpperCase().replace(/\s+/g, '_') as T;
    if (allowed.includes(v)) return v;
    const raw = allowed.find((a) => a.toLowerCase() === String(value).toLowerCase().trim());
    if (raw) return raw;
  }
  return fallback;
}

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

function buildPrompt(input: {
  title: string;
  description: string;
  location?: string;
  category?: string;
  local: AnalysisResult;
}): string {
  const facts = [
    `Title: ${input.title}`,
    `Description: ${input.description}`,
    input.location ? `Location: ${input.location}` : null,
    input.category ? `Reporter-chosen category: ${input.category}` : null,
    `Local engine category guess: ${input.local.text.category}`,
    `Local engine severity: ${input.local.text.severity}/10`,
    `Local engine findings: ${input.local.findings.join('; ') || 'none'}`,
    input.local.triage ? `Local triage: ${input.local.triage.status} / ${input.local.triage.priority}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `${facts}

Return one JSON object with exactly these keys:
{
 "category": one of ${JSON.stringify(CATEGORY_LABELS)},
 "type": "EMERGENCY" | "NON_EMERGENCY",
 "title": "short factual headline, max 90 chars",
 "description": "complete re-written report, 2-4 sentences, keeps every fact",
 "authority": "the authority this should be routed to",
 "severity": 1-10 integer,
 "urgency": 1-10 integer,
 "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
 "status": "PENDING" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED",
 "confidence": 0-1 number,
 "summary": "one sentence analyst summary",
 "findings": ["3-6 short evidence-backed findings"]
}`;
}

function parseJson(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    const direct = JSON.parse(cleaned) as unknown;
    if (direct && typeof direct === 'object') return direct as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const inner = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
      if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
    } catch {
      /* give up */
    }
  }
  return null;
}

export interface AiRunResult {
  ok: boolean;
  insight?: AiInsight;
  error?: string;
}

export interface AiRunInput {
  title: string;
  description: string;
  location?: string;
  category?: string;
  media?: { kind: 'image' | 'video'; mime: string; buffer: Buffer } | null;
  local: AnalysisResult;
  /** skip the pass entirely (used for the fast live preview) */
  skip?: boolean;
}

/**
 * Runs the AI pass if a key is configured. Never throws: on any failure it
 * reports the reason and the caller keeps the local engine result.
 */
export async function runAiAnalysis(input: AiRunInput): Promise<AiRunResult> {
  if (input.skip) return { ok: false, error: 'skipped' };
  const cfg = await loadAiConfig();
  if (!cfg) return { ok: false, error: 'no-key' };

  try {
    let image: { mime: string; base64: string } | null = null;
    if (input.media && input.media.kind === 'image' && input.media.buffer.length < 6 * 1024 * 1024) {
      image = { mime: input.media.mime, base64: input.media.buffer.toString('base64') };
    }

    const raw = await callProvider(cfg, buildPrompt(input), image);
    const parsed = parseJson(raw);
    if (!parsed) throw new Error(`${cfg.provider.label}: response was not JSON`);

    const insight: AiInsight = {
      provider: cfg.provider.id,
      providerLabel: cfg.provider.label,
      model: cfg.model,
      analyzedAt: new Date().toISOString(),
      usedMedia: image !== null,
    };

    if (typeof parsed.category === 'string' && (CATEGORY_LABELS as readonly string[]).includes(parsed.category)) {
      insight.category = parsed.category;
    }
    const type = pick<ReportType>(parsed.type, ['EMERGENCY', 'NON_EMERGENCY']);
    if (type) insight.type = type;
    if (typeof parsed.title === 'string' && parsed.title.trim().length >= 4) {
      insight.title = parsed.title.trim().slice(0, 120);
    }
    if (typeof parsed.description === 'string' && parsed.description.trim().length >= 15) {
      insight.description = parsed.description.trim().slice(0, 2000);
    }
    if (typeof parsed.authority === 'string' && parsed.authority.trim()) {
      insight.authority = parsed.authority.trim().slice(0, 120);
    }
    if (typeof parsed.severity === 'number') insight.severity = clamp(Math.round(parsed.severity), 1, 10);
    if (typeof parsed.urgency === 'number') insight.urgency = clamp(Math.round(parsed.urgency), 1, 10);
    const priority = pick<(typeof PRIORITIES)[number]>(parsed.priority, PRIORITIES);
    if (priority) insight.priority = priority;
    const status = pick<(typeof STATUSES)[number]>(parsed.status, STATUSES);
    if (status) insight.status = status;
    if (typeof parsed.confidence === 'number') insight.confidence = clamp(parsed.confidence, 0, 1);
    if (typeof parsed.summary === 'string' && parsed.summary.trim()) {
      insight.summary = parsed.summary.trim().slice(0, 400);
    }
    if (Array.isArray(parsed.findings)) {
      insight.findings = parsed.findings
        .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
        .map((f) => f.trim().slice(0, 200))
        .slice(0, 6);
    }

    return { ok: true, insight };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return { ok: false, error: message };
  }
}

/** Folds an AI insight into the local analysis result (drafts + triage + panel). */
export function mergeAi(analysis: AnalysisResult, insight: AiInsight): void {
  analysis.ai = insight;

  // AI-written draft becomes the suggestion the form auto-fills (still editable).
  const local = analysis.suggestions;
  if (insight.title || insight.description || insight.category) {
    analysis.suggestions = {
      category: insight.category || local?.category || analysis.text.category,
      authority: insight.authority || local?.authority || '',
      type: insight.type || local?.type || 'NON_EMERGENCY',
      title: insight.title || local?.title || '',
      description: insight.description || local?.description || '',
      source: 'text+media',
    };
  }

  if (insight.severity != null) {
    analysis.text.severity = insight.severity;
    analysis.triage.confidence = insight.confidence ?? analysis.triage.confidence;
  }
  if (insight.priority) analysis.triage.priority = insight.priority;
  if (insight.summary) analysis.triage.recommendedAction = insight.summary;
  if (insight.findings?.length) {
    analysis.findings = [...insight.findings, ...analysis.findings].slice(0, 10);
  }
}

// ---------- connectivity test ----------

export interface AiTestResult {
  ok: boolean;
  message: string;
  provider?: string;
  model?: string;
}

export async function testAi(): Promise<AiTestResult> {
  const cfg = await loadAiConfig();
  if (!cfg) {
    return { ok: false, message: 'No API key configured yet — add one in Settings → AI.' };
  }
  try {
    const raw = await callProvider(
      cfg,
      'Reply with exactly this JSON and nothing else: {"ok":true,"reply":"SafeReport connected"}'
    );
    const parsed = parseJson(raw);
    return {
      ok: true,
      message: parsed?.reply ? String(parsed.reply) : raw.trim().slice(0, 80),
      provider: cfg.provider.label,
      model: cfg.model,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Connection failed',
      provider: cfg.provider.label,
      model: cfg.model,
    };
  }
}
