import type {
  TokenResponse, SubmissionListResponse, Submission, Report, JobStatusResponse, ReviewResponse,
  ProfessorSubmissionItem, ProfessorReviewContext, StructuredReviewPayload,
  ProfessorReviewSubmitResponse, ProfessorOption, StudentProfessorReviewResponse,
  NotificationListResponse,
  RAGExplainResponse,
  AdminDashboard, AdminJobsResponse, AdminJob, AdminSubmissionsResponse,
  AdminUser, AdminSystemHealth, AdminRagStats, SubmissionStatus, UserRole,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('medstats_token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('medstats_token');
    localStorage.removeItem('medstats_user');
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Request failed' }));
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join('; ')
      : typeof detail === 'string'
        ? detail
        : `Error ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return res.json();
}

export const api = {
  auth: {
    login(email: string, password: string) {
      return fetchAPI<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    register(data: { email: string; password: string; name: string; role?: string; institution?: string }) {
      return fetchAPI<TokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...data, role: data.role || 'student' }),
      });
    },
    me() {
      return fetchAPI<{ id: string; email: string; name: string; role: string }>('/auth/me');
    },
  },

  student: {
    listSubmissions() {
      return fetchAPI<SubmissionListResponse>('/student/submissions');
    },
    getSubmission(id: string) {
      return fetchAPI<Submission>(`/student/submissions/${id}`);
    },
    createSubmission(title: string, intentDescription: string, files: File[], professorId?: string) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('intent_description', intentDescription);
      if (professorId) formData.append('professor_id', professorId);
      files.forEach((f) => formData.append('files', f));
      return fetchAPI<Submission>('/student/submissions', {
        method: 'POST',
        body: formData,
      });
    },
    listProfessors() {
      return fetchAPI<{ professors: ProfessorOption[] }>('/student/professors');
    },
    submitForReview(submissionId: string) {
      return fetchAPI<{ message: string; status: string; professor_id?: string }>(
        `/student/submissions/${submissionId}/submit-review`,
        { method: 'POST' }
      );
    },
    getProfessorReview(submissionId: string) {
      return fetchAPI<StudentProfessorReviewResponse>(
        `/student/submissions/${submissionId}/professor-review`
      );
    },
    getReport(submissionId: string) {
      return fetchAPI<Report>(`/student/submissions/${submissionId}/report`);
    },
  },

  analysis: {
    run(submissionId: string) {
      return fetchAPI<{ job_id: string; status: string; message: string }>(
        `/analysis/submissions/${submissionId}/run`,
        { method: 'POST' }
      );
    },
    getJobStatus(submissionId: string) {
      return fetchAPI<JobStatusResponse>(`/analysis/submissions/${submissionId}/job`);
    },
    rerun(submissionId: string) {
      return fetchAPI<{ job_id: string; status: string; message: string }>(
        `/analysis/submissions/${submissionId}/rerun`,
        { method: 'POST' }
      );
    },
    correct(submissionId: string, feedback: string, targetVariables: string[] = []) {
      return fetchAPI<{ job_id: string; status: string }>(
        `/analysis/submissions/${submissionId}/correct`,
        {
          method: 'POST',
          body: JSON.stringify({ feedback, feedback_type: 'general_feedback', target_variables: targetVariables }),
        }
      );
    },
    triggerReview(submissionId: string) {
      return fetchAPI<{ job_id: string; status: string }>(
        `/analysis/submissions/${submissionId}/review`,
        { method: 'POST', body: JSON.stringify({ review_type: 'full' }) }
      );
    },
    getReview(submissionId: string) {
      return fetchAPI<ReviewResponse>(`/analysis/submissions/${submissionId}/review`);
    },
    getExportPreview(submissionId: string, chartImages: Record<string, string> = {}) {
      const token = localStorage.getItem('medstats_token');
      return fetch(`${API_BASE}/analysis/submissions/${submissionId}/export/preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chart_images: chartImages }),
      }).then(async (res) => {
        if (!res.ok) throw new ApiError(res.status, 'Preview failed');
        return res.text();
      });
    },
    exportReport(submissionId: string, format: 'docx' | 'pdf', chartImages: Record<string, string> = {}) {
      const token = localStorage.getItem('medstats_token');
      return fetch(`${API_BASE}/analysis/submissions/${submissionId}/export/${format}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chart_images: chartImages }),
      });
    },
  },

  professor: {
    listSubmissions() {
      return fetchAPI<{ submissions: ProfessorSubmissionItem[]; total: number }>(
        '/professor/submissions'
      );
    },
    getReviewContext(submissionId: string) {
      return fetchAPI<ProfessorReviewContext>(`/professor/submissions/${submissionId}`);
    },
    submitReview(submissionId: string, payload: StructuredReviewPayload) {
      return fetchAPI<ProfessorReviewSubmitResponse>(
        `/professor/submissions/${submissionId}/review`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
    },
    getRevisionJobStatus(submissionId: string, jobId: string) {
      return fetchAPI<JobStatusResponse>(
        `/professor/submissions/${submissionId}/jobs/${jobId}`
      );
    },
  },

  rag: {
    explain(data: { query: string; submission_id: string; tags?: string[] }) {
      return fetchAPI<RAGExplainResponse>('/rag/explain', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  notifications: {
    list() {
      return fetchAPI<NotificationListResponse>('/notifications');
    },
    unreadCount() {
      return fetchAPI<{ count: number }>('/notifications/unread-count');
    },
    markRead(id: string) {
      return fetchAPI<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' });
    },
    markAllRead() {
      return fetchAPI<{ message: string }>('/notifications/read-all', { method: 'PATCH' });
    },
  },

  admin: {
    dashboard() {
      return fetchAPI<AdminDashboard>('/admin/dashboard');
    },
    listJobs(params: { status?: string; page?: number; per_page?: number } = {}) {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.page) q.set('page', String(params.page));
      if (params.per_page) q.set('per_page', String(params.per_page));
      const qs = q.toString();
      return fetchAPI<AdminJobsResponse>(`/admin/jobs${qs ? `?${qs}` : ''}`);
    },
    getJob(id: string) {
      return fetchAPI<AdminJob>(`/admin/jobs/${id}`);
    },
    retryJob(id: string) {
      return fetchAPI<{ message: string; job_id: string }>(`/admin/jobs/${id}/retry`, { method: 'POST' });
    },
    cancelJob(id: string) {
      return fetchAPI<{ message: string; job_id: string }>(`/admin/jobs/${id}/cancel`, { method: 'POST' });
    },
    listSubmissions(params: { status?: string; search?: string; page?: number; per_page?: number } = {}) {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.search) q.set('search', params.search);
      if (params.page) q.set('page', String(params.page));
      if (params.per_page) q.set('per_page', String(params.per_page));
      const qs = q.toString();
      return fetchAPI<AdminSubmissionsResponse>(`/admin/submissions${qs ? `?${qs}` : ''}`);
    },
    updateSubmissionStatus(id: string, status: SubmissionStatus) {
      return fetchAPI<{ id: string; status: string }>(`/admin/submissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    listUsers() {
      return fetchAPI<{ users: AdminUser[] }>('/admin/users');
    },
    getUser(id: string) {
      return fetchAPI<AdminUser>(`/admin/users/${id}`);
    },
    createUser(data: { email: string; password: string; name: string; role: UserRole; institution?: string; department?: string }) {
      return fetchAPI<{ id: string; email: string; role: string }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateUser(id: string, data: Partial<{ is_active: boolean; role: UserRole; name: string; institution: string; department: string }>) {
      return fetchAPI<{ id: string; is_active: boolean; role: string }>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    systemHealth() {
      return fetchAPI<AdminSystemHealth>('/admin/system/health');
    },
    ragStats() {
      return fetchAPI<AdminRagStats>('/admin/rag/stats');
    },
    triggerRagIngest() {
      return fetchAPI<{ message: string }>('/admin/rag/ingest', { method: 'POST' });
    },
  },
};
