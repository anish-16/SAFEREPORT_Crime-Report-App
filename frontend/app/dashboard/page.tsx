'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, Search, Loader2, ShieldCheck, MonitorSmartphone, Inbox } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, deviceIdHint } from '@/lib/api';
import type { Report, ReportStatus } from '@/lib/types';
import { StatusBadge } from '@/components/badges';
import { formatDate } from '@/lib/utils';

const FILTERS: { key: ReportStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'DISMISSED', label: 'Dismissed' },
];

const POLL_MS = 15_000; // background status refresh

/**
 * My reports — an app screen in the drawn app style: one centred column under
 * the viewer bar, a title row with its source line, four stat cards, tabs and
 * the records table. Works signed in or passwordless (device key).
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [fetching, setFetching] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setFetching(true);
      setSyncing(true);
      try {
        const q = filter !== 'ALL' ? `?status=${filter}` : '';
        const { reports } = await api.get<{ reports: Report[] }>(`/reports/mine${q}`);
        setReports(reports);
        setLastSync(new Date());
      } catch {
        // keep stale data on background failure
      } finally {
        setFetching(false);
        setSyncing(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    void load();
    const iv = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(iv);
  }, [load]);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'PENDING').length,
    progress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.reportId.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.category ?? '').toLowerCase().includes(q)
    );
  }, [reports, query]);

  const stats: { label: string; value: number }[] = [
    { label: 'Reports filed', value: counts.all },
    { label: 'Awaiting review', value: counts.pending },
    { label: 'In progress', value: counts.progress },
    { label: 'Resolved', value: counts.resolved },
  ];

  return (
    <div className="mx-auto max-w-[1088px] px-5 pb-16 pt-8">
      {/* title row + source line + one outlined action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
            {user ? user.name : 'My reports'}
          </h1>
          <p className="mt-1 text-step-small text-muted-foreground">
            {user
              ? `${user.email} · ${user.role.toLowerCase()}`
              : `No account needed · tracking key ${deviceIdHint()}`}
            {' · '}
            {lastSync
              ? `synced at ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load(true)}
            className="flex h-[30px] items-center gap-2 border border-primary/40 bg-card px-3 text-step-small font-semibold text-primary transition hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Refresh view
          </button>
          <Link
            href="/submit-report"
            className="flex h-[30px] items-center bg-primary px-4 text-step-small font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            File a report
          </Link>
        </div>
      </div>

      {/* quiet snapshot notice */}
      <p className="mt-4 flex items-start gap-2 bg-muted px-4 py-3 text-step-small leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <span>
          <span className="font-semibold text-foreground">Private to this browser.</span> Every
          report was filed without a name, email or phone number. This list auto-refreshes every{' '}
          {POLL_MS / 1000}s.
          {user ? '' : ' Nothing leaves this browser.'}
        </span>
      </p>

      {/* stat cards: grey label over tabular value */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-base px-4 py-3">
            <p className="text-step-small text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-[18px] font-semibold tabular-nums leading-tight">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* tabs + search */}
      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative whitespace-nowrap pb-2 text-step-small font-semibold transition ${
                filter === f.key
                  ? 'text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search case, title, category"
            aria-label="Search your reports"
            className="input-base h-[30px] w-[256px] py-0 pl-8 text-step-small"
          />
        </div>
      </div>

      {/* records table */}
      {fetching && reports.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card-base mt-5 flex flex-col items-center gap-3 py-14 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="text-step-body font-semibold">No reports here yet</p>
          <p className="max-w-sm text-step-small text-muted-foreground">
            {query
              ? 'Nothing matches that search.'
              : 'File your first incident report and its status will appear here, refreshed automatically.'}
          </p>
          {!query && (
            <Link
              href="/submit-report"
              className="mt-1 bg-primary px-5 py-2.5 text-step-small font-semibold text-primary-foreground"
            >
              File a report
            </Link>
          )}
        </div>
      ) : (
        <div className="card-base mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-step-small font-semibold text-muted-foreground" data-taste-skill-ignore="a real table keeps its header rule">
                <th className="px-4 py-2.5 font-semibold">Case</th>
                <th className="px-4 py-2.5 font-semibold">Incident</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold">Severity</th>
                <th className="px-4 py-2.5 text-right font-semibold">Filed</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  className="group cursor-pointer border-b border-muted transition hover:bg-muted/60" data-taste-skill-ignore="a real table keeps its row rules"
                  onClick={() => router.push(`/track-report?id=${r.reportId}`)}
                >
                  <td className="px-4 py-3 text-step-small font-semibold tabular-nums">
                    {r.reportId}
                  </td>
                  <td className="max-w-[280px] px-4 py-3">
                    <p className="truncate text-step-body font-semibold group-hover:text-primary">
                      {r.title}
                    </p>
                    <p className="truncate text-step-small text-muted-foreground">
                      {r.category ?? 'Uncategorized'}
                      {r.location ? ` · ${r.location}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-step-body tabular-nums">
                    {r.severity ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-step-small text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 flex items-center gap-2 text-step-small text-muted-foreground">
        <MonitorSmartphone className="h-3.5 w-3.5" />
        Auto-refreshes every {POLL_MS / 1000}s. Reports stay visible only to this browser — the
        tracking key never leaves it.
      </p>
    </div>
  );
}
