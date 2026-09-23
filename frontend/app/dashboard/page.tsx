'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, FileText, Clock, CheckCircle2, Inbox, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, hasSession } from '@/lib/api';
import type { Report, ReportStatus } from '@/lib/types';
import { ReportCard } from '@/components/report-card';
import { cn } from '@/lib/utils';

const FILTERS: { key: ReportStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'DISMISSED', label: 'Dismissed' },
];

const POLL_MS = 15_000; // background status refresh

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [fetching, setFetching] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setFetching(true);
    setSyncing(true);
    try {
      const query = filter !== 'ALL' ? `?status=${filter}` : '';
      const { reports } = await api.get<{ reports: Report[] }>(`/reports/mine${query}`);
      setReports(reports);
      setLastSync(new Date());
    } catch {
      // keep stale data on background failure
    } finally {
      setFetching(false);
      setSyncing(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!loading && !hasSession()) router.replace('/auth/signin');
  }, [loading, router]);

  useEffect(() => {
    if (!hasSession()) return;
    void load();
    const iv = setInterval(() => void load(true), POLL_MS); // background Neon sync
    return () => clearInterval(iv);
  }, [load]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'PENDING').length,
    progress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* profile header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-xl font-black text-primary">
            {user.name
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{user.name}</h1>
            <p className="text-sm text-muted-foreground">
              {user.email} ·{' '}
              <span className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {user.role}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-1.5 w-1.5 rounded-full bg-success', syncing && 'animate-pulse-dot')} />
            {lastSync ? `Synced ${lastSync.toLocaleTimeString()}` : 'Syncing…'}
            <button
              onClick={() => void load(true)}
              className="rounded-md p-1 transition hover:bg-white/10"
              aria-label="Refresh now"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            </button>
          </span>
          <Link
            href="/submit-report"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            + New report
          </Link>
        </div>
      </div>

      {/* anonymity banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-success/25 bg-success/[0.06] p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <span>
          <span className="font-semibold text-foreground">Private view — only you can see this page.</span>{' '}
          Every report below was filed anonymously: no name, email or phone number is written into
          any report. This dashboard exists so you can track how many you have submitted and their
          current status — nobody else can access it.
        </span>
      </div>

      {/* stat tiles */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: FileText, label: 'Total filed', value: counts.all, cls: 'text-foreground' },
          { icon: Clock, label: 'Pending', value: counts.pending, cls: 'text-warning' },
          { icon: RefreshCw, label: 'In progress', value: counts.progress, cls: 'text-primary' },
          { icon: CheckCircle2, label: 'Resolved', value: counts.resolved, cls: 'text-success' },
        ].map((s) => (
          <div key={s.label} className="card-base p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={cn('h-4 w-4', s.cls)} />
            </div>
            <p className={cn('mt-1 text-2xl font-black tabular-nums', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              filter === f.key
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-white/10 text-muted-foreground hover:bg-white/[0.05]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* report list */}
      {fetching && reports.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card-base flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-semibold">No reports here yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            File your first incident report and its status will appear here, refreshed automatically
            from the database.
          </p>
          <Link
            href="/submit-report"
            className="mt-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Submit a report
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} href={`/track-report?id=${r.reportId}`} />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Auto-refreshes every {POLL_MS / 1000}s from your Neon database.
      </p>
    </div>
  );
}
