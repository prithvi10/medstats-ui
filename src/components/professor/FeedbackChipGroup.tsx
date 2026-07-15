import type { ReviewPreset } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FeedbackChipGroupProps {
  title: string;
  presets: ReviewPreset[];
  selected: string[];
  onToggle: (code: string) => void;
}

export function FeedbackChipGroup({ title, presets, selected, onToggle }: FeedbackChipGroupProps) {
  if (presets.length === 0) return null;

  return (
    <div>
      {title && (
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{title}</h4>
      )}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isSelected = selected.includes(preset.code);
          return (
            <button
              key={preset.code}
              type="button"
              onClick={() => onToggle(preset.code)}
              title={preset.hint}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                isSelected
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-brand-300 hover:bg-brand-50'
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 space-y-1">
          {presets
            .filter((p) => selected.includes(p.code))
            .map((p) => (
              <p key={p.code} className="text-xs text-gray-500 italic">
                {p.hint}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
