import { useLocation, Link } from 'react-router-dom'
import { BookOpen, Home, Mail, Phone, Clock } from 'lucide-react'

export default function PendingApproval() {
  const location = useLocation()
  const name = location.state?.name || 'Reviewer'

  return (
    <div className="auth-page login-page-override">
      <div className="login-topbar">
        <div className="login-topbar-brand">
          <BookOpen size={24} />
          <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Science and Society</span>
        </div>
        <Link to="/" aria-label="Home" className="login-topbar-home">
          <Home size={20} />
        </Link>
      </div>

      <div className="auth-wrapper login-wrapper-override">
        <div className="auth-card card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '4rem', height: '4rem', borderRadius: '50%', 
              background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <Clock size={32} />
            </div>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Hello, {name}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Your account is currently under review and pending admin approval. You will be able to log in and access the dashboard once an administrator approves your registration.
          </p>

          <div style={{ 
            background: 'var(--muted)', borderRadius: 'var(--radius)', 
            padding: '1.5rem', textAlign: 'left', marginBottom: '1rem' 
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Contact Information</h3>
            <div className="space-y-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                <Mail size={16} />
                <a href="mailto:editorscisoc@nirmalacollege.ac.in" className="auth-link">editorscisoc@nirmalacollege.ac.in</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                <Phone size={16} />
                <span>+91 4852 832361</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Link to="/login" className="btn btn-outline w-full" style={{ justifyContent: 'center' }}>
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
