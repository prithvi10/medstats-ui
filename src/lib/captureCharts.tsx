import { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HighQualityChart, type HighQualityChartHandle } from '@/components/HighQualityChart';
import { buildChartSpecsFromSections, variableKey, type VariableChartSpec } from '@/lib/chartData';
import type { ReportSection } from '@/lib/types';

export type ChartImageMap = Record<string, string>;

const RENDER_TIMEOUT_MS = 3000;

function waitForChartImage(chartRef: React.RefObject<HighQualityChartHandle | null>): Promise<string | null> {
  return new Promise((resolve) => {
    const deadline = Date.now() + RENDER_TIMEOUT_MS;

    const tryCapture = () => {
      const url = chartRef.current?.toDataURL();
      if (url) {
        resolve(url);
        return;
      }
      if (Date.now() > deadline) {
        resolve(null);
        return;
      }
      requestAnimationFrame(tryCapture);
    };

    requestAnimationFrame(tryCapture);
  });
}

/** Render charts off-screen and capture each as a high-res PNG via ECharts canvas export. */
export async function captureChartsFromSections(sections: ReportSection[]): Promise<ChartImageMap> {
  const specs = buildChartSpecsFromSections(sections);
  if (specs.length === 0) return {};

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.visibility = 'hidden';
  container.style.background = '#fff';
  document.body.appendChild(container);

  try {
    const images: ChartImageMap = {};

    for (const spec of specs) {
      const mount = document.createElement('div');
      container.appendChild(mount);
      const root = createRoot(mount);
      const chartRef = createRef<HighQualityChartHandle>();

      let renderDone = false;
      await new Promise<void>((resolve) => {
        root.render(
          <HighQualityChart
            ref={chartRef}
            variableName={spec.variableName}
            data={spec.data}
            chartType={spec.chartType}
            exportMode
            onRenderComplete={() => {
              if (!renderDone) {
                renderDone = true;
                resolve();
              }
            }}
          />
        );
        setTimeout(() => {
          if (!renderDone) {
            renderDone = true;
            resolve();
          }
        }, RENDER_TIMEOUT_MS);
      });

      const dataUri = await waitForChartImage(chartRef);
      if (dataUri) {
        images[spec.variableKey] = dataUri;
        images[variableKey(spec.variableName)] = dataUri;
      }

      root.unmount();
      container.removeChild(mount);
    }

    return images;
  } finally {
    document.body.removeChild(container);
  }
}

interface ChartCaptureProgressProps {
  sections: ReportSection[];
  onComplete: (images: ChartImageMap) => void;
  onError: (message: string) => void;
}

/** Invisible helper that captures charts when mounted (used inside ExportModal). */
export function ChartCaptureRunner({ sections, onComplete, onError }: ChartCaptureProgressProps) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    captureChartsFromSections(sections)
      .then(onComplete)
      .catch(() => onError('Failed to render charts for export'));
  }, [sections, onComplete, onError]);

  return null;
}

export function useChartCapture(sections: ReportSection[], enabled: boolean) {
  const [images, setImages] = useState<ChartImageMap | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');
  const sectionsKey = useMemo(
    () => sections.map((s) => `${s.type}:${s.variable_name || ''}:${s.content?.slice(0, 40) || ''}`).join('|'),
    [sections]
  );
  const lastKey = useRef('');

  useEffect(() => {
    if (!enabled) {
      setImages(null);
      setCapturing(false);
      setError('');
      lastKey.current = '';
      return;
    }

    if (sections.length === 0 || lastKey.current === sectionsKey) return;

    lastKey.current = sectionsKey;
    setCapturing(true);
    setError('');
    setImages(null);

    captureChartsFromSections(sections)
      .then((result) => {
        setImages(result);
        setCapturing(false);
      })
      .catch(() => {
        setError('Failed to prepare chart images');
        setCapturing(false);
        lastKey.current = '';
      });
  }, [enabled, sections, sectionsKey]);

  return { images, capturing, error };
}

export type { VariableChartSpec };
