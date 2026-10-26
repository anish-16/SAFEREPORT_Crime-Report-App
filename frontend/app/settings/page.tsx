'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface AiSettings {
  enabled: boolean;
  provider: string;
  providerLabel: string;
  model: string;
  baseUrl: string;
  hasKey: boolean;
  keyHint: string | null;
  source: 'settings' | 'env' | null;
}

const PROVIDER_CHOICES = [
  { id: '', label: 'Detect automatically from the key' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'groq', label: 'Groq (free-tier friendly)' },
  { id: 'openrouter', label: 'OpenRouter (hundreds of models)' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'xai', label: 'xAI (Grok)' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'custom', label: 'Custom OpenAI-compatible endpoint' },
];

/**
 * Bring-your-own-key AI setup. Paste any provider's key once and every report
 * analysis passes through that model; the key stays server-side (encrypted).
 */
export default function AiSettingsPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  async function load() {
    setLoading(true);
    try {
      const { settings } = await api.get<{ settings: AiSettings }>('/ai/settings');
      setSettings(settings);
      setProvider(settings.provider || '');
      setModel(settings.model || '');
      setBaseUrl(settings.baseUrl || '');
    } catch {
      setMessage({ kind: 'err', text: 'Could not load AI settings.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function call(path: string, method: 'POST' | 'DELETE', body?: object): Promise<boolean> {
    setBusy(true);
    setMessage(null);
    try {
      const res = await api.request<{ settings?: AiSettings; error?: string }>(path, {
        method,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (res.settings) setSettings(res.settings);
      return true;
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Request failed';
      setMessage({
        kind: 'err',
        text: text.includes('admin') ? `${text}` : text,
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const ok = await call('/ai/settings', 'POST', {
      provider: provider || undefined,
      model,
      baseUrl,
      detect: Boolean(!provider && apiKey.trim()),
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
    });
    if (ok) {
      setApiKey('');
      setMessage({ kind: 'ok', text: 'Saved. New reports will be analyzed with this model.' });
      await load();
    }
  }

  async function onTest() {
    setBusy(true);
    setMessage(null);
    try {
      const { result } = await api.post<{ result: { ok: boolean; message: string; model?: string } }>(
        '/ai/test',
        {}
      );
      setMessage({
        kind: result.ok ? 'ok' : 'err',
        text: result.ok
          ? `Connected — ${result.model ?? ''} replied: ${result.message}`
          : `Test failed: ${result.message}`,
      });
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    const ok = await call('/ai/settings', 'DELETE');
    if (ok) setMessage({ kind: 'ok', text: 'Key removed — the built-in local engine handles analysis.' });
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-7">
        <h1 className="text-[24px] font-semibold tracking-tight">AI analysis provider</h1>
        <p className="mt-2 max-w-2xl text-step-body leading-relaxed text-muted-foreground">
          Paste the API key of any AI provider and every report is classified, re-written and
          triaged by that model — no code changes, no restarts. The built-in local engine keeps
          running either way, so reports still get analyzed if the key fails.
        </p>
      </div>

      {/* status */}
      <div
        className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${
          settings?.hasKey
            ? 'border-success/25 bg-success/[0.06] text-muted-foreground'
            : 'border-warning/30 bg-warning/[0.06] text-muted-foreground'
        }`}
      >
        {settings?.hasKey ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        )}
        <span>
          {settings?.hasKey ? (
            <>
              <span className="font-semibold text-foreground">
                Active: {settings.providerLabel} · {settings.model}
              </span>{' '}
              (key {settings.keyHint}
              {settings.source === 'env' ? ', from environment variable' : ', saved in the database'}
              ). Reports now go through this model.
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">No key configured.</span> Analysis runs
              on the built-in local engine. Add any provider key below to switch on external AI.
            </>
          )}
        </span>
      </div>

      {/* form */}
      <form onSubmit={onSave} className="card-base space-y-5 p-6">
        <div>
          <label className="mb-1.5 block text-step-small font-medium text-muted-foreground">Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              const def = PROVIDER_CHOICES.find((p) => p.id === e.target.value);
              if (def && def.id && def.id !== 'custom') {
                setBaseUrl('');
                if (!model) setModel(''); // placeholder shows the default model
              }
            }}
            className="input-base"
          >
            {PROVIDER_CHOICES.map((p) => (
              <option key={p.id || 'auto'} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-step-small text-muted-foreground">
            Works with any OpenAI-compatible API (OpenAI, Groq, OpenRouter, DeepSeek, xAI, Mistral,
            vLLM, Ollama…) plus Anthropic and Google Gemini.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-step-small font-medium text-muted-foreground">Model name</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="input-base"
            placeholder="e.g. gpt-4o-mini · llama-3.3-70b-versatile · gemini-2.0-flash · deepseek-chat"
          />
          <p className="mt-1 text-step-small text-muted-foreground">
            Leave blank to use the provider&apos;s default.
          </p>
        </div>

        {(provider === 'custom' || baseUrl) && (
          <div>
            <label className="mb-1.5 block text-step-small font-medium text-muted-foreground">
              Base URL (custom endpoint)
            </label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="input-base"
              placeholder="https://your-server.example.com/v1"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-step-small font-medium text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" /> API key
          </label>
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input-base"
            placeholder={settings?.hasKey ? '•••••••• — enter a new key to replace it' : 'paste your provider key'}
          />
          <p className="mt-1 text-step-small leading-snug text-muted-foreground">
            Stored server-side, encrypted at rest, never sent to the browser. Only an admin can
            change it.
          </p>
        </div>

        {!isAdmin && (
          <p className="rounded-xl border border-warning/30 bg-warning/[0.06] px-4 py-3 text-step-small leading-relaxed text-muted-foreground">
            Saving requires the admin account —{' '}
            <button
              type="button"
              onClick={() => router.push('/auth/signin')}
              className="font-semibold text-foreground underline"
            >
              sign in
            </button>{' '}
            as <span className="tabular-nums">admin@safereport.app</span> first, then return here. The
            status above still shows what every visitor&apos;s reports are being analyzed with.
          </p>
        )}

        {message && (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              message.kind === 'ok'
                ? 'border border-success/25 bg-success/[0.06] text-success'
                : 'border border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || !isAdmin}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save key'}
          </button>
          <button
            type="button"
            onClick={onTest}
            disabled={busy || !settings?.hasKey}
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
          >
            <Plug className="h-4 w-4" /> Test connection
          </button>
          {settings?.hasKey && settings.source !== 'env' && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy || !isAdmin}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Remove key
            </button>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-auto rounded-xl p-2.5 text-muted-foreground transition hover:bg-muted"
            aria-label="Reload settings"
          >
            <RefreshCw className={busy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-muted p-4 text-step-small leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <span>
          Reports stay anonymous — the AI receives the incident text and, when attached, the photo;
          never your account or device key. You can also set{' '}
          <span className="tabular-nums text-foreground/80">AI_API_KEY</span> in{' '}
          <span className="tabular-nums text-foreground/80">frontend/.env</span> instead of saving here.
          Prefer no external AI?{' '}
          <Link href="/how-it-works" className="font-semibold text-foreground underline">
            Read how the local engine works
          </Link>
          .
        </span>
      </div>
    </div>
  );
}
