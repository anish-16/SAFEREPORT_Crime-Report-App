'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, hasSession } from '@/lib/api';
import type { Report, ReportStatus } from '@/lib/types';
import { StatusBadge } from '@/components/badges';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUSES: ReportStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  async function load(query = q, status = statusFilter) {
    setFetching(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (status !== 'ALL') params.set('status', status);
      const qs = params.toString();
      const { reports } = await api.get<{ reports: Report[] }>(`/reports/all${qs ? `?${qs}` : ''}`);
      setReports(reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!hasSession()) {
      router.replace('/auth/signin');
      return;
    }
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  async function setStatus(id: string, status: ReportStatus) {
    setSavingId(id);
    try {
      await api.patch(`/reports/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingId(null);
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Moderation Console</h1>
        <span className="rounded-md bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {user.role}
        </span>
      </div>

      {/* controls */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void load()}
            className="input-base pl-9"
            placeholder="Search title, ID or category…"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                void load(q, s);
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                statusFilter === s
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-white/10 text-muted-foreground hover:bg-white/[0.05]'
              )}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card-base flex flex-col items-center gap-2 py-16 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold">No reports match</p>
        </div>
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3">Filed by</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Filed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Change</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.06] transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-accent">{r.reportId}</p>
                    <p className="max-w-[220px] truncate text-sm font-medium">{r.title}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.user?.name ?? '—'}
                    <br />
                    <span className="text-[11px]">{r.user?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.category ?? '—'}</td>
                  <td className={cn('px-4 py-3 text-sm font-bold', (r.severity ?? 0) >= 7 && 'text-destructive')}>
                    {r.severity ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => void setStatus(r.id, e.target.value as ReportStatus)}
                      className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1.5 text-xs outline-none focus:border-primary/50 disabled:opacity-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-background">
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
