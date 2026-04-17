import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, LogIn, Eye, EyeOff, ArrowLeft, Home } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await signIn(form.email, form.password)

      // Fetch the profile to get the role for redirect
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      toast.success('Welcome back!')

      if (profileData.role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (profileData.role === 'reviewer') navigate('/reviewer/dashboard', { replace: true })
      else navigate('/student/dashboard', { replace: true })

    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.')
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
            <div className="auth-card-title">Welcome</div>
            <div className="auth-card-desc">Enter your credentials to access your account</div>
          </div>

          <div className="auth-card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" className="input" placeholder="your@email.com"
                  value={form.email} onChange={set('email')} required />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input id="password" type={showPassword ? 'text' : 'password'} className="input"
                    placeholder="Enter your password" value={form.password} onChange={set('password')}
                    style={{ paddingRight: '2.5rem' }} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', cursor: 'pointer' }}>
                  <input type="checkbox" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Remember me</span>
                </label>
                <a href="#" className="auth-link" style={{ fontSize: '0.875rem' }}>Forgot password?</a>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
              </button>
            </form>
          </div>

          <div className="auth-card-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Register</Link>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          By signing in, you agree to our{' '}
          <a href="#" className="auth-link">Terms of Service</a> and{' '}
          <a href="#" className="auth-link">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
