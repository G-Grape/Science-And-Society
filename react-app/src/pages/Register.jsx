import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, UserPlus, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

// Admin secret code — change this to something private in production
const ADMIN_SECRET = 'GYANADMIN2026'

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', role: '', password: '', confirmPassword: '', adminCode: ''
  })

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (!form.role) { toast.error('Please select a role'); return }

    // Validate admin secret code
    if (form.role === 'admin') {
      if (!form.adminCode) { toast.error('Admin secret code is required'); return }
      if (form.adminCode !== ADMIN_SECRET) { toast.error('Invalid admin secret code'); return }
    }

    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name, form.role)
      toast.success('Registration successful! Please check your email to confirm your account, then sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-logo">
          <Link to="/" className="auth-logo-inner">
            <BookOpen size={40} style={{ color: 'var(--primary)' }} />
            <div className="auth-logo-texts">
              <span className="auth-logo-title">Gyan Samavesh</span>
              <span className="auth-logo-sub">2026</span>
            </div>
          </Link>
        </div>

        <div className="auth-card card">
          <div className="auth-card-header">
            <div className="auth-card-title">Create an account</div>
            <div className="auth-card-desc">Register to submit and track your journal submissions</div>
          </div>

          <div className="auth-card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" className="input" placeholder="John Doe"
                  value={form.name} onChange={set('name')} required />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input id="reg-email" type="email" className="input" placeholder="your@email.com"
                  value={form.email} onChange={set('email')} required />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select id="role" className="select" value={form.role} onChange={set('role')}>
                  <option value="">Select your role</option>
                  <option value="student">Student / Researcher</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Admin secret code — only shown when admin is selected */}
              {form.role === 'admin' && (
                <div className="form-group" style={{
                  background: 'rgba(var(--primary-rgb, 22 163 74), 0.08)',
                  border: '1px dashed var(--primary)',
                  borderRadius: 'var(--radius)',
                  padding: '0.875rem'
                }}>
                  <label htmlFor="adminCode" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <ShieldCheck size={15} style={{ color: 'var(--primary)' }} />
                    Admin Secret Code
                  </label>
                  <input id="adminCode" type="password" className="input"
                    placeholder="Enter admin secret code"
                    value={form.adminCode} onChange={set('adminCode')} />
                  <p className="form-hint">Contact the system administrator for the secret code.</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <div className="password-wrapper">
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} className="input"
                    placeholder="Create a password (min 6 characters)" value={form.password}
                    onChange={set('password')} style={{ paddingRight: '2.5rem' }} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" className="input"
                  placeholder="Confirm your password" value={form.confirmPassword}
                  onChange={set('confirmPassword')} required />
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                <input type="checkbox" style={{ marginTop: '0.2rem' }} required />
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  I agree to the{' '}
                  <a href="#" className="auth-link">Terms of Service</a> and{' '}
                  <a href="#" className="auth-link">Privacy Policy</a>
                </span>
              </label>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Creating account…' : <><UserPlus size={16} /> Create Account</>}
              </button>
            </form>
          </div>

          <div className="auth-card-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
