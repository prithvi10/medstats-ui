import type { DataProfile, ProfessorReviewDecision, StructuredReviewPayload } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

const DECISION_LABELS: Record<ProfessorReviewDecision, { label: string; color: string }> = {
  approved: { label: 'Approve', color: 'text-green-700 bg-green-50 border-green-200' },
  needs_revision: { label: 'Needs Revision', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  rejected: { label: 'Reject', color: 'text-red-700 bg-red-50 border-red-200' },
};

function presetLabel(presets: DataProfile['presets'] | undefined, code: string): string {
  if (!presets) return code.replace(/_/g, ' ');
  const all = [...presets.methodology, ...presets.executive_summary, ...presets.variable];
  return all.find((p) => p.code === code)?.label || code.replace(/_/g, ' ');
}

export function formatReviewSummaryLines(
  payload: StructuredReviewPayload,
  dataProfile: DataProfile | null
): { section: string; items: string[] }[] {
  const presets = dataProfile?.presets;
  const lines: { section: string; items: string[] }[] = [];

  if (payload.test_overrides.length > 0) {
    lines.push({
      section: 'Test changes',
      items: payload.test_overrides.map(
        (o) => `${o.variable} → ${o.new_test.replace(/_/g, ' ')}`
      ),
    });
  }

  for (const fb of payload.section_feedback) {
    const title =
      fb.target === 'methodology'
        ? 'Statistical Analysis'
        : fb.target === 'executive_summary'
          ? 'Executive Summary'
          : fb.target;
    lines.push({
      section: title,
      items: fb.preset_codes.map((c) => presetLabel(presets, c)),
    });
  }

  return lines;
}

interface ReviewConfirmModalProps {
  open: boolean;
  payload: StructuredReviewPayload | null;
  dataProfile: DataProfile | null;
  reviewRound: number;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}

export function ReviewConfirmModal({
  open,
  payload,
  dataProfile,
  reviewRound,
  onConfirm,
  onCancel,
  confirming,
}: ReviewConfirmModalProps) {
  if (!open || !payload) return null;

  const decisionMeta = DECISION_LABELS[payload.decision];
  const summaryLines = formatReviewSummaryLines(payload, dataProfile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-confirm-title"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 id="review-confirm-title" className="text-lg font-bold text-gray-900">
              Confirm review — Round {reviewRound}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review your feedback before submitting to the student.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className={cn('inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold', decisionMeta.color)}>
            {payload.decision === 'approved' && <CheckCircle2 className="w-4 h-4" />}
            {payload.decision === 'needs_revision' && <AlertTriangle className="w-4 h-4" />}
            {payload.decision === 'rejected' && <XCircle className="w-4 h-4" />}
            {decisionMeta.label}
          </div>

          {payload.decision === 'needs_revision' && summaryLines.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Feedback summary
              </p>
              {summaryLines.map((block) => (
                <div key={block.section} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-800 mb-1.5">{block.section}</p>
                  <ul className="space-y-1">
                    {block.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-brand-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {payload.decision === 'needs_revision' && summaryLines.length === 0 && !payload.final_comment && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No section feedback selected. The revision agent will only receive your final comment, if any.
            </p>
          )}

          {payload.final_comment && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Final comment
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-line">
                {payload.final_comment}
              </p>
            </div>
          )}

          {payload.decision === 'needs_revision' && (
            <p className="text-xs text-gray-500">
              After confirming, the Review Addresser agent will apply your feedback and generate an updated report.
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {confirming ? 'Submitting...' : 'Confirm & submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
