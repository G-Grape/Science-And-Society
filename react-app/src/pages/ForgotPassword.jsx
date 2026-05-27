import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Home, Eye, EyeOff, ArrowLeft, Mail, ShieldCheck, KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const navigate = useNavigate()

  // Steps: 'email' → 'otp' → 'password' → 'success'
  const [step, setStep] = useState('email')

  const [email, setEmail] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  /* ── Helpers ──────────────────────────────────────────── */

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.'
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.'
    return ''
  }

  /* ── Step 1 – Send OTP ───────────────────────────────── */

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/forgot-password'
      })

      console.log('Sending OTP response:', { data, resetError })

      if (resetError) {
        console.error('Full resetError:', JSON.stringify(resetError, null, 2))
        const msg = (resetError.message || '').toLowerCase()
        if (msg.includes('user not found') || msg.includes('no user') || msg.includes('unable to validate')) {
          setError('No account found with this email address.')
        } else if (msg.includes('rate') || msg.includes('limit') || msg.includes('security')) {
          setError('Too many requests. Please wait a minute before trying again.')
        } else if (resetError.message) {
          setError(resetError.message)
        } else {
          setError('Failed to send OTP. Please check your email and try again. Error: ' + JSON.stringify(resetError))
        }
      } else {
        setStep('otp')
      }
    } catch (err) {
      console.error('Catch error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  /* ── Step 2 – Verify OTP ─────────────────────────────── */

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpInput,
        type: 'recovery'
      })

      if (verifyError) {
        setError('Invalid or expired OTP. Please double-check the code and try again.')
      } else {
        setStep('password')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  /* ── Step 3 – Update Password ────────────────────────── */

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')
    setPasswordError('')

    const valErr = validatePassword(newPassword)
    if (valErr) {
      setPasswordError(valErr)
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setStep('success')
        setTimeout(() => navigate('/login', { replace: true }), 3000)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  /* ── Render helpers ──────────────────────────────────── */

  const renderStepIndicator = () => {
    const steps = [
      { key: 'email', label: 'Email', icon: <Mail size={14} /> },
      { key: 'otp', label: 'Verify', icon: <ShieldCheck size={14} /> },
      { key: 'password', label: 'Reset', icon: <KeyRound size={14} /> }
    ]
    const currentIdx = steps.findIndex(s => s.key === step)

    return (
      <div className="fp-steps">
        {steps.map((s, i) => (
          <div key={s.key} className={`fp-step-item ${i <= currentIdx ? 'active' : ''} ${i < currentIdx ? 'done' : ''}`}>
            <div className="fp-step-dot">{s.icon}</div>
            <span className="fp-step-label">{s.label}</span>
            {i < steps.length - 1 && <div className="fp-step-line" />}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="auth-page login-page-override">
      {/* Top bar – same as Login */}
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
            <div className="auth-card-title">
              {step === 'success' ? 'All Done!' : 'Reset Password'}
            </div>
            <div className="auth-card-desc">
              {step === 'email' && 'Enter your email to receive a one-time password.'}
              {step === 'otp' && 'Enter the OTP sent to your email.'}
              {step === 'password' && 'Choose a new password for your account.'}
              {step === 'success' && 'Your password has been updated.'}
            </div>

            {step !== 'success' && (
              <div style={{ marginTop: '1.25rem' }}>{renderStepIndicator()}</div>
            )}
          </div>

          <div className="auth-card-body">
            {/* Global error banner */}
            {error && (
              <div className="fp-error-banner">
                {error}
              </div>
            )}

            {/* ── Step: Email ───────────────────────── */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="fp-email">Email address</label>
                  <input
                    id="fp-email"
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? (
                    <span className="fp-btn-loading"><span className="fp-spinner" /> Sending...</span>
                  ) : (
                    <><Mail size={16} /> Send OTP</>
                  )}
                </button>
              </form>
            )}

            {/* ── Step: OTP ─────────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="fp-success-banner">
                  OTP sent! Please check your email inbox and spam folder.
                </div>

                <div className="form-group">
                  <label htmlFor="fp-otp">One-Time Password</label>
                  <input
                    id="fp-otp"
                    type="text"
                    className="input"
                    placeholder="Enter the OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? (
                    <span className="fp-btn-loading"><span className="fp-spinner" /> Verifying...</span>
                  ) : (
                    <><ShieldCheck size={16} /> Verify OTP</>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline w-full"
                  style={{ marginTop: '0.5rem' }}
                  disabled={loading}
                  onClick={() => { setStep('email'); setError(''); setOtpInput('') }}
                >
                  <ArrowLeft size={16} /> Resend OTP
                </button>
              </form>
            )}

            {/* ── Step: New Password ────────────────── */}
            {step === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="fp-password">New Password</label>
                  <div className="password-wrapper">
                    <input
                      id="fp-password"
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError('') }}
                      style={{ paddingRight: '2.5rem' }}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordError && (
                    <span className="fp-field-error">{passwordError}</span>
                  )}
                  <ul className="fp-pw-rules">
                    <li className={newPassword.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                    <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>At least one number</li>
                    <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>At least one uppercase letter</li>
                  </ul>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? (
                    <span className="fp-btn-loading"><span className="fp-spinner" /> Updating password...</span>
                  ) : (
                    <><KeyRound size={16} /> Update Password</>
                  )}
                </button>
              </form>
            )}

            {/* ── Step: Success ─────────────────────── */}
            {step === 'success' && (
              <div className="fp-success-final">
                <div className="fp-success-icon">
                  <ShieldCheck size={40} />
                </div>
                <p className="fp-success-text">
                  Password updated successfully! Redirecting to login...
                </p>
                <div className="fp-progress-bar"><div className="fp-progress-fill" /></div>
              </div>
            )}
          </div>

          {step === 'email' && (
            <div className="auth-card-footer">
              Remember your password?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
