import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FileText, Upload, ArrowRight, ArrowLeft, Download, MessageSquare } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const statusLabels = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Accepted', rejected: 'Rejected', revision_required: 'Revision Required' }

/* ── Journal List ─────────────────────────────────────────────────── */
export function StudentJournals() {
  const { user } = useAuth()
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { if (user) fetchJournals() }, [user])

  async function fetchJournals() {
    setLoading(true)
    const { data } = await supabase
      .from('journals')
      .select('id, title, category, status, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
    setJournals(data ?? [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? journals : journals.filter(j => j.status === filter)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Submissions</h1>
          <p className="page-subtitle">Track all your journal submissions and their review status</p>
        </div>
        <Link to="/student/upload" className="btn btn-primary">
          <Upload size={16} /> Upload New
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['all', 'submitted', 'under_review', 'revision_required', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}>
            {f === 'all' ? 'All' : statusLabels[f]}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-content">
          {loading ? (
            <p className="text-sm text-muted" style={{ padding: '2rem 0' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted-foreground)' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(j => (
                <div key={j.id} className="submission-item">
                  <div>
                    <Link to={`/student/journals/${j.id}`} className="submission-link">{j.title}</Link>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <span className="text-xs text-muted">{j.category}</span>
                      <span className="text-xs text-muted">
                        {new Date(j.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`status-${j.status}`}>{statusLabels[j.status]}</span>
                    <Link to={`/student/journals/${j.id}`} className="btn btn-outline btn-sm">
                      View <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Journal Detail ───────────────────────────────────────────────── */
export function StudentJournalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [journal, setJournal] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Resubmission form state
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editAbstractFile, setEditAbstractFile] = useState(null)
  const [editKeywords, setEditKeywords] = useState('')
  const [editFile, setEditFile] = useState(null)
  const [resubmitting, setResubmitting] = useState(false)

  useEffect(() => { fetchDetail() }, [id])

  async function fetchDetail() {
    setLoading(true)
    const [journalRes, reviewsRes] = await Promise.all([
      supabase.from('journals').select('*').eq('id', id).single(),
      supabase.from('reviews')
        .select('id, decision, comments, originality, methodology, clarity, refs, overall, created_at, profiles(name)')
        .eq('journal_id', id)
        .order('created_at', { ascending: true }),
    ])
    const j = journalRes.data ?? null
    setJournal(j)
    setReviews(reviewsRes.data ?? [])
    if (j) {
      setEditTitle(j.title)
      setEditKeywords(j.keywords)
    }
    setLoading(false)
  }

  async function handleResubmit(e) {
    e.preventDefault()
    if (!editTitle.trim()) { toast.error('Title is required'); return }
    setResubmitting(true)

    try {
      // Get the most recent reviewer comment for this journal
      const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null

      // Upload new abstract PDF if provided
      let abstractUrl = journal.abstract
      if (editAbstractFile) {
        const absName = `resubmissions/${id}/abstract_${Date.now()}.pdf`
        const { error: absErr } = await supabase.storage
          .from('journals')
          .upload(absName, editAbstractFile, { cacheControl: '3600', upsert: false })
        if (absErr) throw absErr
        const { data: absUrlData } = supabase.storage.from('journals').getPublicUrl(absName)
        abstractUrl = absUrlData.publicUrl
      }

      // Upload new file if provided
      let fileUrl = journal.file_url
      if (editFile) {
        const fileName = `resubmissions/${id}/${Date.now()}_${editFile.name}`
        const { error: upErr } = await supabase.storage
          .from('journals')
          .upload(fileName, editFile, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('journals').getPublicUrl(fileName)
        fileUrl = urlData.publicUrl
      }

      // Update journal: save previous feedback, reset for new review cycle
      // We set status to 'under_review' and review_level to 1 (assigned to reviewer)
      const { error } = await supabase
        .from('journals')
        .update({
          title: editTitle,
          abstract: abstractUrl,
          keywords: editKeywords,
          file_url: fileUrl,
          status: 'under_review',
          review_level: 1,
          resubmission_count: (journal.resubmission_count || 0) + 1,
          prev_admin_comments: journal.admin_comments,
          prev_revision_report_url: journal.revision_report_url,
          prev_reviewer_comments: latestReview?.comments || null,
          admin_comments: null,
          revision_report_url: null,
          approval_proof_url: null,
        })
        .eq('id', id)

      if (error) throw error

      // Delete old reviews so the reviewer starts fresh
      // This is what moves it from 'Completed' back to 'Assigned' for the reviewer
      const { error: delError } = await supabase.from('reviews').delete().eq('journal_id', id)

      if (delError) {
        console.error('Failed to delete old reviews:', delError)
        // If this fails, the reviewer will still see it as 'Completed'
        toast.error('Partial success: Journal updated but failed to clear old reviews. Please contact admin.')
      } else {
        toast.success('Journal resubmitted successfully! It has been assigned to your previous reviewer.')
      }

      setEditing(false)
      fetchDetail()
    } catch (err) {
      console.error('Resubmission error:', err)
      toast.error(err.message || 'Resubmission failed')
    }
    setResubmitting(false)
  }

  if (loading) return <p className="text-muted text-sm" style={{ padding: '2rem' }}>Loading…</p>

  if (!journal) return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <p>Journal not found.</p>
      <button className="btn btn-outline mt-4" onClick={() => navigate('/student/journals')}>Go back</button>
    </div>
  )

  const isRevisionRequired = journal.status === 'revision_required'

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/journals')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="page-title" style={{ margin: 0, fontSize: '1.25rem' }}>Journal Details</h1>
        {journal.resubmission_count > 0 && (
          <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>
            Resubmission #{journal.resubmission_count}
          </span>
        )}
      </div>

      <div className="review-grid">
        <div className="space-y-4">
          {/* Journal Info / Edit Form */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="card-title" style={{ flex: 1 }}>{editing ? 'Edit & Resubmit' : journal.title}</div>
                <span className={`status-${journal.status}`}>{statusLabels[journal.status] || journal.status}</span>
              </div>
            </div>
            <div className="card-content space-y-4">
              {editing ? (
                /* ── Resubmission Edit Form ── */
                <form onSubmit={handleResubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="text-sm font-medium">Title <span style={{ color: 'var(--destructive)' }}>*</span></label>
                    <input className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium">Abstract (PDF)</label>
                    {editAbstractFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <span className="text-sm">{editAbstractFile.name}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditAbstractFile(null)}>✕</button>
                      </div>
                    ) : (
                      <input type="file" accept=".pdf" className="input" style={{ padding: '0.4rem' }}
                        onChange={e => { if (e.target.files?.[0]) setEditAbstractFile(e.target.files[0]) }} />
                    )}
                    <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Leave empty to keep existing abstract</p>
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium">Keywords</label>
                    <input className="input" value={editKeywords} onChange={e => setEditKeywords(e.target.value)}
                      placeholder="comma-separated keywords" />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium">Upload Revised Paper (PDF)</label>
                    {editFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <span className="text-sm">{editFile.name}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditFile(null)}>✕</button>
                      </div>
                    ) : (
                      <input type="file" accept=".pdf" className="input" style={{ padding: '0.4rem' }}
                        onChange={e => { if (e.target.files?.[0]) setEditFile(e.target.files[0]) }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={resubmitting}>
                      {resubmitting ? 'Resubmitting…' : 'Resubmit Journal'}
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Normal View ── */
                <>
                  <div>
                    <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Abstract</p>
                    {journal.abstract?.startsWith('http') ? (
                      <a href={journal.abstract} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', marginTop: '0.25rem' }}>
                        <Download size={14} /> Download Abstract
                      </a>
                    ) : (
                      <p className="text-sm">{journal.abstract}</p>
                    )}
                  </div>
                  <div className="grid-2">
                    <div>
                      <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Category</p>
                      <p className="text-sm">{journal.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Submitted</p>
                      <p className="text-sm">{new Date(journal.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Keywords</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {journal.keywords.split(',').map(k => (
                        <span key={k} className="badge badge-secondary">{k.trim()}</span>
                      ))}
                    </div>
                  </div>
                  {journal.file_url && (
                    <a href={journal.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      <Download size={14} /> Download PDF
                    </a>
                  )}

                  {/* Resubmit Button - only when revision required */}
                  {isRevisionRequired && (
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}
                      onClick={() => setEditing(true)}>
                      ✏️ Edit & Resubmit Journal
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Review Progress */}
          <div className="card">
            <div className="card-header"><div className="card-title">Review Progress</div></div>
            <div className="card-content space-y-4">
              {(() => {
                let level1Status = 'Pending'
                let level2Status = 'Pending'
                let level1Active = false
                let level2Active = false
                let level1Completed = false
                let level2Completed = false

                if (journal.status === 'submitted') {
                  level1Status = 'Pending'
                  level2Status = 'Pending'
                } else if (journal.status === 'under_review') {
                  if (reviews.length === 0) {
                    level1Status = 'Under Review'
                    level1Active = true
                  } else {
                    level1Status = 'Review Completed'
                    level1Completed = true
                    level2Status = 'Under Review'
                    level2Active = true
                  }
                } else {
                  level1Status = 'Review Completed'
                  level1Completed = true
                  level2Status = 'Decision Made'
                  level2Completed = true
                }

                const levels = [
                  { num: 1, title: 'Level 1', status: level1Status, active: level1Active, completed: level1Completed },
                  { num: 2, title: 'Level 2', status: level2Status, active: level2Active, completed: level2Completed },
                ]

                return levels.map(level => {
                  const isHighlighted = level.active || level.completed;
                  return (
                    <div key={level.num} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                        background: isHighlighted ? 'var(--primary)' : 'var(--muted)',
                        color: isHighlighted ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      }}>{level.num}</div>
                      <div>
                        <p className="text-sm font-medium">{level.title}</p>
                        <p className="text-xs text-muted" style={{
                          color: level.active ? 'var(--primary)' : 'var(--muted-foreground)',
                          fontWeight: level.active ? 600 : 'normal'
                        }}>
                          {level.status}
                        </p>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Admin Decision - only show when admin has made a decision */}
          {journal.admin_comments && (
            <div className="card" style={{ borderTop: `4px solid ${journal.status === 'approved' ? '#059669' : journal.status === 'rejected' ? '#dc2626' : '#d97706'}` }}>
              <div className="card-header"><div className="card-title">Editor's Decision</div></div>
              <div className="card-content space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Decision</p>
                  <span className={`status-${journal.status}`}>
                    {journal.status === 'approved' ? 'Approved' : journal.status === 'rejected' ? 'Rejected' : journal.status === 'revision_required' ? 'Revision Required' : journal.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Comments</p>
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{journal.admin_comments}</p>
                </div>
                {journal.revision_report_url && (
                  <a href={journal.revision_report_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                    <Download size={14} /> Download Revision Report
                  </a>
                )}
                {journal.approval_proof_url && (
                  <a href={journal.approval_proof_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                    <Download size={14} /> Download Proof of Approval
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Previous Feedback (from prior submission rounds) */}
          {journal.prev_admin_comments && (
            <div className="card" style={{ borderTop: '4px solid var(--muted-foreground)', opacity: 0.85 }}>
              <div className="card-header"><div className="card-title">Previous Feedback</div></div>
              <div className="card-content space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Editor's Comments</p>
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{journal.prev_admin_comments}</p>
                </div>
                {journal.prev_reviewer_comments && (
                  <div>
                    <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Reviewer's Comments</p>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{journal.prev_reviewer_comments}</p>
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

          <div className="card">
            <div className="card-header"><div className="card-title">Need Help?</div></div>
            <div className="card-content">
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                If you have questions about your submission, contact our editorial team.
              </p>
              <button className="btn btn-outline w-full">
                <MessageSquare size={14} /> Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
