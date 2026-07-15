import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Submission } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Plus,
  FileBarChart2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.student.listSubmissions()
      .then((res) => setSubmissions(res.submissions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: submissions.length,
    completed: submissions.filter((s) => ['report_ready', 'approved', 'exported'].includes(s.status)).length,
    inProgress: submissions.filter((s) => ['submitted', 'parsing', 'analyzing'].includes(s.status)).length,
    failed: submissions.filter((s) => s.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your statistical analysis submissions</p>
        </div>
        <Link
          to="/analysis/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Analysis
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileBarChart2} label="Total Submissions" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="green" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="yellow" />
        <StatCard icon={AlertCircle} label="Failed" value={stats.failed} color="red" />
      </div>

      {/* Submissions List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h2>
        {submissions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <FileBarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
            <p className="text-sm text-gray-500 mb-6">Upload your master chart to get started with AI-powered statistical analysis.</p>
            <Link
              to="/analysis/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start Your First Analysis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <Link
                key={sub.id}
                to={`/analysis/${sub.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{sub.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {sub.files.length} file{sub.files.length !== 1 ? 's' : ''} &middot;{' '}
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color as keyof typeof colors]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
