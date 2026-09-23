import { cn } from '@/lib/utils';
import type { ReportStatus } from '@/lib/types';
import { STATUS_META, PRIORITY_META } from '@/lib/status-meta';

export function StatusBadge({ status }: { status: ReportStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        meta.classes
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot, 'animate-pulse-dot')} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.LOW;
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', meta.classes)}>
      {meta.label}
    </span>
  );
}

export function SeverityMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  const color = value >= 8 ? 'bg-destructive' : value >= 5 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-muted-foreground">{value}/10</span>
    </div>
  );
}
