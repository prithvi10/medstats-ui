import type { ReviewPreset, VariableProfile } from '@/lib/types';
import { FeedbackChipGroup } from './FeedbackChipGroup';
import { cn } from '@/lib/utils';
import { MessageSquarePlus } from 'lucide-react';

interface SectionFeedbackStripProps {
  title: string;
  target: string;
  presets: ReviewPreset[];
  selected: string[];
  onToggle: (code: string) => void;
  variable?: VariableProfile;
  testOverride?: string;
  onTestOverride?: (test: string) => void;
  active: boolean;
  hasFeedback: boolean;
}

export function SectionFeedbackStrip({
  title,
  presets,
  selected,
  onToggle,
  variable,
  testOverride,
  onTestOverride,
  active,
  hasFeedback,
}: SectionFeedbackStripProps) {
  if (!active) return null;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 h-full',
        hasFeedback
          ? 'border-amber-200 bg-amber-50/50'
          : 'border-gray-200 bg-gray-50/80'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquarePlus className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Feedback — {title}
        </p>
      </div>

      <FeedbackChipGroup
        title=""
        presets={presets}
        selected={selected}
        onToggle={onToggle}
      />

      {variable?.valid_test_alternatives && variable.valid_test_alternatives.length > 0 && onTestOverride && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
            Change test
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Current: {variable.current_test ? variable.current_test.replace(/_/g, ' ') : 'Not set'}
          </p>
          <select
            value={testOverride || ''}
            onChange={(e) => onTestOverride(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          >
            <option value="">Keep current test</option>
            {variable.valid_test_alternatives.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === variable.current_test}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
            Available: {variable.valid_test_alternatives.map((o) => o.label).join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}
