import type { SubmissionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { key: 'generated',         label: 'Generated'      },
  { key: 'ai_reviewed',       label: 'AI Reviewed'    },
  { key: 'under_review',      label: 'Pending Review' },
  { key: 'review_in_progress',label: 'In Review'      },
  { key: 'review_completed',  label: 'Reviewed'       },
  { key: 'approved',          label: 'Approved'       },
] as const;

function statusToStepIndex(status: SubmissionStatus): number {
  switch (status) {
    case 'submitted':
    case 'parsing':
    case 'analyzing':
    case 'report_ready':
      return 0;
    case 'ai_reviewed':
      return 1;
    case 'under_review':
      return 2;
    case 'review_in_progress':
      return 3;
    case 'review_completed':
    case 'revision':
      return 4;
    case 'approved':
    case 'exported':
      return 5;
    case 'failed':
    default:
      return 0;
  }
}

export function StatusTracker({ status }: { status: SubmissionStatus }) {
  const currentIndex = statusToStepIndex(status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-5">
        Analysis Status
      </p>

      {/* Desktop */}
      <div className="hidden md:flex items-start">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent   = index === currentIndex;
          const isPending   = index > currentIndex;
          const isLast      = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0">
              {/* Step node */}
              <div className="flex flex-col items-center flex-shrink-0">
                {/* Circle */}
                <div className="relative">
                  {/* Active pulse ring */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-brand-400 opacity-25" />
                  )}
                  <div
                    className={cn(
                      'relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      isCompleted && 'bg-emerald-500 text-white shadow-sm shadow-emerald-200',
                      isCurrent   && 'bg-brand-600 text-white shadow-md shadow-brand-200 ring-4 ring-brand-100',
                      isPending   && 'bg-gray-100 text-gray-400 border border-gray-200'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : index + 1}
                  </div>
                </div>

                {/* Label */}
                <p
                  className={cn(
                    'mt-2.5 text-[11px] text-center leading-tight whitespace-nowrap',
                    isCompleted && 'text-emerald-600 font-medium',
                    isCurrent   && 'text-brand-700 font-semibold',
                    isPending   && 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
              </div>

              {/* Connector — sits between nodes, vertically centred with circle */}
              {!isLast && (
                <div className="flex-1 mt-[18px] mx-1.5">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-colors duration-500',
                      index < currentIndex
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent   = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isCompleted && 'bg-emerald-500 text-white',
                  isCurrent   && 'bg-brand-600 text-white ring-4 ring-brand-100',
                  !isCompleted && !isCurrent && 'bg-gray-100 text-gray-400 border border-gray-200'
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : index + 1}
              </div>
              <p
                className={cn(
                  'text-sm',
                  isCompleted && 'text-emerald-600 font-medium',
                  isCurrent   && 'text-brand-700 font-semibold',
                  !isCompleted && !isCurrent && 'text-gray-400'
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
