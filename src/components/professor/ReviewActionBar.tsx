import type { ProfessorReviewDecision } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Send, Loader2 } from 'lucide-react';

interface ReviewActionBarProps {
  decision: ProfessorReviewDecision | null;
  onDecisionChange: (decision: ProfessorReviewDecision) => void;
  finalComment: string;
  onFinalCommentChange: (comment: string) => void;
  flaggedCount: number;
  onRequestSubmit: () => void;
  submitting: boolean;
  reviewRound: number;
}

export function ReviewActionBar({
  decision,
  onDecisionChange,
  finalComment,
  onFinalCommentChange,
  flaggedCount,
  onRequestSubmit,
  submitting,
  reviewRound,
}: ReviewActionBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-5 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Submit Review — Round {reviewRound}
          </h4>
          {decision === 'needs_revision' && flaggedCount > 0 && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {flaggedCount} section{flaggedCount !== 1 ? 's' : ''} flagged
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <DecisionButton
            active={decision === 'approved'}
            onClick={() => onDecisionChange('approved')}
            icon={CheckCircle2}
            label="Approve"
            description="Report is acceptable"
            color="green"
          />
          <DecisionButton
            active={decision === 'needs_revision'}
            onClick={() => onDecisionChange('needs_revision')}
            icon={AlertTriangle}
            label="Needs Revision"
            description="Flag sections & regenerate"
            color="amber"
          />
          <DecisionButton
            active={decision === 'rejected'}
            onClick={() => onDecisionChange('rejected')}
            icon={XCircle}
            label="Reject"
            description="Student must re-run"
            color="red"
          />
        </div>

        {decision === 'needs_revision' && (
          <p className="text-xs text-gray-500">
            Select feedback chips next to each report section above, then add an optional final comment below.
          </p>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
            Final comment (optional)
          </label>
          <textarea
            value={finalComment}
            onChange={(e) => onFinalCommentChange(e.target.value)}
            rows={2}
            placeholder="Any additional note for the student..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none bg-white"
          />
        </div>

        <button
          type="button"
          onClick={onRequestSubmit}
          disabled={!decision || submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting review...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DecisionButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof CheckCircle2;
  label: string;
  description: string;
  color: 'green' | 'amber' | 'red';
}) {
  const colors = {
    green: active ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-green-300 bg-white',
    amber: active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 hover:border-amber-300 bg-white',
    red: active ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 hover:border-red-300 bg-white',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center',
        colors[color]
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] opacity-70">{description}</span>
    </button>
  );
}
