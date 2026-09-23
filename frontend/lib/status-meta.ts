import type { ReportStatus } from './types';

export const STATUS_META: Record<
  ReportStatus,
  { label: string; classes: string; dot: string }
> = {
  PENDING: {
    label: 'Pending Review',
    classes: 'bg-warning/15 text-warning border-warning/30',
    dot: 'bg-warning',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    classes: 'bg-primary/15 text-primary border-primary/30',
    dot: 'bg-primary',
  },
  RESOLVED: {
    label: 'Resolved',
    classes: 'bg-success/15 text-success border-success/30',
    dot: 'bg-success',
  },
  DISMISSED: {
    label: 'Dismissed',
    classes: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
};

export const PRIORITY_META: Record<string, { label: string; classes: string }> = {
  CRITICAL: { label: 'Critical', classes: 'bg-destructive text-destructive-foreground' },
  HIGH: { label: 'High', classes: 'bg-warning text-warning-foreground' },
  MEDIUM: { label: 'Medium', classes: 'bg-primary text-primary-foreground' },
  LOW: { label: 'Low', classes: 'bg-muted text-muted-foreground' },
};
