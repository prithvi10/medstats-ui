import { useState } from 'react';
import type { MasterChartPreview } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Table2, ChevronDown, ChevronUp } from 'lucide-react';

interface MasterChartPreviewProps {
  preview: MasterChartPreview | null;
}

export function MasterChartPreviewPanel({ preview }: MasterChartPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!preview) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
        <Table2 className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-500">Master chart preview unavailable</p>
      </div>
    );
  }

  const collapsedHeight = 'max-h-44';

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{preview.file_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {preview.row_count} rows × {preview.column_count} columns
            {preview.truncated && ' (preview truncated)'}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-brand-700 flex-shrink-0">
          {expanded ? (
            <>
              Collapse <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Expand <ChevronDown className="w-4 h-4" />
            </>
          )}
        </span>
      </button>

      <div
        className={cn(
          'overflow-auto border-t border-gray-100',
          expanded ? 'max-h-[min(70vh,520px)]' : collapsedHeight
        )}
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              {preview.headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {preview.rows.map((row, i) => (
              <tr key={i} className="hover:bg-brand-50/30">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                    {cell || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
