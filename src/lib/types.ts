export type UserRole = 'student' | 'professor' | 'admin';

export type SubmissionStatus =
  | 'submitted'
  | 'parsing'
  | 'analyzing'
  | 'report_ready'
  | 'ai_reviewed'
  | 'under_review'
  | 'review_in_progress'
  | 'review_completed'
  | 'revision'
  | 'approved'
  | 'exported'
  | 'failed';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type ReviewVerdict =
  | 'approve_recommended'
  | 'minor_issues'
  | 'needs_attention'
  | 'significant_issues';

export type Severity = 'ok' | 'info' | 'warning' | 'error';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institution?: string;
  department?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SubmissionFile {
  id: string;
  name: string;
  type: string;
}

export interface Submission {
  id: string;
  title: string;
  status: SubmissionStatus;
  intent_description?: string;
  professor_id?: string;
  created_at: string;
  updated_at: string;
  files: SubmissionFile[];
}

export interface SubmissionListResponse {
  submissions: Submission[];
  total: number;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  current_step: string;
  error_log?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ReportSection {
  type: 'heading' | 'paragraph' | 'summary_text' | 'table_heading' | 'table' | 'test_result' | 'chart' | 'descriptive_note' | 'literature_context';
  content?: string;
  variable_name?: string;
  headers?: string[];
  rows?: string[][];
  chart_path?: string;
  chart_data?: { name: string; value: number }[];
  chart_type?: 'pie' | 'bar';
  table_format?: 'frequency' | 'binary' | 'range_distribution' | 'comprehensive' | 'stats_summary';
}

export interface ChartData {
  variable: string;
  path: string;
  table_number: number;
}

export interface Report {
  id: string;
  version: number;
  sections: ReportSection[];
  charts: ChartData[];
  summary: string;
  methodology_note: string;
  pdf_url?: string;
  docx_url?: string;
  generated_at: string;
}

export interface ReviewItem {
  check_id: string;
  tier: number;
  severity: Severity;
  category: string;
  message: string;
  variable?: string;
  suggestion?: string;
  citation?: string;
}

export interface RAGExplainResponse {
  passages: string[];
  citations: { source: string; page?: number; section?: string }[];
}

export interface ReviewSummary {
  total_checks: number;
  passed: number;
  info_count: number;
  warnings: number;
  errors: number;
  items: ReviewItem[];
  estimated_review_minutes: number;
  overall_verdict: ReviewVerdict;
}

export interface ReviewResponse {
  submission_id: string;
  review_summary: ReviewSummary;
  review_verdict: string;
}

export type ProfessorReviewDecision = 'approved' | 'needs_revision' | 'rejected';

export interface ProfessorOption {
  id: string;
  name: string;
  email: string;
  department?: string;
  institution?: string;
}

export interface VariableProfile {
  name: string;
  dtype?: string;
  groups?: string[];
  current_test?: string;
  normality_ok?: boolean | null;
  missing_pct?: number;
  distribution_note?: string;
  valid_test_alternatives?: { value: string; label: string }[];
}

export interface ReviewPreset {
  code: string;
  label: string;
  hint: string;
}

export interface DataProfile {
  study_design: string;
  study_design_label: string;
  sample_size: number;
  variable_count: number;
  variables: VariableProfile[];
  summary: string;
  test_options: { value: string; label: string }[];
  presets: {
    methodology: ReviewPreset[];
    executive_summary: ReviewPreset[];
    variable: ReviewPreset[];
  };
}

export interface MasterChartPreview {
  file_id: string | null;
  file_name: string;
  file_type: string;
  row_count: number;
  column_count: number;
  headers: string[];
  rows: string[][];
  truncated: boolean;
}

export interface ProfessorSubmissionItem {
  id: string;
  title: string;
  status: SubmissionStatus;
  student_name: string;
  student_email: string;
  review_round: number;
  created_at: string;
  updated_at: string;
}

export interface ProfessorReviewRecord {
  id: string;
  report_version: number;
  decision: ProfessorReviewDecision;
  feedback?: string;
  section_comments?: {
    test_overrides?: { variable: string; new_test: string }[];
    section_feedback?: { target: string; preset_codes: string[] }[];
    structured?: boolean;
  };
  professor_name: string;
  reviewed_at: string;
}

export interface ProfessorReviewContext {
  submission: {
    id: string;
    title: string;
    status: SubmissionStatus;
    intent_description?: string;
    created_at: string;
    updated_at: string;
    files: SubmissionFile[];
  };
  student: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  data_profile: DataProfile | null;
  master_chart_preview: MasterChartPreview | null;
  tests_selected: { variable: string; test: string; label: string }[];
  report: Report | null;
  ai_review: { review_summary: ReviewSummary; review_verdict: string } | null;
  review_history: ProfessorReviewRecord[];
  review_round: number;
}

export interface StructuredReviewPayload {
  decision: ProfessorReviewDecision;
  test_overrides: { variable: string; new_test: string }[];
  section_feedback: { target: string; preset_codes: string[] }[];
  final_comment?: string;
}

export interface ProfessorReviewSubmitResponse {
  message: string;
  decision: ProfessorReviewDecision;
  review_id: string;
  revision_job_id?: string;
  revision_queued: boolean;
}

export interface StudentProfessorReviewResponse {
  submission_id: string;
  status: SubmissionStatus;
  review_round: number;
  latest_review: ProfessorReviewRecord;
  review_history: ProfessorReviewRecord[];
}

export type NotificationType =
  | 'review_requested'
  | 'review_started'
  | 'review_completed'
  | 'approved';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  submission_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export interface AdminDashboard {
  total_users: number;
  total_submissions: number;
  total_jobs: number;
  students_count: number;
  professors_count: number;
  jobs_running: number;
  jobs_failed: number;
}

export interface AdminJob {
  id: string;
  submission_id: string;
  submission_title?: string;
  student_name?: string;
  student_email?: string;
  status: JobStatus;
  progress: number;
  current_step?: string;
  error_log?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  agent_state?: unknown;
  test_results?: unknown;
  charts_metadata?: unknown;
  corrections?: Array<{
    id: string;
    review_id: string;
    changes_made?: unknown;
    corrected_at?: string;
  }>;
}

export interface AdminJobsResponse {
  jobs: AdminJob[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminSubmission {
  id: string;
  title: string;
  status: SubmissionStatus;
  student_name: string;
  student_email: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSubmissionsResponse {
  submissions: AdminSubmission[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institution?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  submission_count?: number;
}

export interface AdminSystemHealth {
  db_ok: boolean;
  redis_ok: boolean;
  queue_depth: number;
  counts: {
    users: number;
    submissions: number;
    jobs_running: number;
    jobs_failed: number;
  };
}

export interface AdminRagStats {
  doc_count: number;
  literature_count: number;
  knowledge_nodes: number;
  embedding_coverage_pct: number;
}
