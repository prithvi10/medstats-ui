import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AdminJob, JobStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RefreshCw, RotateCcw, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_TABS: Array<{ label: string; value?: JobStatus }> = [
  { label: 'All' },
  { label: 'Running', value: 'running' },
  { label: 'Failed', value: 'failed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Queued', value: 'queued' },
];

function statusColor(status: JobStatus) {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-700';
    case 'running': return 'bg-blue-100 text-blue-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'queued': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminJob | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.admin.listJobs({ status: statusFilter, per_page: 50 });
      setJobs(res.jobs);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  const openDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    const d = await api.admin.getJob(id);
    setDetail(d);
  };

  const handleRetry = async (id: string) => {
    await api.admin.retryJob(id);
    load();
  };

  const handleCancel = async (id: string) => {
    await api.admin.cancelJob(id);
    load();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium',
                statusFilter === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh (10s)
          <button onClick={load} className="p-1 rounded hover:bg-gray-200"><RefreshCw className="w-3.5 h-3.5" /></button>
        </label>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="p-6 text-sm text-gray-500">No jobs found.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {jobs.map((job) => (
            <div key={job.id}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 px-4 py-3 items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full uppercase', statusColor(job.status))}>
                      {job.status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{job.id.slice(0, 8)}...</span>
                    <span className="text-xs text-gray-500">{job.progress}% · {job.current_step || '—'}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{job.submission_title || 'Untitled'}</p>
                  <p className="text-xs text-gray-500">{job.student_name} · {job.student_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'failed' && (
                    <button onClick={() => handleRetry(job.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100">
                      <RotateCcw className="w-3.5 h-3.5" /> Retry
                    </button>
                  )}
                  {job.status === 'running' && (
                    <button onClick={() => handleCancel(job.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100">
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                  <button onClick={() => openDetail(job.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Details {expandedId === job.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {expandedId === job.id && detail && (
                <div className="px-4 pb-4">
                  {detail.error_log && (
                    <pre className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 mb-3 overflow-x-auto whitespace-pre-wrap">{detail.error_log}</pre>
                  )}
                  <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-64">
                    {JSON.stringify(detail.agent_state, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
