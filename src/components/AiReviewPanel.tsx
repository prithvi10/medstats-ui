import { useState } from 'react';
import type { ReviewResponse, ReviewItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const VERDICT_CONFIG = {
  approve_recommended: { label: 'Approve Recommended', icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200' },
  minor_issues: { label: 'Minor Issues Found', icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  needs_attention: { label: 'Needs Attention', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  significant_issues: { label: 'Significant Issues', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' },
};

const SEVERITY_ICONS = {
  ok: { icon: CheckCircle2, color: 'text-green-500' },
  info: { icon: Info, color: 'text-blue-500' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500' },
  error: { icon: XCircle, color: 'text-red-500' },
};

interface AiReviewPanelProps {
  review: ReviewResponse | null;
  compact?: boolean;
}

export function AiReviewPanel({ review, compact }: AiReviewPanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!review) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
        <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No AI pre-review available for this submission.</p>
      </div>
    );
  }

  const summary = review.review_summary;
  const verdictConfig = VERDICT_CONFIG[summary.overall_verdict] || VERDICT_CONFIG.minor_issues;
  const VerdictIcon = verdictConfig.icon;

  const tier1Items = summary.items.filter((item) => item.tier === 1);
  const tier2Items = summary.items.filter((item) => item.tier === 2);
  const tier3Items = summary.items.filter((item) => item.tier === 3);
  const hasDetails = tier1Items.length > 0 || tier2Items.length > 0 || tier3Items.length > 0;

  return (
    <div className="space-y-3">
      <div className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-lg border', verdictConfig.color)}>
        <VerdictIcon className="w-4 h-4 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{verdictConfig.label}</p>
          <p className="text-[11px] opacity-75 mt-0.5">
            {summary.total_checks} checks &middot; {summary.passed} passed
          </p>
        </div>
      </div>

      {!compact && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <StatPill value={summary.passed} label="Passed" color="text-green-600" />
            <StatPill value={summary.info_count} label="Info" color="text-blue-600" />
            <StatPill value={summary.warnings} label="Warnings" color="text-yellow-600" />
            <StatPill value={summary.errors} label="Errors" color="text-red-600" />
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-700">
              Est. review time: <strong>{summary.estimated_review_minutes} min</strong>
            </span>
          </div>
        </>
      )}

      {hasDetails && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <span className="text-sm font-semibold text-gray-700">
              Review details
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({summary.items.length} findings)
              </span>
            </span>
            {detailsOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
          </button>

          {detailsOpen && (
            <div className="p-3 space-y-3 border-t border-gray-100 bg-white">
              {tier2Items.length > 0 && <TierSection title="Methodology" items={tier2Items} />}
              {tier1Items.length > 0 && <TierSection title="Mechanical" items={tier1Items} />}
              {tier3Items.length > 0 && <TierSection title="Interpretation" items={tier3Items} />}
              {compact && (
                <div className="flex items-center gap-2 px-1 py-1 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Est. review time: <strong>{summary.estimated_review_minutes} min</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
      <p className={cn('text-lg font-bold', color)}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function TierSection({ title, items }: { title: string; items: ReviewItem[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {items.map((item, i) => {
          const sevConfig = SEVERITY_ICONS[item.severity] || SEVERITY_ICONS.info;
          const SevIcon = sevConfig.icon;
          return (
            <div key={i} className="px-4 py-2.5 flex items-start gap-2">
              <SevIcon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', sevConfig.color)} />
              <div className="min-w-0">
                <p className="text-xs text-gray-800">{item.message}</p>
                {item.suggestion && (
                  <p className="text-[11px] text-gray-500 mt-0.5 italic">{item.suggestion}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
