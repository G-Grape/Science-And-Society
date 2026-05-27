import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FileText, ArrowRight, ArrowLeft, User, Download, ClipboardList, Clock, Search, CheckCircle, RotateCcw, XCircle } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'

/* ── Review Reports List (List View) ──────────────────────────────── */
export default function AdminReports() {
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('under_review')

  useEffect(() => { fetchJournals() }, [])

  async function fetchJournals() {
    setLoading(true)
    const [journalsRes, reviewsRes, assignmentsRes] = await Promise.all([
      supabase
        .from('journals')
        .select(`
          id, title, category, status, review_level, created_at,
          profiles ( name )
        `)
        .order('created_at', { ascending: false }),
      supabase.from('reviews').select('id, journal_id'),
      supabase.from('assignments').select('id, journal_id')
    ])

    if (journalsRes.error) { setLoading(false); return }

    const records = journalsRes.data ?? []
    const reviews = reviewsRes.data ?? []
    const assignments = assignmentsRes.data ?? []

    const merged = records.map(j => ({
      ...j,
      reviews: reviews.filter(r => r.journal_id === j.id),
      assignments: assignments.filter(a => a.journal_id === j.id)
    }))

    setJournals(merged)
    setLoading(false)
  }

  const filtered = journals.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.profiles?.name ?? '').toLowerCase().includes(search.toLowerCase())

    const hasReviews = Array.isArray(j.reviews) && j.reviews.length > 0
    const hasAdminDecision = ['approved', 'rejected', 'revision_required'].includes(j.status)

    // Review Reports should only show journals that have been through the review process
    if (!hasReviews && !hasAdminDecision) return false

    let matchFilter = true
    if (filter === 'assigned') {
      const hasAssignments = Array.isArray(j.assignments) && j.assignments.length > 0
      matchFilter = hasAssignments && !hasReviews
    } else if (filter === 'under_review') {
      matchFilter = hasReviews && j.status === 'under_review' && (j.review_level || 0) >= 1
    }

    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Review Reports</h1>
        <p className="page-subtitle">Access detailed feedback from reviewers</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input className="input" style={{ paddingLeft: '2.25rem' }}
            placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['under_review', 'assigned', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}>
              {f === 'all' ? 'All' : f === 'assigned' ? 'Assigned' : 'For Review'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-content space-y-4">
          {loading ? (
            <p className="text-sm text-muted">Loading journals…</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted-foreground)' }}>
              <ClipboardList size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No reports found</p>
            </div>
          ) : filtered.map(j => (
            <div key={j.id} className="submission-item">
              <div>
                <h3 className="font-medium">{j.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={12} />{j.profiles?.name ?? '—'}
                  </span>
                  <span className="text-xs text-muted">Level {j.review_level} Review</span>
                  <span className="text-xs text-muted">
                    <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    {new Date(j.created_at).toLocaleDateString()}
                  </span>
                  <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{j.reviews?.length ?? 0} Feedback</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`status-${j.status}`}>{j.status.replace('_', ' ')}</span>
                <Link to={`/admin/reports/${j.id}`} className="btn btn-primary btn-sm">
                  View Reports <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Review Report Detail (Detail View) ────────────────────────────── */
export function ReviewReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [journal, setJournal] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Admin decision form state
  const [selectedDecision, setSelectedDecision] = useState(null)
  const [adminComments, setAdminComments] = useState('')
  const [revisionFile, setRevisionFile] = useState(null)
  const [approvalFile, setApprovalFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchDetail() }, [id])

  async function fetchDetail() {
    setLoading(true)
    const [journalRes, reviewsRes] = await Promise.all([
      supabase.from('journals').select('*, profiles(name)').eq('id', id).single(),
      supabase.from('reviews').select('*, profiles(name)').eq('journal_id', id).order('created_at', { ascending: false })
    ])

    setJournal(journalRes.data ?? null)
    setReviews(reviewsRes.data ?? [])

    // Pre-fill if admin already submitted a decision
    if (journalRes.data) {
      const j = journalRes.data
      if (j.admin_comments) setAdminComments(j.admin_comments)
      if (['approved', 'rejected', 'revision_required'].includes(j.status)) {
        setSelectedDecision(j.status)
      }
    }
    setLoading(false)
  }

  async function handleDecisionSubmit(e) {
    e.preventDefault()
    if (!selectedDecision) { toast.error('Please select a decision'); return }
    if (!adminComments.trim()) { toast.error('Please provide comments'); return }

    // Enforce required PDFs
    if (!revisionFile && !journal.revision_report_url) {
      toast.error('Please upload a Revision Report PDF'); return
    }
    if (selectedDecision === 'approved' && !approvalFile && !journal.approval_proof_url) {
      toast.error('Please upload the Proof of Approval PDF'); return
    }

    setSubmitting(true)
    try {
      let revisionUrl = journal.revision_report_url || null
      let approvalUrl = journal.approval_proof_url || null

      // Upload revision report PDF if provided
      if (revisionFile) {
        const fileName = `admin/${id}/revision_${Date.now()}.pdf`
        const { error: upErr } = await supabase.storage
          .from('journals')
          .upload(fileName, revisionFile, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('journals').getPublicUrl(fileName)
        revisionUrl = urlData.publicUrl
      }

      // Upload approval proof PDF if provided (only for approved)
      if (approvalFile && selectedDecision === 'approved') {
        const fileName = `admin/${id}/approval_${Date.now()}.pdf`
        const { error: upErr } = await supabase.storage
          .from('journals')
          .upload(fileName, approvalFile, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('journals').getPublicUrl(fileName)
        approvalUrl = urlData.publicUrl
      }

      const { error } = await supabase
        .from('journals')
        .update({
          status: selectedDecision,
          admin_comments: adminComments,
          revision_report_url: revisionUrl,
          approval_proof_url: selectedDecision === 'approved' ? approvalUrl : null,
        })
        .eq('id', id)

      if (error) throw error

      setJournal(prev => ({
        ...prev,
        status: selectedDecision,
        admin_comments: adminComments,
        revision_report_url: revisionUrl,
        approval_proof_url: selectedDecision === 'approved' ? approvalUrl : null,
      }))
      toast.success(`Decision submitted — ${selectedDecision === 'approved' ? 'Approved' : selectedDecision === 'rejected' ? 'Rejected' : 'Revision Required'}`)
    } catch (err) {
      toast.error(err.message || 'Failed to submit decision')
    }
    setSubmitting(false)
  }

  if (loading) return <p className="text-muted text-sm" style={{ padding: '2rem' }}>Loading report details…</p>
  if (!journal) return <p>Journal not found.</p>

  const decisionOptions = [
    { status: 'approved', label: 'Approve', icon: CheckCircle, color: '#059669', bg: '#ecfdf5' },
    { status: 'revision_required', label: 'Revision Required', icon: RotateCcw, color: '#d97706', bg: '#fffbeb' },
    { status: 'rejected', label: 'Reject', icon: XCircle, color: '#dc2626', bg: '#fef2f2' },
  ]

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/reports')}>
          <ArrowLeft size={16} /> Back to List
        </button>
        <h1 className="page-title" style={{ margin: 0, fontSize: '1.25rem' }}>Journal Reports</h1>
        {journal.resubmission_count > 0 && (
          <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>
            Resubmission #{journal.resubmission_count}
          </span>
        )}
      </div>

      <div className="review-grid">
        {/* Left: Journal Details */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="card-title">{journal.title}</div>
              <div className="card-description">by {journal.profiles?.name ?? '—'} · {journal.category}</div>
            </div>
            <div className="card-content space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Abstract</p>
                {journal.abstract?.startsWith('http') ? (
                  <a href={journal.abstract} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', marginTop: '0.25rem' }}>
                    <Download size={14} /> Download Abstract
                  </a>
                ) : (
                  <p className="text-sm" style={{ lineHeight: '1.6' }}>{journal.abstract}</p>
                )}
              </div>
              {journal.file_url && (
                <a href={journal.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <Download size={14} /> Download Submission
                </a>
              )}
            </div>
          </div>

          {/* Internal Review Reports */}
          <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
            <div className="card-header">
              <div className="card-title">Reviewer Reports</div>
              <div className="card-description">Internal feedback and decisions from assigned reviewers</div>
            </div>
            <div className="card-content space-y-6">
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--muted-foreground)' }}>
                  <p className="text-sm italic">No feedback has been submitted for this journal yet.</p>
                </div>
              ) : reviews.map((r, i) => (
                <div key={r.id} style={{
                  padding: '1.25rem',
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: 'var(--foreground)' }}>
                      {r.comments}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Metadata + Decision Form */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header"><div className="card-title">Submission Details</div></div>
            <div className="card-content space-y-3">
              {[
                ['Status', <span key="s" className={`status-${journal.status}`}>{journal.status}</span>],
                ['Category', journal.category],
                ['Submitted', new Date(journal.created_at).toLocaleDateString()],
                ...(reviews.length > 0 ? [
                  ['Reviewer', reviews[0].profiles?.name ?? '—'],
                  ['Reviewed On', new Date(reviews[0].created_at).toLocaleDateString()],
                ] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="text-muted">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Feedback (from prior submission rounds) */}
          {journal.prev_admin_comments && (
            <div className="card" style={{ borderTop: '4px solid var(--muted-foreground)', opacity: 0.85 }}>
              <div className="card-header"><div className="card-title">Previous Feedback</div></div>
              <div className="card-content space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Admin Comments</p>
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

          {/* Admin Decision Form */}
          <div className="card">
            <div className="card-header"><div className="card-title">Admin Decision</div></div>
            <div className="card-content">
              {reviews.length === 0 && !journal.admin_comments ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--muted-foreground)' }}>
                  <p className="text-sm italic">⏳ Waiting for reviewer to submit their feedback before you can make a decision.</p>
                </div>
              ) : (
                <form onSubmit={handleDecisionSubmit} className="space-y-4">
                  {/* Decision Selection */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>Select Decision:</p>
                    {decisionOptions.map(({ status, label, icon: Icon, color, bg }) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setSelectedDecision(status)}
                        className="btn btn-sm"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          gap: '0.5rem',
                          color: selectedDecision === status ? '#fff' : color,
                          background: selectedDecision === status ? color : bg,
                          border: `1px solid ${color}`,
                          fontWeight: selectedDecision === status ? 600 : 400,
                        }}
                      >
                        <Icon size={16} />
                        {label}
                        {selectedDecision === status && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.9 }}>SELECTED</span>}
                      </button>
                    ))}
                  </div>

                  {/* Show form fields only after a decision is selected */}
                  {selectedDecision && (
                    <>
                      {/* Admin Comments */}
                      <div className="form-group">
                        <label className="text-sm font-medium">Comments <span style={{ color: 'var(--destructive)' }}>*</span></label>
                        <textarea
                          className="textarea"
                          rows={4}
                          placeholder="Provide your comments for the student…"
                          value={adminComments}
                          onChange={e => setAdminComments(e.target.value)}
                          required
                        />
                      </div>

                      {/* Revision Report PDF */}
                      <div className="form-group">
                        <label className="text-sm font-medium">Revision Report (PDF) <span style={{ color: 'var(--destructive)' }}>*</span></label>
                        {revisionFile || journal.revision_report_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <span className="text-sm">{revisionFile ? revisionFile.name : 'Existing Document Uploaded'}</span>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                              setRevisionFile(null)
                              setJournal(prev => ({ ...prev, revision_report_url: null }))
                            }}>✕</button>
                          </div>
                        ) : (
                          <input type="file" accept=".pdf" className="input" style={{ padding: '0.4rem' }} required
                            onChange={e => { if (e.target.files?.[0]) setRevisionFile(e.target.files[0]) }} />
                        )}
                      </div>

                      {/* Approval Proof PDF - only for approved */}
                      {selectedDecision === 'approved' && (
                        <div className="form-group">
                          <label className="text-sm font-medium">Proof of Approval (PDF) <span style={{ color: 'var(--destructive)' }}>*</span></label>
                          {approvalFile || journal.approval_proof_url ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                              <span className="text-sm">{approvalFile ? approvalFile.name : 'Existing Document Uploaded'}</span>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                                setApprovalFile(null)
                                setJournal(prev => ({ ...prev, approval_proof_url: null }))
                              }}>✕</button>
                            </div>
                          ) : (
                            <input type="file" accept=".pdf" className="input" style={{ padding: '0.4rem' }} required
                              onChange={e => { if (e.target.files?.[0]) setApprovalFile(e.target.files[0]) }} />
                          )}
                        </div>
                      )}

                      {/* Submit Button */}
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                        {submitting ? 'Submitting Decision…' : (journal.admin_comments ? 'Edit Decision' : 'Submit Decision')}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
