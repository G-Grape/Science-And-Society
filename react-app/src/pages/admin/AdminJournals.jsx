import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, RefreshCw, CheckCircle, XCircle, Clock, Send } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'

const statusLabels = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' }

export default function AdminJournals() {
  const toast = useToast()
  const navigate = useNavigate()
  const [journals, setJournals] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [updating, setUpdating] = useState(null) // journalId being updated

  useEffect(() => { fetchJournals() }, [])

  async function fetchJournals() {
    setLoading(true)
    const [journalsRes, assignmentsRes, reviewsRes] = await Promise.all([
      supabase
        .from('journals')
        .select('id, title, category, status, review_level, created_at, profiles(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('assignments')
        .select('journal_id, profiles(name)'),
      supabase
        .from('reviews')
        .select('journal_id'),
    ])

    if (journalsRes.error) { toast.error('Failed to load journals'); setLoading(false); return }

    const assignmentMap = {}
    for (const a of assignmentsRes.data ?? []) {
      assignmentMap[a.journal_id] = a.profiles?.name ?? '—'
    }
    const reviewSet = new Set((reviewsRes.data ?? []).map(r => r.journal_id))

    const merged = (journalsRes.data ?? []).map(j => ({
      ...j,
      reviewerName: assignmentMap[j.id] ?? '—',
      computedLevel: reviewSet.has(j.id) ? 2 : (assignmentMap[j.id] ? 1 : null),
    }))

    setJournals(merged)
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('journals')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      setJournals(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j))
      toast.success(`Status updated to ${statusLabels[newStatus]}`)
    }
    setUpdating(null)
  }

  const filtered = journals.filter(j => {
    const authorName = j.profiles?.name ?? ''
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
                        authorName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || j.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">All Journals</h1>
          <p className="page-subtitle">Manage and oversee all journal submissions</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchJournals} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search journals or authors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'submitted', 'under_review', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}>
              {f === 'all' ? 'All' : statusLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Reviewer</th>
                <th>Category</th>
                <th>Date</th>
                <th>Review Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>Loading journals…</td></tr>
              ) : filtered.map(j => (
                <tr key={j.id}>
                  <td style={{ maxWidth: '240px' }}>
                    <p style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</p>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{j.profiles?.name ?? '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{j.reviewerName}</td>
                  <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-secondary">{j.category}</span></td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                    {new Date(j.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {j.computedLevel !== null
                      ? <span className="badge badge-outline">Level {j.computedLevel}</span>
                      : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td><span className={`status-${j.status}`}>{statusLabels[j.status]}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon" title="View Review Report"
                        onClick={() => navigate(`/admin/reports/${j.id}`)}>
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>No journals found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer" style={{ paddingTop: '0.75rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          Showing {filtered.length} of {journals.length} journals
        </div>
      </div>
    </div>
  )
}
