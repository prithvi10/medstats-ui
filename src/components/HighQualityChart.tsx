import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { ChartPoint } from '@/lib/chartData';

/**
 * Categorical palette inspired by Infogram chart color guidance:
 * distinct hues spread across the color wheel (teal, gold, blue, orange, green, coral)
 * @see https://infogram.com/blog/best-colors-for-charts/
 */
const CHART_COLORS = [
  '#17BECF', // teal
  '#FFC20A', // golden yellow
  '#00668E', // deep blue
  '#50C2E5', // sky blue
  '#D46600', // orange
  '#38A86F', // green
  '#C9495E', // coral rose
  '#056875', // dark teal
  '#F3B735', // amber
  '#1F3A93', // navy
  '#9B59B6', // purple
  '#E67E22', // warm orange
];

export interface HighQualityChartHandle {
  toDataURL: () => string | null;
}

export interface HighQualityChartProps {
  variableName: string;
  data: ChartPoint[];
  chartType: 'pie' | 'bar' | 'horizontalBar';
  exportMode?: boolean;
  captureId?: string;
  className?: string;
  onRenderComplete?: () => void;
}

export const HighQualityChart = forwardRef<HighQualityChartHandle, HighQualityChartProps>(
  function HighQualityChart(
    {
      variableName,
      data,
      chartType,
      exportMode = false,
      captureId,
      className,
      onRenderComplete,
    },
    ref
  ) {
    const echartsRef = useRef<ReactECharts>(null);

    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        const inst = echartsRef.current?.getEchartsInstance();
        if (!inst) return null;
        return inst.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
      },
    }));

    const option = useMemo(
      () => buildOption(data, chartType, variableName, exportMode),
      [data, chartType, variableName, exportMode]
    );

    const height = exportMode
      ? chartType === 'horizontalBar'
        ? Math.max(640, data.length * 52 + 120)
        : chartType === 'pie'
          ? 520
          : 720
      : chartType === 'horizontalBar'
        ? Math.max(320, data.length * 38 + 80)
        : chartType === 'pie'
          ? 360
          : 380;

    const width = exportMode ? 900 : '100%';

    return (
      <div
        id={captureId}
        className={className}
        style={{
          width: exportMode ? 900 : '100%',
          background: '#fff',
          padding: exportMode ? 16 : 8,
        }}
      >
        <ReactECharts
          ref={echartsRef}
          option={option}
          style={{ width, height }}
          opts={{ renderer: 'canvas' }}
          notMerge
          onEvents={{
            finished: () => onRenderComplete?.(),
          }}
        />
      </div>
    );
  }
);

function buildOption(
  data: ChartPoint[],
  chartType: 'pie' | 'bar' | 'horizontalBar',
  title: string,
  exportMode: boolean
): EChartsOption {
  const labelSize = exportMode ? 15 : 12;
  const titleSize = exportMode ? 18 : 14;
  const animation = !exportMode;

  if (chartType === 'pie') {
    const pieData = data.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: {
        color: CHART_COLORS[i % CHART_COLORS.length],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    }));

    const useLegend = exportMode || data.length > 4;

    return {
      backgroundColor: '#ffffff',
      animation,
      color: CHART_COLORS,
      title: {
        text: title,
        left: 'center',
        top: 4,
        textStyle: { fontSize: titleSize, fontWeight: 'bold', color: '#111827' },
      },
      tooltip: {
        trigger: 'item',
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}: ${p.value.toFixed(1)} (${p.percent.toFixed(1)}%)`,
        textStyle: { fontSize: labelSize },
      },
      legend: useLegend
        ? {
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            itemWidth: 14,
            itemHeight: 14,
            textStyle: { fontSize: exportMode ? 14 : 12, color: '#374151' },
            formatter: (name: string) => {
              const item = data.find((d) => d.name === name);
              const total = data.reduce((s, d) => s + d.value, 0);
              const pct = item && total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return `${name} (${pct}%)`;
            },
          }
        : { show: false },
      series: [
        {
          name: title,
          type: 'pie',
          radius: exportMode ? '58%' : '52%',
          center: ['50%', useLegend ? '44%' : '52%'],
          avoidLabelOverlap: true,
          padAngle: 1.5,
          itemStyle: {
            borderRadius: 4,
          },
          label: useLegend
            ? { show: false }
            : {
                show: true,
                fontSize: labelSize,
                fontWeight: 600,
                color: '#111827',
                formatter: (p: { name: string; percent: number }) =>
                  `${p.name}\n${p.percent.toFixed(1)}%`,
              },
          labelLine: useLegend
            ? { show: false }
            : {
                length: 16,
                length2: 12,
                lineStyle: { color: '#9ca3af', width: 1 },
              },
          emphasis: {
            scale: !exportMode,
            scaleSize: 6,
          },
          data: pieData,
        },
      ],
    };
  }

  if (chartType === 'horizontalBar') {
    return {
      backgroundColor: '#ffffff',
      animation,
      color: CHART_COLORS,
      title: {
        text: title,
        left: 'center',
        top: 8,
        textStyle: { fontSize: titleSize, fontWeight: 'bold', color: '#111827' },
      },
      grid: { left: exportMode ? 220 : 140, right: exportMode ? 80 : 48, top: 56, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        textStyle: { fontSize: labelSize },
      },
      xAxis: {
        type: 'value',
        axisLabel: { fontSize: labelSize - 1, formatter: (v: number) => `${v}%` },
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLabel: {
          fontSize: labelSize - 1,
          color: '#374151',
          width: exportMode ? 200 : 130,
          overflow: 'truncate',
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: data.map((d, i) => ({
            value: d.value,
            itemStyle: {
              color: CHART_COLORS[i % CHART_COLORS.length],
              borderRadius: [0, 6, 6, 0],
            },
          })),
          barMaxWidth: exportMode ? 36 : 28,
          label: {
            show: true,
            position: 'right',
            fontSize: labelSize - 1,
            fontWeight: 'bold',
            color: '#374151',
            formatter: (p: { value: number }) => `${p.value.toFixed(1)}%`,
          },
        },
      ],
    };
  }

  return {
    backgroundColor: '#ffffff',
    animation,
    color: CHART_COLORS,
    title: {
      text: title,
      left: 'center',
      top: 8,
      textStyle: { fontSize: titleSize, fontWeight: 'bold', color: '#111827' },
    },
    grid: { left: 48, right: 24, top: 56, bottom: exportMode ? 80 : 64 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      textStyle: { fontSize: labelSize },
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: {
        fontSize: labelSize - 1,
        color: '#374151',
        rotate: data.length > 4 ? 25 : 0,
        interval: 0,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: labelSize - 1, formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.value,
          itemStyle: {
            color: CHART_COLORS[i % CHART_COLORS.length],
            borderRadius: [6, 6, 0, 0],
          },
        })),
        barMaxWidth: exportMode ? 64 : 48,
        label: {
          show: true,
          position: 'top',
          fontSize: labelSize - 1,
          fontWeight: 'bold',
          color: '#374151',
          formatter: (p: { value: number }) => `${p.value.toFixed(1)}%`,
        },
      },
    ],
  };
}

export { CHART_COLORS as PALETTE };
