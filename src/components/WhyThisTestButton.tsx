import { useState } from 'react';
import { api } from '@/lib/api';
import { HelpCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhyThisTestButtonProps {
  submissionId: string;
  variableName: string;
  testType?: string;
  studyDesign?: string;
  className?: string;
}

export function WhyThisTestButton({
  submissionId,
  variableName,
  testType,
  studyDesign,
  className,
}: WhyThisTestButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passages, setPassages] = useState<string[]>([]);
  const [citations, setCitations] = useState<{ source: string; page?: number }[]>([]);
  const [error, setError] = useState('');

  const handleExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const query = testType
        ? `Why was ${testType.replace(/_/g, ' ')} used for ${variableName}?`
        : `Why was this statistical test chosen for ${variableName}?`;
      const tags = [testType, studyDesign].filter(Boolean) as string[];
      const result = await api.rag.explain({
        query,
        submission_id: submissionId,
        tags,
      });
      setPassages(result.passages);
      setCitations(result.citations);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load explanation');
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleExplain}
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 border border-indigo-200"
        title="Explain test choice from knowledge base"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <HelpCircle className="w-3 h-3" />
        )}
        Why this test?
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-left">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Grounded explanation
            </p>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : passages.length === 0 ? (
            <p className="text-xs text-gray-500">No matching guidelines found in the knowledge base.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {passages.map((p, i) => (
                <p key={i} className="text-xs text-gray-700 leading-relaxed font-serif">
                  {p}
                </p>
              ))}
              {citations.length > 0 && (
                <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                  Sources: {citations.map((c) => c.source + (c.page ? ` p.${c.page}` : '')).join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
