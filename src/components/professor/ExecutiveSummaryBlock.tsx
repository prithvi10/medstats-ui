interface ExecutiveSummaryBlockProps {
  summary: string;
}

interface StructuredSummary {
  study_description?: string;
  methodology?: string;
  key_findings?: Array<{ variable: string; result: string; significant: boolean }>;
}

export function ExecutiveSummaryBlock({ summary }: ExecutiveSummaryBlockProps) {
  let structured: StructuredSummary | null = null;
  try {
    structured = JSON.parse(summary);
  } catch {
    // plain text fallback
  }

  if (!structured?.study_description) {
    return (
      <div className="mt-10 mb-6 first:mt-0">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-1 h-6 bg-brand-600 rounded-full" />
          Executive Summary
        </h2>
        <div className="mt-2 h-px bg-gradient-to-r from-brand-200 via-gray-200 to-transparent" />
        <p className="text-[15px] text-gray-700 leading-[1.85] font-serif mt-4 whitespace-pre-line">
          {summary}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 mb-6 first:mt-0">
      <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
        <div className="w-1 h-6 bg-brand-600 rounded-full" />
        Executive Summary
      </h2>
      <div className="mt-2 h-px bg-gradient-to-r from-brand-200 via-gray-200 to-transparent" />

      <div className="mt-5 space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Study Description</h3>
          <p className="text-[15px] text-gray-800 leading-[1.9] font-serif">
            {structured.study_description}
          </p>
        </section>

        {structured.key_findings && structured.key_findings.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Findings</h3>
            <div className="space-y-2">
              {structured.key_findings.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      f.significant ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                  <p className="text-[14px] text-gray-700">
                    <span className="font-medium text-gray-900">{f.variable}</span>
                    {' — '}
                    {f.result}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
