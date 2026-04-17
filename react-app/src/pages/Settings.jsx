import { useState, useEffect } from 'react'
import { Save, User, Mail, Lock } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { user, profile } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) setName(profile.name || '')
    if (user) setEmail(user.email || '')
  }, [profile, user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').update({ name }).eq('id', user.id)
      if (error) throw error
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    }
    setLoading(false)
  }

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      toast.success('Email update request sent. Please check your inbox.')
    } catch (err) {
      toast.error(err.message || 'Failed to update email')
    }
    setLoading(false)
  }

  const handleVerifyPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (signInError) throw new Error('Incorrect current password')
      
      setIsVerified(true)
      toast.success('Identity verified. You can now set a new password.')
    } catch (err) {
      toast.error(err.message || 'Verification failed')
    }
    setLoading(false)
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success('Password updated successfully!')
      setIsVerified(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account settings and preferences.</p>
      </div>

      <div className="two-col-grid">
        {/* Profile Settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Update Profile
            </div>
            <div className="card-description">Change your display name.</div>
          </div>
          <div className="card-content">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="form-group">
                <label>Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || !name}>
                {loading ? 'Saving...' : <><Save size={16} /> Save Profile</>}
              </button>
            </form>
          </div>
        </div>

        {/* Email Settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} /> Update Email
            </div>
            <div className="card-description">Change your login email address.</div>
          </div>
          <div className="card-content">
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="form-group">
                <label>New Email</label>
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-outline" disabled={loading || !email}>
                {loading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        </div>

        {/* Password Settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} /> Change Password
            </div>
            <div className="card-description">Update your password to keep your account secure.</div>
          </div>
          <div className="card-content">
            {!isVerified ? (
              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter current password to continue" 
                    className="input" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-outline" disabled={loading || !currentPassword}>
                  {loading ? 'Verifying...' : 'Verify Password'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    placeholder="Min 6 characters" 
                    className="input" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="Repeat new password" 
                    className="input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading || !newPassword || !confirmPassword}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setIsVerified(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
