import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FileText, ArrowRight, ArrowLeft, User, Download, CheckCircle, RotateCcw, XCircle } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const statusLabels = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' }

/* ── Assigned Journals List ───────────────────────────────────────── */
export function AssignedJournals() {
  const { user }   = useAuth()
  const [items,    setItems]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [filter,   setFilter]  = useState('all')

  useEffect(() => { if (user) fetchAssigned() }, [user])

  async function fetchAssigned() {
    setLoading(true)
    // Fetch assignments for this reviewer, join journal info + student profile
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        id,
        journals (
          id, title, abstract, category, status, review_level, created_at,
          profiles ( name )
        )
      `)
      .eq('reviewer_id', user.id)

    if (error) { setLoading(false); return }

    // Attach a review_status based on whether this reviewer already submitted a review
    const journalIds = (data ?? []).map(a => a.journals?.id).filter(Boolean)
    const { data: reviewedIds } = await supabase
      .from('reviews')
      .select('journal_id')
      .eq('reviewer_id', user.id)
      .in('journal_id', journalIds.length ? journalIds : ['none'])

    const reviewedSet = new Set((reviewedIds ?? []).map(r => r.journal_id))

    setItems(
      (data ?? [])
        .filter(a => a.journals)
        .map(a => ({
          ...a.journals,
          assignmentId:  a.id,
          reviewStatus:  reviewedSet.has(a.journals.id) ? 'completed' : 'pending',
        }))
    )
    setLoading(false)
  }

  const filtered = filter === 'all' ? items : items.filter(j => j.reviewStatus === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Assigned Journals</h1>
        <p className="page-subtitle">Journals assigned to you for review</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[{id: 'all', label: 'All'}, {id: 'pending', label: 'Assigned'}, {id: 'completed', label: 'Completed'}].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-outline'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-content space-y-4">
          {loading ? (
            <p className="text-sm text-muted" style={{ padding: '1rem 0' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted-foreground)' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No journals found</p>
            </div>
          ) : filtered.map(j => (
            <div key={j.id} className="submission-item">
              <div>
                <h3 className="font-medium">{j.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={12} />{j.profiles?.name ?? '—'}
                  </span>
                  <span className="text-xs text-muted">{j.category}</span>
                  <span className="text-xs text-muted">Level {j.review_level}</span>
                  <span className="text-xs text-muted">Submitted {new Date(j.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                  <span className={`status-${j.status}`} style={{ display: 'block', marginBottom: '0.25rem' }}>{statusLabels[j.status] || j.status}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Your Review: {j.reviewStatus === 'completed' ? 'Done' : 'Assigned'}
                  </span>
                </div>
                {j.reviewStatus === 'pending' && (
                  <Link to={`/reviewer/review/${j.id}`} className="btn btn-primary btn-sm">
                    <FileText size={14} /> Review
                  </Link>
                )}
                {j.reviewStatus === 'completed' && (
                  <Link to={`/reviewer/review/${j.id}`} className="btn btn-outline btn-sm">
                    View <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Review Detail / Form ─────────────────────────────────────────── */
export function ReviewJournal() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const toast      = useToast()
  const { user }   = useAuth()

  const [journal,    setJournal]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [comments,   setComments]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existing,   setExisting]   = useState(null)

  useEffect(() => { fetchJournal() }, [id])

  async function fetchJournal() {
    setLoading(true)
    const [journalRes, reviewRes] = await Promise.all([
      supabase.from('journals').select('*, profiles(name)').eq('id', id).single(),
      supabase.from('reviews').select('*').eq('journal_id', id).eq('reviewer_id', user?.id).maybeSingle(),
    ])
    setJournal(journalRes.data ?? null)

    if (reviewRes.data) {
      setExisting(reviewRes.data)
      setComments(reviewRes.data.comments)
    }
    setLoading(false)
  }

  if (loading) return <p className="text-muted text-sm" style={{ padding: '2rem' }}>Loading…</p>
  if (!journal) return <p>Journal not found.</p>


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comments.trim())  { toast.error('Please provide review comments'); return }
    setSubmitting(true)

    try {
      const payload = {
        journal_id:  id,
        reviewer_id: user.id,
        decision: 'approve',
        comments,
        originality: null,
        methodology: null,
        clarity:     null,
        refs:        null,
        overall:     null,
      }

      if (existing) {
        const { error } = await supabase.from('reviews').update(payload).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('reviews').insert(payload)
        if (error) throw error
      }

      toast.success('Review submitted successfully!')
      navigate('/reviewer/assigned')
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reviewer/assigned')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="page-title" style={{ margin: 0, fontSize: '1.25rem' }}>Review Journal</h1>
        {existing && <span className="badge badge-secondary">Previously Submitted</span>}
        {journal.resubmission_count > 0 && (
          <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>
            Resubmission #{journal.resubmission_count}
          </span>
        )}
      </div>

      <div className="review-grid">
        {/* Left: form */}
        <div className="space-y-4">
          {/* Journal info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">{journal.title}</div>
              <div className="card-description">by {journal.profiles?.name ?? '—'} · {journal.category} · Level {journal.review_level} Review</div>
            </div>
            <div className="card-content space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Abstract</p>
                {journal.abstract?.startsWith('http') ? (
                  <a href={journal.abstract} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', marginTop: '0.25rem' }}>
                    <Download size={14} /> Download Abstract
                  </a>
                ) : (
                  <p className="text-sm">{journal.abstract}</p>
                )}
              </div>
              {journal.file_url && (
                <a href={journal.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <Download size={14} /> Download Full Paper
                </a>
              )}
            </div>
          </div>


          {/* Comments */}
          <div className="card">
            <div className="card-header"><div className="card-title">Review Comments &amp; Decision</div></div>
            <div className="card-content">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label>Comments for Author <span style={{ color: 'var(--destructive)' }}>*</span></label>
                  <textarea className="textarea" rows={5}
                    placeholder="Provide detailed feedback for the author…"
                    value={comments} onChange={e => setComments(e.target.value)} required />
                </div>

                <div className="page-footer-actions">
                  <button type="button" className="btn btn-outline" onClick={() => navigate('/reviewer/assigned')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting…' : <><CheckCircle size={16} /> {existing ? 'Update Review' : 'Submit Review'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right: guidelines */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header"><div className="card-title">Review Guidelines</div></div>
            <div className="card-content">
              <ul className="list-disc text-sm text-muted">
                <li>Read the full paper before reviewing</li>
                <li>Focus on academic merit and contribution</li>
                <li>Provide constructive, specific feedback</li>
                <li>Maintain confidentiality of the review</li>
                <li>Be objective and unbiased</li>
                <li>Complete review within the deadline</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Submission Details</div></div>
            <div className="card-content space-y-2">
              {[
                ['Category',     journal.category],
                ['Submitted',    new Date(journal.created_at).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-sm text-muted">{k}</span>
                  <span className="text-sm font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Feedback (from prior submission rounds) */}
          {journal.prev_reviewer_comments && (
            <div className="card" style={{ borderTop: '4px solid var(--muted-foreground)', opacity: 0.85 }}>
              <div className="card-header"><div className="card-title">Your Previous Review</div></div>
              <div className="card-content space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Your Comments</p>
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{journal.prev_reviewer_comments}</p>
                </div>
                {journal.prev_admin_comments && (
                  <div>
                    <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Admin's Decision Comments</p>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{journal.prev_admin_comments}</p>
                  </div>
                )}
                {journal.prev_revision_report_url && (
                  <a href={journal.prev_revision_report_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                    <Download size={14} /> Previous Revision Report
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
