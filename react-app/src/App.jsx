import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { DashboardSidebar } from './components/Sidebar'

// Pages
import Home            from './pages/Home'
import Login           from './pages/Login'
import Register        from './pages/Register'
import PublishedIssues from './pages/PublishedIssues'

import StudentDashboard     from './pages/student/StudentDashboard'
import UploadJournal        from './pages/student/UploadJournal'
import { StudentJournals, StudentJournalDetail } from './pages/student/Journals'
import StudentGuidelines    from './pages/student/Guidelines'

import ReviewerDashboard    from './pages/reviewer/ReviewerDashboard'
import { AssignedJournals, ReviewJournal } from './pages/reviewer/AssignedJournals'

import AdminDashboard       from './pages/admin/AdminDashboard'
import AdminJournals        from './pages/admin/AdminJournals'
import AdminUsers           from './pages/admin/AdminUsers'
import AdminReports, { ReviewReportDetail } from './pages/admin/AdminReports'
import AssignReviewers      from './pages/admin/AssignReviewers'

import Settings             from './pages/Settings'

/* ── Auth guards ──────────────────────────────────────────────────── */
function GuestRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (user && profile) {
    if (profile.role === 'admin')    return <Navigate to="/admin/dashboard" replace />
    if (profile.role === 'reviewer') return <Navigate to="/reviewer/dashboard" replace />
    return <Navigate to="/student/dashboard" replace />
  }

  return children
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: 'var(--muted-foreground)' }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Wrong role — redirect to their correct dashboard
    if (profile.role === 'admin')    return <Navigate to="/admin/dashboard"    replace />
    if (profile.role === 'reviewer') return <Navigate to="/reviewer/dashboard" replace />
    return <Navigate to="/student/dashboard" replace />
  }

  return children
}

/* ── Layout wrappers ──────────────────────────────────────────────── */
function PublicLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  )
}

function DashboardLayout({ role, children }) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar role={role} />
      <div className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── App ──────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/published-issues" element={<PublicLayout><PublishedIssues /></PublicLayout>} />
            <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Student */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout role="student"><StudentDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/student/upload" element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout role="student"><UploadJournal /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/student/journals" element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout role="student"><StudentJournals /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/student/journals/:id" element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout role="student"><StudentJournalDetail /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/student/settings" element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout role="student"><Settings /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/student/guidelines" element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout role="student"><StudentGuidelines /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Reviewer */}
            <Route path="/reviewer/dashboard" element={
              <ProtectedRoute allowedRoles={['reviewer']}>
                <DashboardLayout role="reviewer"><ReviewerDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/reviewer/assigned" element={
              <ProtectedRoute allowedRoles={['reviewer']}>
                <DashboardLayout role="reviewer"><AssignedJournals /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/reviewer/review/:id" element={
              <ProtectedRoute allowedRoles={['reviewer']}>
                <DashboardLayout role="reviewer"><ReviewJournal /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/reviewer/settings" element={
              <ProtectedRoute allowedRoles={['reviewer']}>
                <DashboardLayout role="reviewer"><Settings /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin"><AdminDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/journals" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin"><AdminJournals /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin"><AdminUsers /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin"><AdminReports /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin"><ReviewReportDetail /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reviewers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin"><AssignReviewers /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin"><Settings /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
