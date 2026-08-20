import { BookOpen, Mail, Phone, MapPin, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export function Footer() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const dashboardPath = profile?.role === 'admin'
    ? '/admin/dashboard'
    : profile?.role === 'reviewer'
      ? '/reviewer/dashboard'
      : '/student/dashboard'

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', textDecoration: 'none' }}>
              <BookOpen size={32} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>SCIENCE AND SOCIETY</div>

              </div>
            </Link>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Academic journal submission and multi-level review platform by Nirmala College.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Quick Links</div>
            <div className="footer-links">
              <a href="#about" className="footer-link">About</a>
              <a href="#workflow" className="footer-link">Submission Workflow</a>
              {user ? (
                <>
                  <Link to={dashboardPath} className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <button
                    onClick={async () => { await signOut(); navigate('/'); }}
                    className="footer-link"
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="footer-link">Login</Link>
                  <Link to="/register" className="footer-link">Register</Link>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="footer-col-title">Guidelines</div>
            <div className="footer-links">
              <Link to="/student/guidelines" className="footer-link">Submission Guidelines</Link>
              <Link to="/student/guidelines" className="footer-link">Review Process</Link>
              <Link to="/#about" className="footer-link">Publication Ethics</Link>
              <Link to="/#about" className="footer-link">FAQs</Link>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="footer-contact-item">
                <Mail size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>editorscisoc@nirmalacollege.ac.in</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>+91 4852832361</span>
              </div>
              <div className="footer-contact-item">
                <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Nirmala College(Autonomous), MUVATTUPUZHA, Kerala, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Science and Society – Nirmala College. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
