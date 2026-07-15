import type { VariableProfile } from '@/lib/types';

interface TestOverrideSelectProps {
  variables: VariableProfile[];
  overrides: Record<string, string>;
  onChange: (variable: string, newTest: string) => void;
}

export function TestOverrideSelect({ variables, overrides, onChange }: TestOverrideSelectProps) {
  const withTests = variables.filter(
    (v) => v.valid_test_alternatives && v.valid_test_alternatives.length > 0
  );

  if (withTests.length === 0) {
    return (
      <p className="text-sm text-gray-500">No statistical tests to override in this report.</p>
    );
  }

  return (
    <div className="space-y-3">
      {withTests.map((v) => (
        <div key={v.name} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="sm:w-40 flex-shrink-0">
            <p className="text-sm font-medium text-gray-900">{v.name}</p>
            <p className="text-xs text-gray-500">
              Current: {v.current_test ? v.current_test.replace(/_/g, ' ') : 'Not set'}
            </p>
          </div>
          <select
            value={overrides[v.name] || ''}
            onChange={(e) => onChange(v.name, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          >
            <option value="">Keep current test</option>
            {(v.valid_test_alternatives || []).map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === v.current_test}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
