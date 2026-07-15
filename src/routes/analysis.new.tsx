import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ProfessorOption } from '@/lib/types';
import { FileUploader } from '@/components/FileUploader';
import { ArrowLeft, ArrowRight, Rocket, FileBarChart2 } from 'lucide-react';

export default function NewAnalysisPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [intent, setIntent] = useState('');
  const [professorId, setProfessorId] = useState('');
  const [professors, setProfessors] = useState<ProfessorOption[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.student.listProfessors()
      .then((res) => setProfessors(res.professors))
      .catch(() => {});
  }, []);

  const canProceedStep1 = title.trim().length > 0;
  const canProceedStep2 = files.length > 0;

  const handleLaunch = async () => {
    setLoading(true);
    setError('');
    try {
      const submission = await api.student.createSubmission(title, intent, files, professorId || undefined);
      await api.analysis.run(submission.id);
      navigate(`/analysis/${submission.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to launch analysis');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Statistical Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Upload your master chart and describe the analysis intent</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            <span className={`text-xs font-medium ${s <= step ? 'text-brand-700' : 'text-gray-400'}`}>
              {s === 1 ? 'Details' : s === 2 ? 'Upload' : 'Launch'}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-brand-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: Title + Intent */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Study Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="e.g., Outcome of TENS for Paediatric Long Bone Fractures"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Analysis Intent</label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              placeholder="Describe what you want analyzed, e.g., correlation between age and recovery time, distribution of fracture types, significance of treatment outcomes..."
            />
            <p className="text-xs text-gray-400 mt-1.5">Optional — helps the AI select appropriate statistical tests</p>
          </div>
          {professors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supervising Professor</label>
              <select
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              >
                <option value="">Auto-assign from enrollment</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.department ? ` — ${p.department}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">Optional — professor who will review your report</p>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: File Upload */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Master Chart & Supporting Documents</h3>
            <FileUploader files={files} onFilesChange={setFiles} />
          </div>
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium rounded-lg text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Launch */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 className="text-sm font-medium text-gray-700">Review & Launch</h3>

          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Title</p>
              <p className="text-sm text-gray-900 mt-0.5">{title}</p>
            </div>
            {intent && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Intent</p>
                <p className="text-sm text-gray-900 mt-0.5">{intent}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Files ({files.length})</p>
              <ul className="mt-1 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <FileBarChart2 className="w-3.5 h-3.5 text-brand-500" />
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong> The AI will parse your data, select appropriate
              statistical tests, run the analysis, generate a full report with charts, and perform
              an automated quality review.
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium rounded-lg text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Launch Analysis
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
