import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, UserPlus, Eye, EyeOff, ShieldCheck, Home } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

// Admin secret code — change this to something private in production
const ADMIN_SECRET = 'SSADMIN2026'

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', role: '', password: '', confirmPassword: '', adminCode: ''
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }))
  }

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.'
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!form.name.trim()) newErrors.name = true
    if (!form.email.trim()) newErrors.email = true
    if (!form.role) newErrors.role = true
    
    if (form.role === 'admin') {
      if (!form.adminCode) {
        newErrors.adminCode = true
        toast.error('Admin secret code is required')
      } else if (form.adminCode !== ADMIN_SECRET) {
        newErrors.adminCode = true
        toast.error('Invalid admin secret code')
      }
    }

    const pwdErr = validatePassword(form.password)
    if (pwdErr) {
      newErrors.password = true
      toast.error(pwdErr)
    }
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = true
      if (!pwdErr) toast.error('Passwords do not match')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      if (newErrors.name || newErrors.email || newErrors.role) {
        toast.error('Please fill out all required fields')
      }
      return
    }

    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name, form.role)
      if (form.role === 'reviewer') {
        toast.success('Registration submitted! Your account is pending admin approval. You will be able to log in once approved.')
      } else {
        toast.success('Registration successful! Please check your email to confirm your account, then sign in.')
      }
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    }
    setLoading(false)
  }

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

        <div className="auth-card card">
          <div className="auth-card-header">
            <div className="auth-card-title">Create an account</div>
            <div className="auth-card-desc">Register to submit and track your journal submissions</div>
          </div>

          <div className="auth-card-body">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="John Doe"
                  value={form.name} onChange={set('name')} />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input id="reg-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="your@email.com"
                  value={form.email} onChange={set('email')} />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select id="role" className={`select ${errors.role ? 'input-error' : ''}`} value={form.role} onChange={set('role')}>
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
                  <input id="adminCode" type="password" className={`input ${errors.adminCode ? 'input-error' : ''}`}
                    placeholder="Enter admin secret code"
                    value={form.adminCode} onChange={set('adminCode')} />
                  <p className="form-hint">Contact the system administrator for the secret code.</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <div className="password-wrapper">
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a password" value={form.password}
                    onChange={set('password')} style={{ paddingRight: '2.5rem' }} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <ul className="fp-pw-rules">
                  <li className={form.password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                  <li className={/[0-9]/.test(form.password) ? 'met' : ''}>At least one number</li>
                  <li className={/[A-Z]/.test(form.password) ? 'met' : ''}>At least one uppercase letter</li>
                </ul>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password" value={form.confirmPassword}
                  onChange={set('confirmPassword')} />
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
