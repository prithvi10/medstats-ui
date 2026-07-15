import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useChartCapture, type ChartImageMap } from '@/lib/captureCharts';
import type { ReportSection } from '@/lib/types';
import { Download, FileText, X, Loader2 } from 'lucide-react';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  reportTitle?: string;
  sections: ReportSection[];
}

export function ExportModal({ open, onClose, submissionId, reportTitle, sections }: ExportModalProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<'docx' | 'pdf' | null>(null);

  const { images, capturing, error: captureError } = useChartCapture(sections, open);

  const loadPreview = useCallback(async (chartImages: ChartImageMap) => {
    setLoading(true);
    setError('');
    try {
      const html = await api.analysis.getExportPreview(submissionId, chartImages);
      setPreviewHtml(html);
    } catch {
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (!open) {
      setPreviewHtml('');
      setError('');
      return;
    }
    if (capturing || !images) return;
    loadPreview(images);
  }, [open, capturing, images, loadPreview]);

  useEffect(() => {
    if (captureError) setError(captureError);
  }, [captureError]);

  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!images) return;
    setDownloading(format);
    setError('');
    try {
      const res = await api.analysis.exportReport(submissionId, format, images);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseTitle = (reportTitle || 'Report').trim();
      const docTitle = baseTitle.toLowerCase().endsWith('- statistical analysis')
        ? baseTitle
        : `${baseTitle} - Statistical analysis`;
      const safeName = docTitle.replace(/[^\w\s-]/g, '').trim().slice(0, 100) || 'Statistical analysis';
      a.download = `${safeName}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  if (!open) return null;

  const busy = capturing || loading || !images;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Export Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Charts are rendered in the browser at high resolution for export
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100 min-h-[400px]">
          {busy && (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">
                {capturing ? 'Rendering charts for export…' : 'Generating preview…'}
              </p>
            </div>
          )}

          {error && !busy && (
            <div className="flex items-center justify-center h-full py-20">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!busy && previewHtml && (
            <iframe
              title="Export preview"
              srcDoc={previewHtml}
              className="w-full h-full min-h-[500px] bg-white border-0"
              sandbox="allow-same-origin"
            />
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            High-resolution chart images are embedded in the exported file
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownload('docx')}
              disabled={!!downloading || busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {downloading === 'docx' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Download DOCX
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={!!downloading || busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {downloading === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
