import type { SubmissionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-gray-100 text-gray-700' },
  parsing: { label: 'Parsing', className: 'bg-blue-100 text-blue-700' },
  analyzing: { label: 'Analyzing', className: 'bg-indigo-100 text-indigo-700' },
  report_ready: { label: 'Report Ready', className: 'bg-green-100 text-green-700' },
  ai_reviewed: { label: 'AI Reviewed', className: 'bg-cyan-100 text-cyan-700' },
  under_review: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-700' },
  review_in_progress: { label: 'Review In Progress', className: 'bg-amber-100 text-amber-700' },
  review_completed: { label: 'Review Completed', className: 'bg-orange-100 text-orange-700' },
  revision: { label: 'Revision', className: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  exported: { label: 'Exported', className: 'bg-teal-100 text-teal-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
