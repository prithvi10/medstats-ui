import { useState } from 'react';
import type {
  DataProfile,
  ProfessorReviewDecision,
  StructuredReviewPayload,
  VariableProfile,
} from '@/lib/types';
import { TestOverrideSelect } from './TestOverrideSelect';
import { FeedbackChipGroup } from './FeedbackChipGroup';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Send, Loader2 } from 'lucide-react';

interface ProfessorReviewFormProps {
  dataProfile: DataProfile | null;
  reviewRound: number;
  onSubmit: (payload: StructuredReviewPayload) => Promise<void>;
  submitting: boolean;
  embedded?: boolean;
}

export function ProfessorReviewForm({
  dataProfile,
  reviewRound,
  onSubmit,
  submitting,
  embedded = false,
}: ProfessorReviewFormProps) {
  const [decision, setDecision] = useState<ProfessorReviewDecision | null>(null);
  const [testOverrides, setTestOverrides] = useState<Record<string, string>>({});
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, string[]>>({
    methodology: [],
    executive_summary: [],
  });
  const [finalComment, setFinalComment] = useState('');

  const variables = dataProfile?.variables || [];
  const presets = dataProfile?.presets;

  const togglePreset = (target: string, code: string) => {
    setSectionFeedback((prev) => {
      const current = prev[target] || [];
      const next = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      return { ...prev, [target]: next };
    });
  };

  const handleTestChange = (variable: string, newTest: string) => {
    setTestOverrides((prev) => {
      const next = { ...prev };
      if (newTest) next[variable] = newTest;
      else delete next[variable];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!decision) return;

    const payload: StructuredReviewPayload = {
      decision,
      test_overrides: Object.entries(testOverrides)
        .filter(([, test]) => test)
        .map(([variable, new_test]) => ({ variable, new_test })),
      section_feedback: Object.entries(sectionFeedback)
        .filter(([, codes]) => codes.length > 0)
        .map(([target, preset_codes]) => ({ target, preset_codes })),
      final_comment: finalComment.trim() || undefined,
    };

    // Add per-variable feedback entries
    variables.forEach((v) => {
      const codes = sectionFeedback[v.name];
      if (codes?.length) {
        payload.section_feedback.push({ target: v.name, preset_codes: codes });
      }
    });

    await onSubmit(payload);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {!embedded && (
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Quick Review — Round {reviewRound}</h3>
          <p className="text-xs text-gray-500 mt-1">Use buttons and selections; one optional comment at the end.</p>
        </div>
      )}

      <div className={embedded ? 'space-y-6' : 'p-5 space-y-6'}>
        {/* Decision buttons */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Decision</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <DecisionButton
              active={decision === 'approved'}
              onClick={() => setDecision('approved')}
              icon={CheckCircle2}
              label="Approve"
              description="Report is acceptable"
              color="green"
            />
            <DecisionButton
              active={decision === 'needs_revision'}
              onClick={() => setDecision('needs_revision')}
              icon={AlertTriangle}
              label="Needs Revision"
              description="Apply feedback & regenerate"
              color="amber"
            />
            <DecisionButton
              active={decision === 'rejected'}
              onClick={() => setDecision('rejected')}
              icon={XCircle}
              label="Reject"
              description="Student must re-run"
              color="red"
            />
          </div>
        </div>

        {decision === 'needs_revision' && (
          <>
            <div>
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Change statistical test
              </h4>
              <TestOverrideSelect
                variables={variables}
                overrides={testOverrides}
                onChange={handleTestChange}
              />
            </div>

            {presets && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Section feedback
                </h4>
                <FeedbackChipGroup
                  title="Methodology"
                  presets={presets.methodology}
                  selected={sectionFeedback.methodology || []}
                  onToggle={(code) => togglePreset('methodology', code)}
                />
                <FeedbackChipGroup
                  title="Executive Summary"
                  presets={presets.executive_summary}
                  selected={sectionFeedback.executive_summary || []}
                  onToggle={(code) => togglePreset('executive_summary', code)}
                />
                {variables.map((v) => (
                  <VariableFeedbackRow
                    key={v.name}
                    variable={v}
                    presets={presets.variable}
                    selected={sectionFeedback[v.name] || []}
                    onToggle={(code) => togglePreset(v.name, code)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
            Final comment (optional)
          </label>
          <textarea
            value={finalComment}
            onChange={(e) => setFinalComment(e.target.value)}
            rows={3}
            placeholder="Any additional note for the student..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
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
    green: active ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-green-300',
    amber: active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 hover:border-amber-300',
    red: active ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 hover:border-red-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center',
        colors[color]
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[11px] opacity-70">{description}</span>
    </button>
  );
}

function VariableFeedbackRow({
  variable,
  presets,
  selected,
  onToggle,
}: {
  variable: VariableProfile;
  presets: { code: string; label: string; hint: string }[];
  selected: string[];
  onToggle: (code: string) => void;
}) {
  if (!variable.current_test) return null;
  return (
    <FeedbackChipGroup
      title={`Variable: ${variable.name}`}
      presets={presets}
      selected={selected}
      onToggle={onToggle}
    />
  );
}
