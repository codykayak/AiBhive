import type { JobStatus } from './jobs';
import { colors } from '../theme/colors';

export function jobStatusTone(status: JobStatus): 'amber' | 'success' | 'danger' | 'info' | 'muted' | 'purple' {
  switch (status) {
    case 'offer':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'interviewing':
      return 'purple';
    case 'submitted':
      return 'info';
    case 'generated':
      return 'amber';
    default:
      return 'muted';
  }
}

export function jobStatusColor(status: JobStatus): string {
  const map: Record<JobStatus, string> = {
    draft: colors.textMuted,
    generated: colors.amberLight,
    submitted: colors.info,
    interviewing: colors.purple,
    rejected: colors.danger,
    offer: colors.success,
  };
  return map[status];
}
