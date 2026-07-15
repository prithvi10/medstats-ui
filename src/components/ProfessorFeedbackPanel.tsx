import { Link } from 'react-router-dom';
import type { StudentProfessorReviewResponse } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const DECISION_CONFIG = {
  approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  needs_revision: { label: 'Needs Revision', icon: AlertTriangle, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-50 border-red-200 text-red-800' },
};

export function ProfessorFeedbackPanel({ data }: { data: StudentProfessorReviewResponse }) {
  const review = data.latest_review;
  const config = DECISION_CONFIG[review.decision] || DECISION_CONFIG.needs_revision;
  const Icon = config.icon;
  const comments = review.section_comments;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className={cn('px-5 py-4 border-b flex items-center gap-3', config.color)}>
        <Icon className="w-5 h-5" />
        <div>
          <h3 className="font-semibold text-sm">Professor Review — {config.label}</h3>
          <p className="text-xs opacity-80">
            Round {data.review_round} &middot; {review.professor_name} &middot;{' '}
            {new Date(review.reviewed_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4 text-sm">
        {comments?.test_overrides && comments.test_overrides.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Test changes requested</p>
            <ul className="space-y-1">
              {comments.test_overrides.map((o, i) => (
                <li key={i} className="text-gray-700">
                  <span className="font-medium">{o.variable}</span> → {o.new_test.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {comments?.section_feedback && comments.section_feedback.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Feedback items</p>
            <ul className="space-y-2">
              {comments.section_feedback.map((fb, i) => (
                <li key={i} className="text-gray-700">
                  <span className="font-medium capitalize">{fb.target.replace(/_/g, ' ')}:</span>{' '}
                  {fb.preset_codes.map((c) => c.replace(/_/g, ' ')).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {review.feedback && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Professor comment</p>
            <p className="text-gray-700 whitespace-pre-line">{review.feedback}</p>
          </div>
        )}

        {(data.status === 'revision' || data.status === 'report_ready') && review.decision === 'needs_revision' && (
          <p className="text-xs text-gray-500 italic">
            A revised report may be available. Review the updated sections above.
          </p>
        )}
      </div>
    </div>
  );
}
