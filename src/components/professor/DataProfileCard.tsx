import type { DataProfile } from '@/lib/types';
import { Database, Users, BarChart3 } from 'lucide-react';

const TEST_LABELS: Record<string, string> = {
  z_test_proportion: 'Z-test',
  chi_square: 'Chi-square',
  fisher_exact: "Fisher's exact",
  unpaired_t_test: 'Unpaired t-test',
  paired_t_test: 'Paired t-test',
  mann_whitney_u: 'Mann-Whitney',
  one_way_anova: 'ANOVA',
  kruskal_wallis: 'Kruskal-Wallis',
  shapiro_wilk: 'Shapiro-Wilk',
};

export function DataProfileCard({
  profile,
  compact = false,
}: {
  profile: DataProfile;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <p className="text-xs text-gray-600 px-3 py-2 bg-gray-50 border-b border-gray-100 leading-relaxed">
          {profile.summary}
        </p>
        <div className="grid grid-cols-3 gap-px bg-gray-100 text-center">
          <MiniMetric label="Design" value={profile.study_design_label} />
          <MiniMetric label="N" value={String(profile.sample_size)} />
          <MiniMetric label="Vars" value={String(profile.variable_count)} />
        </div>
        <div className="max-h-36 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-2 py-1.5 font-medium">Variable</th>
                <th className="px-2 py-1.5 font-medium">Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profile.variables.map((v) => (
                <tr key={v.name}>
                  <td className="px-2 py-1.5 font-medium text-gray-800">{v.name}</td>
                  <td className="px-2 py-1.5 text-gray-600">
                    {v.current_test ? TEST_LABELS[v.current_test] || v.current_test : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-600" />
          Input Data Profile
        </h3>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.summary}</p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-gray-100">
        <Metric label="Study design" value={profile.study_design_label} icon={Users} />
        <Metric label="Sample size" value={`N = ${profile.sample_size}`} icon={BarChart3} />
        <Metric label="Variables" value={String(profile.variable_count)} icon={Database} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Variable</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Distribution</th>
              <th className="px-4 py-2 font-medium">Test used</th>
              <th className="px-4 py-2 font-medium">Normality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profile.variables.map((v) => (
              <tr key={v.name} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{v.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{v.dtype || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{v.distribution_note || '—'}</td>
                <td className="px-4 py-2.5">
                  {v.current_test ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 font-medium">
                      {TEST_LABELS[v.current_test] || v.current_test}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {v.normality_ok === true && <span className="text-xs text-green-600 font-medium">Normal</span>}
                  {v.normality_ok === false && <span className="text-xs text-amber-600 font-medium">Non-normal</span>}
                  {v.normality_ok == null && <span className="text-gray-400 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-2 py-2">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className="text-xs font-semibold text-gray-900 truncate" title={value}>{value}</p>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Database }) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
