import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckCircle, Clock, FileText, ArrowRight, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function ReviewerDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchAssigned() }, [user])

  async function fetchAssigned() {
    setLoading(true)

    // Fetch assignments for this reviewer with journal info
    const { data: assignments } = await supabase
      .from('assignments')
      .select(`journals ( id, title, category, review_level, created_at, profiles(name) )`)
      .eq('reviewer_id', user.id)

    const journals = (assignments ?? []).map(a => a.journals).filter(Boolean)
    const journalIds = journals.map(j => j.id)

    // Check which ones this reviewer has already reviewed
    const { data: reviewedData } = await supabase
      .from('reviews')
      .select('journal_id')
      .eq('reviewer_id', user.id)
      .in('journal_id', journalIds.length ? journalIds : ['none'])

    const reviewedSet = new Set((reviewedData ?? []).map(r => r.journal_id))

    setItems(journals.map(j => ({
      ...j,
      reviewStatus: reviewedSet.has(j.id) ? 'completed' : 'pending',
    })))
    setLoading(false)
  }

  const total = items.length
  const pending = items.filter(j => j.reviewStatus === 'pending').length
  const completed = items.filter(j => j.reviewStatus === 'completed').length

  const stats = [
    { label: 'Total Assigned', value: total, icon: ClipboardList, color: 'var(--primary)' },
    { label: 'Assigned', value: pending, icon: Clock, color: '#d97706' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: '#059669' },
  ]

  const pendingJournals = items.filter(j => j.reviewStatus === 'pending').slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reviewer Dashboard</h1>
        <p className="page-subtitle">Manage your assigned journal reviews</p>
      </div>

      <div className="stats-grid stats-grid-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="card-content stat-card">
              <div className="stat-icon" style={{ color }}><Icon size={24} /></div>
              <div>
                <p className="stat-val">{loading ? '—' : value}</p>
                <p className="stat-label">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assigned Reviews */}
      <div className="card">
        <div className="card-header">
          <div className="section-card-header">
            <div>
              <div className="card-title">Assigned Reviews</div>
              <div className="card-description">Journals awaiting your review</div>
            </div>
            <Link to="/reviewer/assigned" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="card-content space-y-4">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : pendingJournals.length === 0 ? (
            <p className="text-sm text-muted">No assigned reviews</p>
          ) : pendingJournals.map(j => (
            <div key={j.id} className="submission-item">
              <div>
                <h3 className="font-medium">{j.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={12} /> {j.profiles?.name ?? '—'}
                  </span>
                  <span className="text-xs text-muted">{j.category}</span>
                  <span className="text-xs text-muted">Level {j.review_level} Review</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-pending">Assigned Review</span>
                <Link to={`/reviewer/review/${j.id}`} className="btn btn-primary btn-sm">
                  <FileText size={14} /> Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col-grid">
        <div className="card">
          <div className="card-header"><div className="card-title">Review Guidelines</div></div>
          <div className="card-content">
            <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Please evaluate each submission based on:</p>
            <ul className="list-disc text-sm text-muted">
              <li>Originality and contribution to the field</li>
              <li>Methodology and research design</li>
              <li>Clarity and organization</li>
              <li>Proper citations and references</li>
              <li>Overall quality and presentation</li>
            </ul>
          </div>
        </div>


      </div>
    </div>
  )
}
