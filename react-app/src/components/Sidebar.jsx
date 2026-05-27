import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen, LayoutDashboard, Upload, FileText, Users,
  Settings, LogOut, Menu, X, ClipboardList, UserCog,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/upload', label: 'Upload Journal', icon: Upload },
  { to: '/student/journals', label: 'My Submissions', icon: FileText },
  { to: '/student/guidelines', label: 'Guidelines', icon: BookOpen },
]
const reviewerLinks = [
  { to: '/reviewer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reviewer/assigned', label: 'Assigned Journals', icon: ClipboardList },
]
const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/journals', label: 'All Journals', icon: FileText },
  { to: '/admin/reports', label: 'Review Reports', icon: ClipboardList },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/reviewers', label: 'Assign Reviewers', icon: UserCog },
]

const roleLabels = { student: 'Student', reviewer: 'Reviewer', admin: 'Admin' }

function SidebarContent({ role, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const links = role === 'student' ? studentLinks : role === 'reviewer' ? reviewerLinks : adminLinks
  const { signOut } = useAuth()
  const [forReviewCount, setForReviewCount] = useState(0)
  const [forAssignCount, setForAssignCount] = useState(0)
  const [pendingUsersCount, setPendingUsersCount] = useState(0)

  useEffect(() => {
    if (role === 'admin') {
      const fetchCount = async () => {
        const { data } = await supabase.from('journals').select('id, status, reviews(id)')
        if (data) {
          const count = data.filter(j => j.reviews && j.reviews.length > 0 && j.status === 'under_review').length
          const assignCount = data.filter(j => j.status === 'submitted').length
          setForReviewCount(count)
          setForAssignCount(assignCount)
        }
      }
      const fetchPendingUsers = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('status', 'pending')
        if (!error && data) {
          setPendingUsersCount(data.length)
        }
      }
      fetchCount()
      fetchPendingUsers()
    }
  }, [role])

  const handleLogout = async () => {
    try {
      if (onClose) onClose()
      await signOut()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)' }}>
      <div className="sidebar-header">
        <BookOpen size={32} />
        <div className="sidebar-brand">
          <span className="sidebar-brand-title">Science and Society</span>
          <span className="sidebar-brand-sub">{roleLabels[role]} Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`${location.pathname === to ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={20} />
            <span style={{ flex: 1 }}>{label}</span>
            {to === '/admin/reports' && forReviewCount > 0 && (
              <span style={{
                background: 'var(--sidebar-fg)',
                color: 'var(--sidebar-bg)',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}>
                {forReviewCount}
              </span>
            )}
            {to === '/admin/reviewers' && forAssignCount > 0 && (
              <span style={{
                background: 'var(--sidebar-fg)',
                color: 'var(--sidebar-bg)',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}>
                {forAssignCount}
              </span>
            )}
            {to === '/admin/users' && pendingUsersCount > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}>
                {pendingUsersCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link to={`/${role}/settings`} onClick={onClose} className={`${location.pathname === `/${role}/settings` ? 'active' : ''}`}>
          <Settings size={20} />
          Settings
        </Link>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
          <LogOut size={20} />
          Logout
        </a>
      </div>
    </div>
  )
}

export function DashboardSidebar({ role }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="sidebar">
        <SidebarContent role={role} />
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <BookOpen size={24} />
          <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Science and Society</span>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          style={{ color: 'var(--sidebar-fg)' }}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="sidebar-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="sidebar-drawer">
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1 }}>
              <button
                className="btn btn-ghost btn-icon"
                style={{ color: 'var(--sidebar-fg)' }}
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent role={role} onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
