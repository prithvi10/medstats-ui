import type { Report, DataProfile } from '@/lib/types';
import type { ProfessorReviewState } from '@/hooks/useProfessorReviewState';
import { ReportRenderer, type ReportReviewContext } from '@/components/ReportRenderer';
import { ExecutiveSummaryBlock } from './ExecutiveSummaryBlock';
import { SectionFeedbackStrip } from './SectionFeedbackStrip';

interface ReviewableReportRendererProps {
  report: Report;
  reviewState: ProfessorReviewState;
}

export function ReviewableReportRenderer({ report, reviewState }: ReviewableReportRendererProps) {
  const {
    reviewMode,
    sectionFeedback,
    testOverrides,
    presets,
    variables,
    togglePreset,
    handleTestChange,
  } = reviewState;

  const reviewContext: ReportReviewContext | undefined = presets
    ? {
        reviewMode,
        sectionFeedback,
        testOverrides,
        presets,
        variables,
        onToggleFeedback: togglePreset,
        onTestOverride: handleTestChange,
      }
    : undefined;

  const execSelected = sectionFeedback.executive_summary || [];
  const execHasFeedback = execSelected.length > 0;

  return (
    <div className="pb-4">
      {report.summary && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4 xl:gap-6 items-start mb-2">
          <div className="min-w-0">
            <ExecutiveSummaryBlock summary={report.summary} />
          </div>
          {reviewMode && presets && (
            <div className="xl:sticky xl:top-4">
              <SectionFeedbackStrip
                title="Executive Summary"
                target="executive_summary"
                presets={presets.executive_summary}
                selected={execSelected}
                onToggle={(code) => togglePreset('executive_summary', code)}
                active={reviewMode}
                hasFeedback={execHasFeedback}
              />
            </div>
          )}
        </div>
      )}

      <ReportRenderer
        sections={report.sections}
        reviewContext={reviewContext}
      />
    </div>
  );
}
