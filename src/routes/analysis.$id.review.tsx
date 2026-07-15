import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ReviewResponse, ReviewItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  ShieldCheck,
  RefreshCw,
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

export default function AnalysisReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggering, setTriggering] = useState(false);

  const fetchReview = async () => {
    if (!id) return;
    try {
      const data = await api.analysis.getReview(id);
      setReview(data);
    } catch {
      // Review doesn't exist yet
      setReview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  const handleTriggerReview = async () => {
    if (!id) return;
    setTriggering(true);
    setError('');
    try {
      await api.analysis.triggerReview(id);
      // Poll for result
      setTimeout(fetchReview, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger review');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
          <div className="h-48 bg-white rounded-xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link to={`/analysis/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Report
        </Link>
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Pre-Review</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Run an automated quality check before submitting to your professor.
            This pre-screens statistical accuracy, methodology, and interpretation.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 max-w-sm mx-auto">
              {error}
            </div>
          )}
          <button
            onClick={handleTriggerReview}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors"
          >
            {triggering ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Running Review...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Run AI Review
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const summary = review.review_summary;
  const verdictConfig = VERDICT_CONFIG[summary.overall_verdict] || VERDICT_CONFIG.minor_issues;
  const VerdictIcon = verdictConfig.icon;

  const tier1Items = summary.items.filter((item) => item.tier === 1);
  const tier2Items = summary.items.filter((item) => item.tier === 2);
  const tier3Items = summary.items.filter((item) => item.tier === 3);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/analysis/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Report
          </Link>
          <h1 className="text-xl font-bold text-gray-900">AI Pre-Review</h1>
        </div>
        <button
          onClick={handleTriggerReview}
          disabled={triggering}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', triggering && 'animate-spin')} /> Re-run
        </button>
      </div>

      {/* Verdict */}
      <div className={cn('flex items-center gap-4 p-5 rounded-xl border', verdictConfig.color)}>
        <VerdictIcon className="w-8 h-8 flex-shrink-0" />
        <div>
          <h2 className="font-semibold text-lg">{verdictConfig.label}</h2>
          <p className="text-sm opacity-80 mt-0.5">
            {summary.total_checks} checks performed &middot; {summary.passed} passed
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
          <p className="text-xs text-gray-500">Passed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.info_count}</p>
          <p className="text-xs text-gray-500">Info</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{summary.warnings}</p>
          <p className="text-xs text-gray-500">Warnings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
          <p className="text-xs text-gray-500">Errors</p>
        </div>
      </div>

      {/* Estimated Review Time */}
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">
          Estimated professor review time: <strong>{summary.estimated_review_minutes} minutes</strong>
        </span>
      </div>

      {/* Tier Breakdown */}
      {tier1Items.length > 0 && <TierSection title="Tier 1 — Mechanical Checks" items={tier1Items} />}
      {tier2Items.length > 0 && <TierSection title="Tier 2 — Methodology" items={tier2Items} />}
      {tier3Items.length > 0 && <TierSection title="Tier 3 — Interpretation" items={tier3Items} />}

      {summary.items.length === 0 && (
        <div className="text-center py-8 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-800">All checks passed — no issues found.</p>
        </div>
      )}
    </div>
  );
}

function TierSection({ title, items }: { title: string; items: ReviewItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => {
          const sevConfig = SEVERITY_ICONS[item.severity] || SEVERITY_ICONS.info;
          const SevIcon = sevConfig.icon;
          return (
            <div key={i} className="px-5 py-3 flex items-start gap-3">
              <SevIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', sevConfig.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.category}</span>
                  {item.variable && (
                    <span className="text-xs text-gray-400">({item.variable})</span>
                  )}
                </div>
                <p className="text-sm text-gray-800 mt-0.5">{item.message}</p>
                {item.suggestion && (
                  <p className="text-xs text-gray-500 mt-1 italic">&rarr; {item.suggestion}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
