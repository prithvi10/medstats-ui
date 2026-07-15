import { useState, type ReactNode } from 'react';
import type { ReportSection, ReviewPreset, VariableProfile } from '@/lib/types';
import { ChartRenderer, deriveChartDataFromRows, inferChartTypeFromData } from './ChartRenderer';
import { SectionFeedbackStrip } from './professor/SectionFeedbackStrip';
import { findVariableProfile } from '@/hooks/useProfessorReviewState';
import { cn } from '@/lib/utils';
import { WhyThisTestButton } from './WhyThisTestButton';
import { ChevronDown, ChevronUp, FileText, FlaskConical, BookOpen } from 'lucide-react';

export interface ReportReviewContext {
  reviewMode: boolean;
  sectionFeedback: Record<string, string[]>;
  testOverrides: Record<string, string>;
  presets: {
    methodology: ReviewPreset[];
    executive_summary: ReviewPreset[];
    variable: ReviewPreset[];
  };
  variables: VariableProfile[];
  onToggleFeedback: (target: string, code: string) => void;
  onTestOverride: (variable: string, test: string) => void;
}

interface ReportRendererProps {
  sections: ReportSection[];
  submissionId?: string;
  studyDesign?: string;
  onRegenerateSection?: (variableName: string) => void;
  reviewContext?: ReportReviewContext;
}

export function ReportRenderer({ sections, submissionId, studyDesign, onRegenerateSection, reviewContext }: ReportRendererProps) {
  const groupedSections = groupByVariable(sections);

  return (
    <div className="report-viewer">
      {groupedSections
        .filter((g) => g.type !== 'methodology_block')
        .map((group, i) => (
          <ReportGroup
            key={i}
            group={group}
            submissionId={submissionId}
            studyDesign={studyDesign}
            onRegenerate={onRegenerateSection}
            reviewContext={reviewContext}
          />
        ))}
    </div>
  );
}

interface SectionGroup {
  type: 'variable_block' | 'standalone' | 'methodology_block';
  variableName?: string;
  tableNumber?: string;
  sections: ReportSection[];
}

function groupByVariable(sections: ReportSection[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let currentGroup: SectionGroup | null = null;

  for (const section of sections) {
    if (section.type === 'heading') {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = null;
      if (section.content?.toLowerCase().includes('statistical analysis')) {
        groups.push({ type: 'methodology_block', sections: [section] });
      } else {
        groups.push({ type: 'standalone', sections: [section] });
      }
    } else if (section.type === 'table_heading') {
      if (currentGroup) groups.push(currentGroup);
      const match = section.content?.match(/Table No\.(\d+):\s*(.*)/i);
      currentGroup = {
        type: 'variable_block',
        variableName: match?.[2] || section.variable_name || section.content || '',
        tableNumber: match?.[1] || '',
        sections: [section],
      };
    } else {
      const last = groups[groups.length - 1];
      if (last?.type === 'methodology_block' && section.type === 'paragraph') {
        last.sections.push(section);
      } else if (currentGroup) {
        currentGroup.sections.push(section);
      } else {
        groups.push({ type: 'standalone', sections: [section] });
      }
    }
  }
  if (currentGroup) groups.push(currentGroup);
  return groups;
}

function ReportGroup({
  group,
  submissionId,
  studyDesign,
  onRegenerate,
  reviewContext,
}: {
  group: SectionGroup;
  submissionId?: string;
  studyDesign?: string;
  onRegenerate?: (v: string) => void;
  reviewContext?: ReportReviewContext;
}) {
  if (group.type === 'methodology_block') {
    const content = (
      <>
        {group.sections.map((s, i) => (
          <StandaloneSection key={i} section={s} />
        ))}
      </>
    );
    return (
      <ReviewableSectionLayout
        reviewContext={reviewContext}
        target="methodology"
        title="Statistical Analysis"
        presets={reviewContext?.presets.methodology}
        content={content}
      />
    );
  }

  if (group.type === 'standalone') {
    return (
      <>
        {group.sections.map((s, i) => (
          <StandaloneSection key={i} section={s} />
        ))}
      </>
    );
  }

  const variableProfile = group.variableName
    ? findVariableProfile(group.variableName, reviewContext?.variables || [])
    : undefined;
  const feedbackTarget = variableProfile?.name || group.variableName || '';
  const selected = reviewContext?.sectionFeedback[feedbackTarget] || [];
  const hasFeedback =
    selected.length > 0 || Boolean(reviewContext?.testOverrides[feedbackTarget]);

  const card = (
    <VariableCard
      group={group}
      submissionId={submissionId}
      studyDesign={studyDesign}
      onRegenerate={onRegenerate}
      highlighted={hasFeedback}
    />
  );

  if (!reviewContext?.reviewMode || !group.variableName) {
    return card;
  }

  return (
    <ReviewableSectionLayout
      reviewContext={reviewContext}
      target={feedbackTarget}
      title={group.variableName}
      presets={reviewContext.presets.variable}
      variable={variableProfile}
      content={card}
    />
  );
}

function ReviewableSectionLayout({
  reviewContext,
  target,
  title,
  presets,
  variable,
  content,
}: {
  reviewContext?: ReportReviewContext;
  target: string;
  title: string;
  presets?: ReviewPreset[];
  variable?: VariableProfile;
  content: ReactNode;
}) {
  const selected = reviewContext?.sectionFeedback[target] || [];
  const hasFeedback =
    selected.length > 0 || Boolean(reviewContext?.testOverrides[target]);

  if (!reviewContext?.reviewMode || !presets) {
    return <>{content}</>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4 xl:gap-6 items-start my-2">
      <div className="min-w-0">{content}</div>
      <div className="xl:sticky xl:top-4">
        <SectionFeedbackStrip
          title={title}
          target={target}
          presets={presets}
          selected={selected}
          onToggle={(code) => reviewContext.onToggleFeedback(target, code)}
          variable={variable}
          testOverride={reviewContext.testOverrides[target]}
          onTestOverride={
            variable
              ? (test) => reviewContext.onTestOverride(variable.name, test)
              : undefined
          }
          active={reviewContext.reviewMode}
          hasFeedback={hasFeedback}
        />
      </div>
    </div>
  );
}

function StandaloneSection({ section }: { section: ReportSection }) {
  if (section.type === 'heading') {
    if (section.content?.toLowerCase().includes('prior literature context')) return null;
    return (
      <div className="mt-10 mb-6 first:mt-0">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-1 h-6 bg-brand-600 rounded-full" />
          {section.content}
        </h2>
        <div className="mt-2 h-px bg-gradient-to-r from-brand-200 via-gray-200 to-transparent" />
      </div>
    );
  }

  if (section.type === 'paragraph') {
    return (
      <p className="text-[14px] text-gray-700 leading-[1.75] mb-4 font-serif">
        {section.content}
      </p>
    );
  }

  if (section.type === 'literature_context') {
    return null;
  }

  return null;
}

function VariableCard({
  group,
  submissionId,
  studyDesign,
  onRegenerate,
  highlighted,
}: {
  group: SectionGroup;
  submissionId?: string;
  studyDesign?: string;
  onRegenerate?: (v: string) => void;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const hasChart = group.sections.some((s) => s.type === 'chart');

  const tableSection = group.sections.find((s) => s.type === 'table');
  const derivedChartData = deriveChartDataFromRows(tableSection?.rows);
  const derivedChartType = inferChartTypeFromData(derivedChartData);
  const testSection = group.sections.find((s) => s.type === 'test_result');
  const testTypeMatch = testSection?.content?.match(/(\w+(?:_\w+)*)\s*test/i);

  return (
    <div
      className={cn(
        'my-6 bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md',
        highlighted ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
      )}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {group.tableNumber && (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700 text-xs font-bold">
              {group.tableNumber}
            </span>
          )}
          <h3 className="text-[15px] font-semibold text-gray-900">
            {group.variableName}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {submissionId && group.variableName && (
            <WhyThisTestButton
              submissionId={submissionId}
              variableName={group.variableName}
              testType={testTypeMatch?.[1]?.toLowerCase()}
              studyDesign={studyDesign}
            />
          )}
          {onRegenerate && group.variableName && (
            <button
              onClick={(e) => { e.stopPropagation(); onRegenerate(group.variableName!); }}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50"
            >
              Regenerate
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div className="px-6 pb-6 space-y-4">
          {group.sections.map((section, i) => {
            if (section.type === 'table_heading') return null;
            if (section.type === 'chart') {
              const chartData = section.chart_data?.length ? section.chart_data : derivedChartData;
              if (chartData.length > 0) {
                return (
                  <ChartRenderer
                    key={i}
                    variable={section.variable_name || group.variableName}
                    data={chartData}
                    chartType={section.chart_type === 'pie' ? 'pie' : derivedChartType}
                  />
                );
              }
              return null;
            }
            return <VariableSection key={i} section={section} derivedChartData={derivedChartData} derivedChartType={derivedChartType} variableName={group.variableName} />;
          })}
          {/* If no explicit chart section but we have table data, render a derived chart */}
          {!hasChart && derivedChartData.length > 1 && (
            <ChartRenderer
              variable={group.variableName}
              data={derivedChartData}
              chartType={derivedChartType}
            />
          )}
        </div>
      )}
    </div>
  );
}

function VariableSection({
  section,
  derivedChartData,
  derivedChartType,
  variableName,
}: {
  section: ReportSection;
  derivedChartData?: { name: string; value: number }[];
  derivedChartType?: 'pie' | 'bar' | 'horizontalBar';
  variableName?: string;
}) {
  switch (section.type) {
    case 'summary_text':
      return (
        <p className="text-[15px] text-gray-800 leading-[1.85] font-serif my-2">
          {section.content}
        </p>
      );

    case 'paragraph':
      return (
        <p className="text-[13.5px] text-gray-700 leading-[1.75] font-serif">
          {section.content}
        </p>
      );

    case 'table':
      return <DataTable headers={section.headers} rows={section.rows} tableFormat={section.table_format} />;

    case 'test_result':
      return <TestResultBadge content={section.content || ''} />;

    case 'chart': {
      const chartData = section.chart_data?.length ? section.chart_data : derivedChartData;
      if (!chartData?.length) return null;
      return (
        <ChartRenderer
          variable={section.variable_name || variableName}
          data={chartData}
          chartType={section.chart_type === 'pie' ? 'pie' : derivedChartType || 'bar'}
        />
      );
    }

    case 'descriptive_note':
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12.5px] text-slate-600 font-medium font-mono">{section.content}</span>
        </div>
      );

    default:
      return section.content ? (
        <p className="text-sm text-gray-600">{section.content}</p>
      ) : null;
  }
}

function DataTable({ headers, rows, tableFormat }: { headers?: string[]; rows?: string[][]; tableFormat?: string }) {
  const [showAll, setShowAll] = useState(false);
  if (!headers || !rows || rows.length === 0) return null;

  const visibleRows = showAll ? rows : rows.slice(0, 12);
  const hasMore = rows.length > 12;

  const headerStyle = tableFormat === 'stats_summary'
    ? 'bg-gradient-to-r from-slate-700 to-slate-800'
    : tableFormat === 'comprehensive'
    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700'
    : tableFormat === 'range_distribution'
    ? 'bg-gradient-to-r from-teal-600 to-teal-700'
    : tableFormat === 'binary'
    ? 'bg-gradient-to-r from-purple-600 to-purple-700'
    : 'bg-gradient-to-r from-brand-600 to-brand-700';

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={headerStyle}>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 text-left text-[12px] font-semibold text-white uppercase tracking-wider',
                    i > 0 && 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => {
              const isTotal = row[0]?.toUpperCase() === 'TOTAL';
              const isMeanRow = row[0]?.toLowerCase().includes('mean');
              return (
                <tr
                  key={i}
                  className={cn(
                    'transition-colors',
                    isTotal
                      ? 'bg-gray-100 font-semibold border-t-2 border-gray-300'
                      : isMeanRow
                      ? 'bg-blue-50/70 font-medium border-t border-blue-200'
                      : i % 2 === 0
                        ? 'bg-white hover:bg-blue-50/50'
                        : 'bg-gray-50/50 hover:bg-blue-50/50'
                  )}
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        'px-4 py-2.5 text-[13px]',
                        j === 0 ? 'text-gray-900 font-medium' : 'text-gray-700 text-right tabular-nums',
                        isTotal && 'text-gray-900',
                        isMeanRow && 'text-blue-800'
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {showAll ? 'Show less' : `Show all ${rows.length} rows`}
          </button>
        </div>
      )}
    </div>
  );
}

function TestResultBadge({ content }: { content: string }) {
  const isSignificant = /significant|p\s*[<≤]\s*0\.05/i.test(content) && !/not significant|insignificant/i.test(content);

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border',
        isSignificant
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      )}
    >
      <div className={cn(
        'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
        isSignificant ? 'bg-emerald-200' : 'bg-amber-200'
      )}>
        <FlaskConical className={cn('w-3 h-3', isSignificant ? 'text-emerald-700' : 'text-amber-700')} />
      </div>
      <div>
        <span className={cn(
          'text-[11px] font-bold uppercase tracking-wider',
          isSignificant ? 'text-emerald-700' : 'text-amber-700'
        )}>
          {isSignificant ? 'Statistically Significant' : 'Not Significant'}
        </span>
        <p className={cn(
          'text-[13px] mt-0.5 leading-snug',
          isSignificant ? 'text-emerald-800' : 'text-amber-800'
        )}>
          {content}
        </p>
      </div>
    </div>
  );
}
