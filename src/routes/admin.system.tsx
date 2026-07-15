import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AdminRagStats, AdminSystemHealth } from '@/lib/types';
import { Database, HardDrive, Layers, BookOpen, RefreshCw } from 'lucide-react';

function StatusTile({ ok, label, icon: Icon }: { ok: boolean; label: string; icon: typeof Database }) {
  return (
    <div className={`rounded-xl border p-4 ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${ok ? 'text-emerald-600' : 'text-red-600'}`} />
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      <p className={`text-xs font-medium ${ok ? 'text-emerald-700' : 'text-red-700'}`}>{ok ? 'Healthy' : 'Unavailable'}</p>
    </div>
  );
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [rag, setRag] = useState<AdminRagStats | null>(null);
  const [ingesting, setIngesting] = useState(false);

  const load = useCallback(async () => {
    const [h, r] = await Promise.all([
      api.admin.systemHealth(),
      api.admin.ragStats(),
    ]);
    setHealth(h);
    setRag(r);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const triggerIngest = async () => {
    setIngesting(true);
    try {
      await api.admin.triggerRagIngest();
    } finally {
      setIngesting(false);
      setTimeout(load, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {health && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatusTile ok={health.db_ok} label="Database" icon={Database} />
            <StatusTile ok={health.redis_ok} label="Redis" icon={HardDrive} />
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-semibold text-gray-900">Queue Depth</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{health.queue_depth >= 0 ? health.queue_depth : '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Users', value: health.counts.users },
              { label: 'Submissions', value: health.counts.submissions },
              { label: 'Running Jobs', value: health.counts.jobs_running },
              { label: 'Failed Jobs', value: health.counts.jobs_failed },
            ].map((c) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {rag && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">RAG Corpus</h2>
            </div>
            <button
              onClick={triggerIngest}
              disabled={ingesting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {ingesting ? 'Starting...' : 'Ingest PubMed'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-500">Documents</p><p className="text-xl font-bold">{rag.doc_count}</p></div>
            <div><p className="text-xs text-gray-500">Literature</p><p className="text-xl font-bold">{rag.literature_count}</p></div>
            <div><p className="text-xs text-gray-500">Knowledge Nodes</p><p className="text-xl font-bold">{rag.knowledge_nodes}</p></div>
            <div><p className="text-xs text-gray-500">Embedding Coverage</p><p className="text-xl font-bold">{rag.embedding_coverage_pct}%</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
