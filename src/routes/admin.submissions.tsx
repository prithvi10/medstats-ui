import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AdminSubmission, SubmissionStatus } from '@/lib/types';

const STATUSES: SubmissionStatus[] = [
  'submitted', 'parsing', 'analyzing', 'report_ready', 'ai_reviewed',
  'under_review', 'review_in_progress', 'review_completed', 'revision', 'approved', 'exported', 'failed',
];

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.listSubmissions({ search: search || undefined, per_page: 50 });
      setSubmissions(res.submissions);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    await api.admin.updateSubmissionStatus(id, status);
    load();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, student name or email..."
          className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg"
        />
      </div>
      {loading ? (
        <p className="p-6 text-sm text-gray-500">Loading submissions...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                  <td className="px-4 py-3 text-gray-600">{s.student_name}<br /><span className="text-xs text-gray-400">{s.student_email}</span></td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      onChange={(e) => updateStatus(s.id, e.target.value as SubmissionStatus)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                    >
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
