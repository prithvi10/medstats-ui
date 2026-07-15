import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, PieChart as PieIcon, Maximize2, Minimize2 } from 'lucide-react';
import { HighQualityChart } from './HighQualityChart';
import type { ChartPoint } from '@/lib/chartData';

interface ChartRendererProps {
  chartPath?: string;
  variable?: string;
  data?: ChartPoint[];
  chartType?: 'pie' | 'bar' | 'horizontalBar';
}

export function ChartRenderer({ variable, data, chartType = 'bar' }: ChartRendererProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>(chartType === 'pie' ? 'pie' : 'bar');
  const [expanded, setExpanded] = useState(false);

  if (!data || data.length === 0) return null;

  const effectiveType = viewMode === 'pie' ? 'pie' : chartType === 'horizontalBar' ? 'horizontalBar' : 'bar';
  const canTogglePie = data.length <= 6;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white overflow-hidden transition-all',
        expanded && 'fixed inset-4 z-50 shadow-2xl'
      )}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {variable || 'Distribution'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('bar')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'bar' ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-gray-600'
            )}
            title="Bar chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          {canTogglePie && (
            <button
              onClick={() => setViewMode('pie')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'pie' ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-gray-600'
              )}
              title="Pie chart"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600"
            title={expanded ? 'Minimize' : 'Expand'}
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={cn('px-2 py-3', expanded && 'h-[calc(100%-44px)] overflow-auto')}>
        <HighQualityChart
          variableName={variable || 'Distribution'}
          data={data}
          chartType={effectiveType}
          exportMode={expanded}
        />
      </div>

      {expanded && (
        <div className="fixed inset-0 bg-black/30 -z-10" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}

/** Derive chart data for a variable block from its table section. */
export function deriveChartDataFromRows(rows?: string[][]): ChartPoint[] {
  if (!rows) return [];
  return rows
    .filter((r) => {
      const label = (r[0] || '').toUpperCase();
      return label !== 'TOTAL' && !label.includes('MEAN');
    })
    .map((r) => ({
      name: r[0] || '',
      value: parseFloat((r[2]?.replace('%', '') || r[1] || '0').replace(/,/g, '')),
    }))
    .filter((d) => !Number.isNaN(d.value) && d.value > 0);
}

const RANGE_PATTERN = /^\d+\s*[-–]\s*\d+|^[<>≤≥]|\d+\+|weeks?|days?|mins?|years?/i;

export function inferChartTypeFromData(data: ChartPoint[]): 'pie' | 'bar' | 'horizontalBar' {
  const n = data.length;
  if (n <= 5 && !data.some((d) => RANGE_PATTERN.test(d.name))) return 'pie';
  if (n > 5 || data.some((d) => d.name.length > 14)) return 'horizontalBar';
  return 'bar';
}
