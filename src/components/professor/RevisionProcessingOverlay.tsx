import { Loader2, FlaskConical, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevisionProcessingOverlayProps {
  currentStep?: string;
  progress?: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  errorLog?: string | null;
  newReportVersion?: number;
  onViewReport?: () => void;
  onDismiss?: () => void;
}

const STEPS = [
  { key: 'queued', label: 'Queued', icon: Loader2 },
  { key: 'running', label: 'Applying feedback', icon: FlaskConical },
  { key: 'completed', label: 'Report updated', icon: FileText },
];

export function RevisionProcessingOverlay({
  currentStep,
  progress,
  status,
  errorLog,
  newReportVersion,
  onViewReport,
  onDismiss,
}: RevisionProcessingOverlayProps) {
  const activeIndex =
    status === 'completed' ? 2 : status === 'running' ? 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center">
        {status === 'failed' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Revision failed</h2>
            <p className="text-sm text-gray-600 mb-4">
              {errorLog || 'The Review Addresser agent could not apply your feedback.'}
            </p>
            <p className="text-xs text-gray-500">You can close this and try submitting again.</p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="mt-4 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            )}
          </>
        ) : status === 'completed' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Updated report ready</h2>
            <p className="text-sm text-gray-600 mb-6">
              {newReportVersion
                ? `Version ${newReportVersion} is ready for your review.`
                : 'The revised report is ready for your review.'}
            </p>
            {onViewReport && (
              <button
                type="button"
                onClick={onViewReport}
                className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors"
              >
                View updated report
              </button>
            )}
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Review Addresser at work</h2>
            <p className="text-sm text-gray-500 mb-6">
              Applying your feedback and regenerating the report…
            </p>

            <div className="space-y-3 text-left mb-6">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i < activeIndex;
                const active = i === activeIndex;
                return (
                  <div
                    key={step.key}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                      active && 'bg-brand-50 text-brand-800',
                      done && 'text-green-700',
                      !active && !done && 'text-gray-400'
                    )}
                  >
                    {active ? (
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    ) : done ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="font-medium">{step.label}</span>
                  </div>
                );
              })}
            </div>

            {currentStep && (
              <p className="text-xs text-gray-500">{currentStep}</p>
            )}
            {typeof progress === 'number' && progress > 0 && (
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
