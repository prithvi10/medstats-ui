import type { ReactNode } from 'react';
import type { ProfessorReviewContext } from '@/lib/types';
import { MasterChartPreviewPanel } from '@/components/professor/MasterChartPreview';
import { User, BookOpen, Target, FlaskConical } from 'lucide-react';

interface SubmissionOverviewPanelProps {
  context: ProfessorReviewContext;
}

function SectionHeading({ children, icon: Icon }: { children: ReactNode; icon?: typeof User }) {
  return (
    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-500" />}
      {children}
    </p>
  );
}

export function SubmissionOverviewPanel({ context }: SubmissionOverviewPanelProps) {
  const { student, submission, tests_selected, data_profile } = context;

  return (
    <div className="space-y-6">
      <div
        className={
          tests_selected.length > 0
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start'
            : 'space-y-3'
        }
      >
        <div className="space-y-3 min-w-0">
          <SectionHeading>Submission Details</SectionHeading>
          <MetaRow icon={BookOpen} label="Report title" value={submission.title} />
          <MetaRow icon={User} label="Student" value={`${student.name} · ${student.email}`} />
          {student.department && (
            <MetaRow icon={User} label="Department" value={student.department} />
          )}
          {submission.intent_description && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                <Target className="w-3.5 h-3.5" />
                Analysis intent
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {submission.intent_description}
              </p>
            </div>
          )}
        </div>

        {tests_selected.length > 0 && (
          <div className="min-w-0">
            <TestsSelectedSection tests={tests_selected} />
          </div>
        )}
      </div>

      {/* Master chart preview */}
      <div>
        <SectionHeading>Master chart preview</SectionHeading>
        <MasterChartPreviewPanel preview={context.master_chart_preview} />
      </div>
    </div>
  );
}

function TestsSelectedSection({
  tests,
}: {
  tests: { variable: string; test: string; label: string }[];
}) {
  const uniqueTests = new Set(tests.map((t) => t.test));
  const singleTest = uniqueTests.size === 1;

  if (singleTest) {
    const testLabel = tests[0].label;
    return (
      <div className="h-full">
        <SectionHeading icon={FlaskConical}>Tests selected</SectionHeading>
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 overflow-hidden h-full">
          <div className="px-3 py-2 border-b border-brand-100">
            <p className="text-sm font-semibold text-brand-800">{testLabel}</p>
          </div>
          <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
            {tests.map((t) => (
              <span
                key={t.variable}
                className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-200"
              >
                {t.variable}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const byTest = tests.reduce<Record<string, { label: string; variables: string[] }>>(
    (acc, t) => {
      if (!acc[t.test]) acc[t.test] = { label: t.label, variables: [] };
      acc[t.test].variables.push(t.variable);
      return acc;
    },
    {}
  );

  return (
    <div className="h-full">
      <SectionHeading icon={FlaskConical}>Tests selected</SectionHeading>
      <div className="space-y-2 h-full">
        {Object.entries(byTest).map(([test, { label, variables }]) => (
          <div
            key={test}
            className="rounded-lg border border-brand-100 bg-brand-50/60 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-brand-100">
              <p className="text-sm font-semibold text-brand-800">{label}</p>
            </div>
            <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
              {variables.map((name) => (
                <span
                  key={name}
                  className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-200"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-800 font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
