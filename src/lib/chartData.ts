import type { ReportSection } from './types';

export interface ChartPoint {
  name: string;
  value: number;
}

export interface VariableChartSpec {
  variableKey: string;
  variableName: string;
  chartType: 'pie' | 'bar' | 'horizontalBar';
  data: ChartPoint[];
}

const RANGE_PATTERN = /^\d+\s*[-–]\s*\d+|^[<>≤≥]|\d+\+|weeks?|days?|mins?|years?/i;

function cleanVariableName(name: string): string {
  return name.replace(/^Table No\.\d+:\s*/i, '').trim();
}

function rowsToChartData(rows?: string[][]): ChartPoint[] {
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

function inferChartType(data: ChartPoint[]): 'pie' | 'bar' | 'horizontalBar' {
  const n = data.length;
  if (n <= 5 && !data.some((d) => RANGE_PATTERN.test(d.name))) return 'pie';
  if (n > 5 || data.some((d) => d.name.length > 14)) return 'horizontalBar';
  return 'bar';
}

/** Build chart specs from report sections (one per variable block). */
export function buildChartSpecsFromSections(sections: ReportSection[]): VariableChartSpec[] {
  const specs: VariableChartSpec[] = [];
  let currentName = '';

  for (const section of sections) {
    if (section.type === 'table_heading') {
      currentName = cleanVariableName(section.content || section.variable_name || '');
    }

    if (section.type === 'table' && currentName) {
      const data = rowsToChartData(section.rows);
      if (data.length > 0) {
        const key = (section.variable_name || currentName).toLowerCase().replace(/\s+/g, '_');
        specs.push({
          variableKey: key,
          variableName: currentName || section.variable_name || key,
          chartType: inferChartType(data),
          data,
        });
      }
    }
  }

  return specs;
}

export function variableKey(name: string): string {
  return name.toLowerCase().replace(/[^\w]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}
