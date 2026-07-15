import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ProfessorReviewContext, StructuredReviewPayload } from '@/lib/types';
import { AiReviewPanel } from '@/components/AiReviewPanel';
import { ReviewWorkspacePanel } from '@/components/professor/ReviewWorkspacePanel';
import { SubmissionOverviewPanel } from '@/components/professor/SubmissionOverviewPanel';
import { ReviewableReportRenderer } from '@/components/professor/ReviewableReportRenderer';
import { ReviewActionBar } from '@/components/professor/ReviewActionBar';
import { ReviewConfirmModal } from '@/components/professor/ReviewConfirmModal';
import { RevisionProcessingOverlay } from '@/components/professor/RevisionProcessingOverlay';
import { useProfessorReviewState } from '@/hooks/useProfessorReviewState';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTracker } from '@/components/StatusTracker';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileText,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';

type RevisionPhase = 'idle' | 'confirming' | 'submitting' | 'revising' | 'done' | 'failed';

export default function ProfessorSubmissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [context, setContext] = useState<ProfessorReviewContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<RevisionPhase>('idle');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<StructuredReviewPayload | null>(null);
  const [revisionJobId, setRevisionJobId] = useState<string | null>(null);
  const [revisionStep, setRevisionStep] = useState('');
  const [revisionProgress, setRevisionProgress] = useState(0);
  const [revisionJobStatus, setRevisionJobStatus] = useState<string>('queued');
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [error, setError] = useState('');
  const [reportPanelOpen, setReportPanelOpen] = useState(true);
  const [highlightReportVersion, setHighlightReportVersion] = useState<number | null>(null);
  const reportPanelRef = useRef<HTMLElement>(null);

  const reviewState = useProfessorReviewState(context?.data_profile ?? null);
  const resetReview = reviewState.reset;

  const fetchContext = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.professor.getReviewContext(id);
      setContext(data);
      setError('');
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to load submission');
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Poll revision job by specific job id
  useEffect(() => {
    if (phase !== 'revising' || !revisionJobId || !id) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await api.professor.getRevisionJobStatus(id, revisionJobId);
        if (cancelled) return;

        setRevisionStep(status.current_step || '');
        setRevisionProgress(status.progress || 0);
        setRevisionJobStatus(status.status);

        if (status.status === 'completed') {
          const data = await fetchContext();
          resetReview();
          const newVersion = data?.report?.version;
          setSubmitSuccess(
            newVersion
              ? `Revision complete. Report v${newVersion} is ready for your review.`
              : 'Revision complete. Updated report is ready for your review.'
          );
          setHighlightReportVersion(newVersion ?? null);
          setReportPanelOpen(true);
          setPhase('done');
        } else if (status.status === 'failed') {
          setRevisionError(status.error_log || 'Revision agent failed');
          setPhase('failed');
          setError(status.error_log || 'Revision agent failed');
        }
      } catch (err: any) {
        if (!cancelled) {
          setRevisionError(err.message || 'Failed to check revision status');
          setPhase('failed');
          setError(err.message || 'Failed to check revision status');
        }
      }
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase, revisionJobId, id, fetchContext, resetReview]);

  const handleRequestSubmit = () => {
    const payload = reviewState.buildPayload();
    if (!payload) return;
    setPendingPayload(payload);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!id || !pendingPayload) return;

    setConfirmOpen(false);
    setPhase('submitting');
    setSubmitSuccess('');
    setError('');
    setRevisionError(null);

    try {
      const result = await api.professor.submitReview(id, pendingPayload);

      if (result.revision_queued && result.revision_job_id) {
        setRevisionJobId(result.revision_job_id);
        setPhase('revising');
        setSubmitSuccess('Review submitted. Review Addresser is applying your feedback…');
      } else {
        setPhase('idle');
        setSubmitSuccess(
          pendingPayload.decision === 'approved'
            ? 'Report approved successfully.'
            : pendingPayload.decision === 'rejected'
              ? 'Report rejected. Student has been notified.'
              : 'Review submitted successfully.'
        );
        reviewState.reset();
        await fetchContext();
      }
    } catch (err: any) {
      setPhase('idle');
      setError(err.message || 'Failed to submit review');
    } finally {
      setPendingPayload(null);
    }
  };

  const dismissRevisionOverlay = () => {
    setPhase('idle');
    setRevisionJobId(null);
    setRevisionError(null);
  };

  const handleViewUpdatedReport = () => {
    dismissRevisionOverlay();
    setReportPanelOpen(true);
    requestAnimationFrame(() => {
      reportPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && !context) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/professor/dashboard" className="text-sm text-brand-600 hover:underline">
          Back to queue
        </Link>
      </div>
    );
  }

  if (!context || !id) return null;

  const showRevisionOverlay = phase === 'revising' || phase === 'done' || phase === 'failed';
  const overlayStatus: 'queued' | 'running' | 'completed' | 'failed' =
    phase === 'done'
      ? 'completed'
      : phase === 'failed'
        ? 'failed'
        : revisionJobStatus === 'running'
          ? 'running'
          : 'queued';

  return (
    <div className="w-full space-y-6 pb-8">
      <ReviewConfirmModal
        open={confirmOpen}
        payload={pendingPayload}
        dataProfile={context.data_profile}
        reviewRound={context.review_round}
        onConfirm={handleConfirmSubmit}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        confirming={phase === 'submitting'}
      />

      {showRevisionOverlay && (
        <RevisionProcessingOverlay
          currentStep={revisionStep}
          progress={revisionProgress}
          status={overlayStatus}
          errorLog={revisionError}
          newReportVersion={context.report?.version}
          onViewReport={phase === 'done' ? handleViewUpdatedReport : undefined}
          onDismiss={phase === 'failed' ? dismissRevisionOverlay : undefined}
        />
      )}

      {/* Top bar */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/professor/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Review Queue
          </Link>
          <h1 className="text-lg font-bold text-gray-900 truncate">{context.submission.title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={context.submission.status} />
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            Round {context.review_round}
          </span>
          {context.report && (
            <span className="text-xs text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
              Report v{context.report.version}
            </span>
          )}
        </div>
      </div>

      <StatusTracker status={context.submission.status} />

      {(submitSuccess || error) && phase !== 'revising' && (
        <div
          className={`flex-shrink-0 p-3 rounded-lg border text-sm ${
            error
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {!error && <CheckCircle2 className="w-4 h-4" />}
            {error || submitSuccess}
          </div>
        </div>
      )}

      {/* Review panels */}
      <div className="flex flex-col gap-6">
        <ReviewWorkspacePanel
          title="Submission Overview"
          subtitle="Submission details, tests & master chart"
          icon={<ClipboardCheck className="w-6 h-6" />}
          defaultOpen
        >
          <SubmissionOverviewPanel context={context} />
        </ReviewWorkspacePanel>

        <ReviewWorkspacePanel
          title="AI Pre-Review"
          subtitle="Automated checks before professor review"
          icon={<ShieldCheck className="w-6 h-6" />}
          defaultOpen={false}
        >
          <AiReviewPanel
            review={
              context.ai_review
                ? {
                    submission_id: id,
                    review_summary: context.ai_review.review_summary,
                    review_verdict: context.ai_review.review_verdict,
                  }
                : null
            }
            compact
          />
        </ReviewWorkspacePanel>

        <ReviewWorkspacePanel
          title="Analysis Report & Review"
          subtitle={
            context.report
              ? `Version ${context.report.version}${highlightReportVersion === context.report.version ? ' · Updated' : ''} · ${new Date(context.report.generated_at).toLocaleDateString()} · annotate inline, submit at bottom`
              : 'No report generated'
          }
          icon={<FileText className="w-6 h-6" />}
          open={reportPanelOpen}
          onOpenChange={setReportPanelOpen}
          panelRef={reportPanelRef}
          className={highlightReportVersion === context.report?.version ? 'ring-2 ring-brand-300' : undefined}
        >
          {context.report ? (
            <div className="relative">
              <ReviewableReportRenderer
                key={`report-v${context.report.id}-${context.report.version}`}
                report={context.report}
                reviewState={reviewState}
              />
              <ReviewActionBar
                decision={reviewState.decision}
                onDecisionChange={reviewState.setDecision}
                finalComment={reviewState.finalComment}
                onFinalCommentChange={reviewState.setFinalComment}
                flaggedCount={reviewState.flaggedSectionCount}
                onRequestSubmit={handleRequestSubmit}
                submitting={phase === 'submitting' || phase === 'revising'}
                reviewRound={context.review_round}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No report available yet.</p>
          )}

          {context.review_history.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Prior reviews
              </h4>
              <div className="space-y-3">
                {context.review_history.map((r) => (
                  <div key={r.id} className="text-sm border-l-2 border-gray-200 pl-3">
                    <p className="font-medium text-gray-800">
                      {r.professor_name} — {r.decision.replace('_', ' ')} (v{r.report_version})
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.reviewed_at).toLocaleString()}
                    </p>
                    {r.feedback && <p className="text-gray-600 mt-1 text-xs">{r.feedback}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReviewWorkspacePanel>
      </div>
    </div>
  );
}
