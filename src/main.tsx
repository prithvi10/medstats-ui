import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleRoute } from '@/components/RoleRoute'
import { Layout } from '@/components/Layout'
import { ProfessorLayout } from '@/components/ProfessorLayout'
import LoginPage from '@/routes/login'
import DashboardPage from '@/routes/dashboard'
import NewAnalysisPage from '@/routes/analysis.new'
import AnalysisDetailPage from '@/routes/analysis.$id'
import AnalysisReviewPage from '@/routes/analysis.$id.review'
import ProfessorDashboardPage from '@/routes/professor.dashboard'
import ProfessorSubmissionReviewPage from '@/routes/professor.submissions.$id'
import AdminIndexPage from '@/routes/admin'
import AdminJobsPage from '@/routes/admin.jobs'
import AdminSubmissionsPage from '@/routes/admin.submissions'
import AdminUsersPage from '@/routes/admin.users'
import AdminSystemPage from '@/routes/admin.system'
import { AdminLayout } from '@/components/AdminLayout'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['student', 'admin']} />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/analysis/new" element={<NewAnalysisPage />} />
                <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
                <Route path="/analysis/:id/review" element={<AnalysisReviewPage />} />
              </Route>
            </Route>
            <Route element={<RoleRoute allowedRoles={['professor']} />}>
              <Route element={<ProfessorLayout />}>
                <Route path="/professor/dashboard" element={<ProfessorDashboardPage />} />
                <Route path="/professor/submissions/:id" element={<ProfessorSubmissionReviewPage />} />
              </Route>
            </Route>
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminIndexPage />} />
                  <Route path="jobs" element={<AdminJobsPage />} />
                  <Route path="submissions" element={<AdminSubmissionsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="system" element={<AdminSystemPage />} />
                </Route>
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
