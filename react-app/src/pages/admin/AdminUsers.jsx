import { useEffect, useState } from 'react'
import { Search, Edit2, Trash2, UserPlus, RefreshCw } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'

export default function AdminUsers() {
  const toast = useToast()
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

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

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const studentCount  = users.filter(u => u.role === 'student').length
  const reviewerCount = users.filter(u => u.role === 'reviewer').length
  const adminCount    = users.filter(u => u.role === 'admin').length

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
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <div className="card-content" style={{ paddingTop: '1rem' }}>
              <p className="stat-val">{loading ? '—' : value}</p>
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
          {['all', 'student', 'reviewer', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
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
                    <span className={u.status === 'active' ? 'status-approved' : 'status-rejected'}>
                      {u.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon" title="Delete"
                        style={{ color: 'var(--destructive)' }}
                        onClick={() => toast.error(`Delete requires service-role key — manage via Supabase dashboard.`)}>
                        <Trash2 size={15} />
                      </button>
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
    </div>
  )
}
