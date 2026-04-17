import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, LogIn, UserPlus, Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#guidelines', label: 'Guidelines' },
  { href: '/#about', label: 'About' },
  { href: '/#workflow', label: 'Workflow' },
  { href: '/#contact', label: 'Contact' },
]

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()

  const dashboardPath = profile?.role === 'admin'
    ? '/admin/dashboard'
    : profile?.role === 'reviewer'
      ? '/reviewer/dashboard'
      : '/student/dashboard'

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <BookOpen size={32} />
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">Science and Society</span>
            <span className="navbar-brand-sub">2026</span>
          </div>
        </Link>

        <nav className="navbar-links">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`navbar-link${location.pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          {loading ? (
            <div style={{ width: '80px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner-sm" />
            </div>
          ) : user ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to={dashboardPath} className="btn btn-sidebar-solid btn-sm">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button 
                onClick={async () => { await signOut(); navigate('/'); }}
                className="btn btn-sidebar btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-sidebar btn-sm">
                <LogIn size={16} /> Login
              </Link>
              <Link to="/register" className="btn btn-sidebar-solid btn-sm">
                <UserPlus size={16} /> Register
              </Link>
            </>
          )}
        </div>

        <button
          className="btn btn-ghost btn-icon navbar-menu-btn"
          style={{ color: 'var(--sidebar-fg)' }}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
          <div className="mobile-menu-panel">
            <div className="mobile-menu-close">
              <button className="btn btn-ghost btn-icon" style={{ color: 'var(--sidebar-fg)' }} onClick={() => setMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="mobile-menu-nav">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <hr className="mobile-menu-divider" />
              {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <div className="spinner-sm" />
                </div>
              ) : user ? (
                <>
                  <Link to={dashboardPath} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard size={20} /> Dashboard
                  </Link>
                  <a href="#" className="mobile-menu-link text-destructive" onClick={async (e) => { 
                    e.preventDefault(); 
                    setMenuOpen(false); 
                    await signOut(); 
                    navigate('/'); 
                  }}>
                    <LogOut size={20} /> Logout
                  </a>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <LogIn size={20} /> Login
                  </Link>
                  <Link to="/register" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <UserPlus size={20} /> Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
