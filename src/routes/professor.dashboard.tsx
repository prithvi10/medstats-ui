import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ProfessorSubmissionItem, SubmissionStatus } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { ClipboardList, User } from 'lucide-react';

const FILTERS: { value: SubmissionStatus | 'all'; label: string }[] = [
  { value: 'under_review', label: 'Awaiting Review' },
  { value: 'revision', label: 'Revised' },
  { value: 'approved', label: 'Approved' },
  { value: 'all', label: 'All' },
];

const AWAITING_REVIEW_STATUSES: SubmissionStatus[] = ['under_review', 'report_ready', 'analyzing'];

export default function ProfessorDashboardPage() {
  const [submissions, setSubmissions] = useState<ProfessorSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SubmissionStatus | 'all'>('under_review');

  useEffect(() => {
    api.professor.listSubmissions()
      .then((res) => setSubmissions(res.submissions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? submissions
    : filter === 'under_review'
      ? submissions.filter((s) => AWAITING_REVIEW_STATUSES.includes(s.status))
      : submissions.filter((s) => s.status === filter);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Student submissions assigned to you for review</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === f.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-300'
            )}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1.5 opacity-70">
                ({f.value === 'under_review'
                  ? submissions.filter((s) => AWAITING_REVIEW_STATUSES.includes(s.status)).length
                  : submissions.filter((s) => s.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions in this queue</h3>
          <p className="text-sm text-gray-500">
            {filter === 'under_review'
              ? 'Students will appear here after they submit reports for review.'
              : 'Try a different filter to see other submissions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <Link
              key={sub.id}
              to={`/professor/submissions/${sub.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{sub.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {sub.student_name}
                    </span>
                    <span>Round {sub.review_round + 1}</span>
                    <span>{new Date(sub.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
