import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Report, JobStatusResponse, Submission } from '@/lib/types';
import { ReportRenderer } from '@/components/ReportRenderer';
import { ExportModal } from '@/components/ExportModal';
import { ProfessorFeedbackPanel } from '@/components/ProfessorFeedbackPanel';
import type { StudentProfessorReviewResponse } from '@/lib/types';
import { StatusTracker } from '@/components/StatusTracker';
import {
  FlaskConical, Download, ClipboardCheck, ArrowLeft,
  BookOpen, Calendar, Layers, FileBarChart2, Send,
} from 'lucide-react';

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'report' | 'summary' | 'methodology' | 'literature'>('report');
  const [exportOpen, setExportOpen] = useState(false);
  const [professorReview, setProfessorReview] = useState<StudentProfessorReviewResponse | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!id) return;
    try {
      const [rep, sub] = await Promise.all([
        api.student.getReport(id),
        api.student.getSubmission(id).catch(() => null),
      ]);
      setReport(rep);
      if (sub) setSubmission(sub);
      try {
        const pr = await api.student.getProfessorReview(id);
        setProfessorReview(pr);
      } catch {
        setProfessorReview(null);
      }
      setLoading(false);
    } catch {
      try {
        const status = await api.analysis.getJobStatus(id);
        setJobStatus(status);
        if (status.status === 'failed') {
          setError(status.error_log || 'Analysis failed');
          setLoading(false);
        }
      } catch {
        setError('Unable to fetch analysis status');
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!jobStatus || jobStatus.status === 'completed' || jobStatus.status === 'failed') return;
    const interval = setInterval(async () => {
      if (!id) return;
      try {
        const status = await api.analysis.getJobStatus(id);
        setJobStatus(status);
        if (status.status === 'completed') {
          const [rep, sub] = await Promise.all([
            api.student.getReport(id),
            api.student.getSubmission(id).catch(() => null),
          ]);
          setReport(rep);
          if (sub) setSubmission(sub);
          setLoading(false);
          clearInterval(interval);
        } else if (status.status === 'failed') {
          setError(status.error_log || 'Analysis failed');
          setLoading(false);
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobStatus, id]);

  const handleSubmitForReview = async () => {
    if (!id) return;
    setSubmittingReview(true);
    try {
      await api.student.submitForReview(id);
      const sub = await api.student.getSubmission(id);
      setSubmission(sub);
    } catch {}
    finally {
      setSubmittingReview(false);
    }
  };

  const canSubmitForReview = submission && ['report_ready', 'ai_reviewed', 'revision'].includes(submission.status);

  // Loading state
  if (loading && !report) {
    return <LoadingView jobStatus={jobStatus} />;
  }

  // Error state
  if (error && !report) {
    return <ErrorView error={error} onRetry={() => window.location.reload()} />;
  }

  if (!report) return null;

  const sectionCount = report.sections.filter((s) => s.type === 'table_heading').length;
  const chartCount = report.sections.filter((s) => s.type === 'chart').length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
      </Link>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 rounded-2xl p-8 text-white mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium opacity-80">Statistical Analysis Report</span>
            </div>
            <h1 className="text-2xl font-bold">Analysis Report v{report.version}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm opacity-80">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(report.generated_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {sectionCount} variables</span>
              <span className="flex items-center gap-1"><FileBarChart2 className="w-3.5 h-3.5" /> {chartCount} charts</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/analysis/${id}/review`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white font-medium rounded-lg text-sm transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" /> AI Pre-Review
            </Link>
            <button
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white font-medium rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            {canSubmitForReview && (
              <button
                onClick={handleSubmitForReview}
                disabled={submittingReview}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-brand-700 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submittingReview ? 'Submitting...' : 'Submit for Professor Review'}
              </button>
            )}
          </div>
        </div>
      </div>

      {professorReview && <ProfessorFeedbackPanel data={professorReview} />}

      {submission && (
        <div className="mb-6">
          <StatusTracker status={submission.status} />
        </div>
      )}

      {submission?.status === 'under_review' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          Your report is with your professor for review. You will be notified when feedback is available.
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <TabButton active={activeTab === 'report'} onClick={() => setActiveTab('report')}>
          Full Report
        </TabButton>
        <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
          Executive Summary
        </TabButton>
        <TabButton active={activeTab === 'literature'} onClick={() => setActiveTab('literature')}>
          Related Literatures
        </TabButton>
        <TabButton active={activeTab === 'methodology'} onClick={() => setActiveTab('methodology')}>
          Methodology
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm">
          <ReportRenderer sections={report.sections} submissionId={id} />
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {report.summary ? (
            <ExecutiveSummary summary={report.summary} report={report} />
          ) : (
            <EmptyState icon={BookOpen} text="No executive summary available for this report." />
          )}
        </div>
      )}

      {activeTab === 'literature' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <RelatedLiteratures sections={report.sections} />
        </div>
      )}

      {activeTab === 'methodology' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm">
          {report.methodology_note ? (
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-brand-600 rounded-full" />
                Statistical Methodology
              </h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-[14px] text-gray-700 leading-[1.8] font-serif whitespace-pre-line">
                  {report.methodology_note}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState icon={FlaskConical} text="No methodology note available." />
          )}
        </div>
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        submissionId={id!}
        reportTitle={submission?.title}
        sections={report.sections}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

interface StructuredSummary {
  study_description: string;
  methodology: string;
  key_findings: Array<{
    variable: string;
    result: string;
    p_value: number | null;
    significant: boolean;
  }>;
  stats: {
    total_variables: number;
    significant: number;
    not_significant: number;
  };
}

function ExecutiveSummary({ summary, report }: { summary: string; report: Report }) {
  let structured: StructuredSummary | null = null;
  try {
    structured = JSON.parse(summary);
  } catch {
    // Legacy plain-text summary fallback
  }

  const variablesCount = report.sections.filter(s => s.type === 'table_heading').length;
  const generatedDate = new Date(report.generated_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (!structured) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Executive Summary</h2>
        <p className="text-[15px] text-gray-700 leading-[1.85] font-serif whitespace-pre-line">{summary}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {/* Title — matching Full Report heading style */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-1 h-6 bg-brand-600 rounded-full" />
          Executive Summary
        </h2>
        <div className="mt-2 h-px bg-gradient-to-r from-brand-200 via-gray-200 to-transparent" />
        <div className="flex items-center gap-6 mt-3 text-[13px] text-gray-500">
          <span>{variablesCount} variables analyzed</span>
          <span>{structured.stats.significant} statistically significant</span>
          <span>{generatedDate}</span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Study Description */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-0.5 h-4 bg-brand-400 rounded-full" />
            Study Description
          </h3>
          <p className="text-[15px] text-gray-800 leading-[1.9] font-serif">
            {structured.study_description}
          </p>
          {structured.methodology && (
            <p className="text-[13px] text-gray-500 leading-[1.8] mt-3 italic">
              {structured.methodology.split('.').slice(0, 2).join('.') + '.'}
            </p>
          )}
        </section>

        {/* Key Findings */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-0.5 h-4 bg-brand-400 rounded-full" />
            Key Findings
          </h3>
          <div className="space-y-2.5">
            {structured.key_findings.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${f.significant ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div className="text-[14px]">
                  <span className="font-medium text-gray-900">{f.variable}</span>
                  <span className="text-gray-600 ml-1.5">— {f.result}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function RelatedLiteratures({ sections }: { sections: Report['sections'] }) {
  const NOTE_PREFIX = 'The following published studies are comparable to this analysis';

  // All literature lives in one literature_context section as a newline-separated
  // text blob: "Note\n1. Entry\n2. Entry\n3. Entry"
  const entries: string[] = [];
  for (const s of sections) {
    if (s.type !== 'literature_context' || !s.content) continue;
    const lines = s.content.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Skip the introductory note line
      if (line.startsWith(NOTE_PREFIX)) continue;
      // Only keep lines that start with a numbered list marker: "1. ", "2. ", etc.
      if (/^\d+\.\s/.test(line)) entries.push(line);
    }
  }

  if (entries.length === 0) {
    return <EmptyState icon={BookOpen} text="No related literature found for this analysis." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-1 h-6 bg-brand-600 rounded-full" />
          Related Literatures
        </h2>
        <div className="mt-2 h-px bg-gradient-to-r from-brand-200 via-gray-200 to-transparent" />
      </div>

      <div className="space-y-4">
        {entries.map((entry, i) => {
          // Strip leading "1. " numbering
          const text = entry.replace(/^\d+\.\s*/, '');
          // Split off PMID / Relevance metadata at the end
          const metaMatch = text.match(/^(.*?)(PMID:\s*\d+.*?)$/s);
          const body = metaMatch ? metaMatch[1].trim().replace(/\.$/, '') : text.replace(/\.$/, '');
          const meta = metaMatch ? metaMatch[2].trim() : '';

          return (
            <div
              key={i}
              className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-700">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-gray-800 leading-[1.8] font-serif">{body}</p>
                {meta && (
                  <p className="mt-1.5 text-[11px] text-gray-400 font-mono">{meta}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function LoadingView({ jobStatus }: { jobStatus: JobStatusResponse | null }) {
  const steps = [
    { label: 'Parsing documents', threshold: 20 },
    { label: 'Selecting statistical tests', threshold: 40 },
    { label: 'Running analysis', threshold: 60 },
    { label: 'Generating report', threshold: 80 },
    { label: 'Quality review', threshold: 95 },
  ];

  const progress = jobStatus?.progress || 0;

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div
          className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"
          style={{ animationDuration: '1.5s' }}
        />
        <FlaskConical className="w-8 h-8 text-brand-600" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {jobStatus ? 'Analysis in Progress' : 'Loading Report...'}
      </h2>

      {jobStatus && (
        <>
          <p className="text-sm text-gray-500 mb-6">{jobStatus.current_step}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-gradient-to-r from-brand-500 to-brand-600 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-2">
            {steps.map((step, i) => {
              const done = progress >= step.threshold;
              const active = !done && (i === 0 || progress >= steps[i - 1].threshold);
              return (
                <div key={i} className="flex items-center gap-3 text-left">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done ? 'bg-green-100' : active ? 'bg-brand-100' : 'bg-gray-100'
                  }`}>
                    {done ? (
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : active ? (
                      <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  <span className={`text-sm ${done ? 'text-green-700 font-medium' : active ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
        <FlaskConical className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
      <p className="text-sm text-red-600 mb-6 bg-red-50 rounded-lg p-3 border border-red-200">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors"
      >
        Reload Page
      </button>
    </div>
  );
}
