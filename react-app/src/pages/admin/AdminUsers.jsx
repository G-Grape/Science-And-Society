import { useEffect, useState } from 'react'
import { Search, Trash2, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/ConfirmModal'

export default function AdminUsers() {
  const toast = useToast()
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('student')
  const [actionLoading, setActionLoading] = useState(null) // track which user action is in progress

  // Confirmation Modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmData, setConfirmData] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { toast.error('Failed to load users'); setLoading(false); return }
    setUsers(data ?? [])
    setLoading(false)
  }

  async function approveUser(userId) {
    setActionLoading(userId)
    const { error } = await supabase.rpc('approve_reviewer', { target_user_id: userId })

    if (error) {
      toast.error('Failed to approve user: ' + error.message)
    } else {
      toast.success('Reviewer approved successfully!')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u))
      window.dispatchEvent(new Event('users-updated'))
    }
    setActionLoading(null)
  }

  async function deleteUser(userId) {
    setActionLoading(userId)
    const { error } = await supabase.rpc('delete_user', { target_user_id: userId })

    if (error) {
      toast.error('Failed to delete user: ' + error.message)
    } else {
      toast.success('User deleted successfully')
      setUsers(prev => prev.filter(u => u.id !== userId))
      window.dispatchEvent(new Event('users-updated'))
    }
    setActionLoading(null)
  }

  function triggerDelete(userId, name) {
    setConfirmData({ userId, name })
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!confirmData) return
    setConfirmLoading(true)
    await deleteUser(confirmData.userId)
    setConfirmLoading(false)
    setConfirmOpen(false)
    setConfirmData(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRole = u.role === roleFilter
    return matchSearch && matchRole
  })

  const studentCount  = users.filter(u => u.role === 'student').length
  const reviewerCount = users.filter(u => u.role === 'reviewer').length
  const adminCount    = users.filter(u => u.role === 'admin').length
  const pendingCount  = users.filter(u => u.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">View and manage all registered users</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {[
          { label: 'Total Users', value: users.length },
          { label: 'Students',    value: studentCount },
          { label: 'Reviewers',   value: reviewerCount },
          { label: 'Admins',      value: adminCount },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="card" style={highlight ? { border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.06)' } : {}}>
            <div className="card-content" style={{ paddingTop: '1rem' }}>
              <p className="stat-val" style={highlight ? { color: '#f59e0b' } : {}}>{loading ? '—' : value}</p>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input className="input" style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['student', 'reviewer', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
              {r === 'reviewer' && pendingCount > 0 && (
                <span style={{
                  background: roleFilter === 'reviewer' ? '#fff' : '#f59e0b',
                  color: roleFilter === 'reviewer' ? 'var(--primary)' : '#fff',
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
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>Loading users…</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{u.name}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-default' : u.role === 'reviewer' ? 'badge-default' : 'badge-secondary'}`}
                      style={{ textTransform: 'capitalize' }}>{u.role}</span>
                  </td>
                  <td>
                    {u.status === 'pending' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        color: '#f59e0b', fontWeight: 500, fontSize: '0.8125rem'
                      }}>
                        <Clock size={13} /> Pending
                      </span>
                    ) : (
                      <span className={u.status === 'active' ? 'status-approved' : 'status-rejected'}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-actions">
                      {u.status === 'pending' ? (
                        <>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'var(--primary)', color: '#fff',
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              opacity: actionLoading === u.id ? 0.6 : 1
                            }}
                            disabled={actionLoading === u.id}
                            title="Approve reviewer"
                            onClick={() => approveUser(u.id)}
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'var(--destructive)', color: '#fff',
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              opacity: actionLoading === u.id ? 0.6 : 1
                            }}
                            disabled={actionLoading === u.id}
                            title="Reject & delete"
                            onClick={() => triggerDelete(u.id, u.name)}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-ghost btn-icon" title="Delete"
                          style={{ color: 'var(--destructive)' }}
                          onClick={() => triggerDelete(u.id, u.name)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer" style={{ paddingTop: '0.75rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User?"
        message={`Are you sure you want to delete ${confirmData?.name ?? 'this user'}? This will remove all their reviews, assignments, and account records forever.`}
        confirmText="Delete"
        loading={confirmLoading}
        type="danger"
      />
    </div>
  )
}
