import Link from 'next/link';
import type { Report } from '@/lib/types';
import { StatusBadge } from './badges';
import { formatDate } from '@/lib/utils';
import { Camera, Video, MapPin, ChevronRight } from 'lucide-react';

export function ReportCard({ report, href }: { report: Report; href?: string }) {
  const className = 'card-base group block p-4 transition hover:border-primary/40';
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent">{report.reportId}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {report.type.replace('_', ' ').toLowerCase()}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold group-hover:text-primary">{report.title}</p>
        </div>
        <StatusBadge status={report.status} />
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{report.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span>{formatDate(report.createdAt)}</span>
        {report.category && (
          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5">{report.category}</span>
        )}
        {report.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {report.location}
          </span>
        )}
        {report.mediaType === 'image' && <Camera className="h-3.5 w-3.5" />}
        {report.mediaType === 'video' && <Video className="h-3.5 w-3.5" />}
        {report.severity != null && (
          <span className={report.severity >= 7 ? 'font-semibold text-destructive' : ''}>
            Severity {report.severity}/10
          </span>
        )}
        {href && (
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        )}
      </div>
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
