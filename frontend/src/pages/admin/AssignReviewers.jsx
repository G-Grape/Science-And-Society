import { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/ConfirmModal'
import { sendNotification } from '../../lib/api'

export default function AssignReviewers() {
  const toast = useToast()
  const [journals, setJournals] = useState([])
  const [reviewers, setReviewers] = useState([])
  const [assignments, setAssignments] = useState({})   // { journalId: [{ id, reviewer_id, profiles: { name } }] }
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Confirmation Modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmData, setConfirmData] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAll is stable and intentionally mount-only
  useEffect(() => { fetchAll() }, [])


  async function fetchAll() {
    setLoading(true)
    const [journalsRes, reviewersRes, assignmentsRes] = await Promise.all([
      supabase
        .from('journals')
        .select('id, title, abstract, keywords, file_url, created_at, resubmission_count, prev_admin_comments, prev_reviewer_comments, prev_reviewer_name, profiles(name, id), student_id')
        .in('status', ['submitted', 'pending', 'under_review'])
        .order('resubmission_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('profiles')
        .select('id, name, role, status')
        .eq('role', 'reviewer')
        .eq('status', 'active')
        .limit(200),  // Only admin-approved reviewers
      supabase
        .from('assignments')
        .select('id, journal_id, reviewer_id, profiles(name)')
        .limit(1000),
    ])

    if (journalsRes.error) toast.error('Failed to load journals')
    if (reviewersRes.error) toast.error('Failed to load reviewers')
    if (assignmentsRes.error) toast.error('Failed to load assignments')

    setJournals(journalsRes.data ?? [])
    setReviewers(reviewersRes.data ?? [])

    // Group assignments by journal_id
    const grouped = {}
    for (const a of assignmentsRes.data ?? []) {
      if (!grouped[a.journal_id]) grouped[a.journal_id] = []
      grouped[a.journal_id].push(a)
    }
    setAssignments(grouped)
    setLoading(false)
  }

  async function assignReviewer(journalId, reviewer) {
    const current = assignments[journalId] ?? []
    if (current.some(a => a.reviewer_id === reviewer.id)) {
      toast.error(`${reviewer.name} is already assigned`)
      return
    }
    if (current.length >= 1) {
      toast.error('Only 1 reviewer allowed per journal')
      return
    }

    const { error } = await supabase.rpc('assign_reviewer_to_journal', {
      p_journal_id: journalId,
      p_reviewer_id: reviewer.id
    })

    if (error) { toast.error(error.message || 'Failed to assign reviewer'); return }

    // Fetch the newly created assignment to get its ID for the UI
    const { data } = await supabase
      .from('assignments')
      .select('id, journal_id, reviewer_id, profiles(name)')
      .eq('journal_id', journalId)
      .eq('reviewer_id', reviewer.id)
      .single()

    if (data) {
      setAssignments(prev => ({
        ...prev,
        [journalId]: [...(prev[journalId] ?? []), data],
      }))
    }

    // Update journal status to under_review locally
    const journal = journals.find(j => j.id === journalId)
    if (journal) {
      setJournals(prev => prev.filter(j => j.id !== journalId))
      if (selected === journalId) setSelected(null)

      let emailFailed = false;
      // Notify reviewer
      const revRes = await sendNotification('/api/notify/assign', { reviewerId: reviewer.id, reviewerName: reviewer.name, journalTitle: journal.title, isRework: (journal.resubmission_count ?? 0) > 0 })
      if (!revRes || !revRes.ok) emailFailed = true;
      
      // Notify student that their paper has been sent for review
      if (journal.student_id) {
        const stuRes = await sendNotification('/api/notify/sent-for-review', { studentId: journal.student_id, studentName: journal.profiles?.name || 'Author', journalTitle: journal.title })
        if (!stuRes || !stuRes.ok) emailFailed = true;
      }

      if (emailFailed) {
        toast.error(`Assignment completed, but failed to send email notifications.`, { duration: 5000 });
      } else {
        toast.success(`${reviewer.name} assigned successfully!`)
      }
    } else {
      toast.success(`${reviewer.name} assigned successfully!`)
    }
  }

  async function removeReviewer(journalId, assignmentId, reviewerName) {
    const { error } = await supabase.rpc('unassign_reviewer_from_journal', {
      p_journal_id: journalId,
      p_assignment_id: assignmentId
    })
    
    if (error) { toast.error('Failed to remove reviewer'); return }

    const remaining = (assignments[journalId] ?? []).filter(a => a.id !== assignmentId)
    setAssignments(prev => ({
      ...prev,
      [journalId]: remaining,
    }))

    toast.success(`${reviewerName} removed`)
  }

  function triggerRemove(journalId, assignmentId, reviewerName) {
    setConfirmData({ journalId, assignmentId, reviewerName })
    setConfirmOpen(true)
  }

  async function handleConfirmRemove() {
    if (!confirmData) return
    setConfirmLoading(true)
    await removeReviewer(confirmData.journalId, confirmData.assignmentId, confirmData.reviewerName)
    setConfirmLoading(false)
    setConfirmOpen(false)
    setConfirmData(null)
  }

  const filteredJournals = journals.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.profiles?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Assign Reviewers</h1>
          <p className="page-subtitle">Assign expert reviewers to journal submissions</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchAll} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Left: Journal list */}
          <div style={{ flex: '2', minWidth: '280px' }}>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input className="input input-icon-left" style={{ paddingLeft: '2.5rem' }}
                placeholder="Search journals…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="space-y-4">
              {filteredJournals.length === 0 && (
                <p className="text-sm text-muted">No pending journals found.</p>
              )}
              {filteredJournals.map(j => {
                const assigned = assignments[j.id] ?? []
                const isSelected = selected === j.id
                const isUnassigned = assigned.length === 0

                const cardStyle = {
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderWidth: (isSelected || isUnassigned) ? '2px' : '1px',
                  borderColor: isSelected ? 'var(--primary)' : (isUnassigned ? '#dc2626' : undefined),
                  background: isUnassigned ? '#fef2f2' : undefined,
                  boxShadow: isUnassigned ? '0 0 0 1px #dc2626' : undefined,
                }

                const isReworked = (j.resubmission_count ?? 0) > 0;

                // Override card style for rework papers
                if (isReworked && !isSelected) {
                  cardStyle.borderColor = '#7c3aed'
                  cardStyle.borderWidth = '2px'
                  cardStyle.background = '#faf5ff'
                  cardStyle.boxShadow = '0 0 0 1px #c4b5fd'
                }
                if (isSelected && isReworked) {
                  cardStyle.background = '#f5f3ff'
                }

                return (
                  <div key={j.id}
                    className="card"
                    style={cardStyle}
                    onClick={() => setSelected(isSelected ? null : j.id)}
                  >
                    <div className="card-content" style={{ paddingTop: '1.25rem' }}>
                      {/* ── Card Header ── */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <p className="font-medium text-sm" style={{ margin: 0 }}>{j.title}</p>
                            {isReworked && (
                              <span style={{
                                background: '#ede9fe', color: '#6d28d9',
                                border: '1px solid #ddd6fe', borderRadius: '9999px',
                                padding: '0.1rem 0.5rem', fontSize: '0.65rem', fontWeight: 700
                              }}>
                                Reworked Paper (Revision #{j.resubmission_count})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>by {j.profiles?.name ?? '—'} &middot; {new Date(j.created_at).toLocaleDateString()}</p>
                          {isReworked && j.prev_reviewer_comments && (
                            <p className="text-xs" style={{ marginTop: '0.35rem', color: '#6d28d9', fontStyle: 'italic', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              “{j.prev_reviewer_comments.slice(0, 120)}{j.prev_reviewer_comments.length > 120 ? '…' : ''}”
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {isSelected && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected</span>
                          )}
                          {isSelected ? <ChevronUp size={16} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} />}
                        </div>
                      </div>

                      {/* ── Assignment Badges ── */}
                      {assigned.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          {assigned.map(a => (
                            <span key={a.id} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {a.profiles?.name ?? '—'}
                              <button
                                style={{ marginLeft: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, color: 'var(--muted-foreground)' }}
                                onClick={(e) => { e.stopPropagation(); triggerRemove(j.id, a.id, a.profiles?.name) }}
                                title={`Remove ${a.profiles?.name}`}
                              >×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      {assigned.length === 0 && <p className="text-xs text-muted">No reviewers assigned yet</p>}

                      {/* ── Expandable Detail Panel (shows when selected) ── */}
                      {isSelected && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid var(--border)',
                            display: 'flex', flexDirection: 'column', gap: '0.875rem'
                          }}
                        >
                          {/* Abstract */}
                          <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: '0.4rem' }}>Abstract</p>
                            {j.abstract?.startsWith('http') ? (
                              <a href={j.abstract} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                Download Abstract PDF
                              </a>
                            ) : (
                              <p style={{ fontSize: '0.8375rem', lineHeight: 1.65, color: 'var(--foreground)', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>{j.abstract || '—'}</p>
                            )}
                          </div>

                          {/* Keywords */}
                          {j.keywords && (
                            <div>
                              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: '0.4rem' }}>Keywords</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {j.keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                                  <span key={k} className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{k}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Full Manuscript Download */}
                          {j.file_url && (
                            <div>
                              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: '0.4rem' }}>Full Manuscript</p>
                              <button
                                onClick={async () => {
                                  const { getSignedUrl } = await import('../../lib/storage')
                                  const url = await getSignedUrl(supabase, j.file_url)
                                  if (url) window.open(url, '_blank', 'noreferrer')
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'inline-flex', gap: '0.4rem' }}
                              >
                                Open Full Paper PDF
                              </button>
                            </div>
                          )}

                          {/* Previous round details for rework papers */}
                          {isReworked && (j.prev_admin_comments || j.prev_reviewer_comments) && (
                            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '0.5rem', padding: '0.75rem' }}>
                              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7c3aed', marginBottom: '0.6rem' }}>Previous Round Feedback</p>
                              {j.prev_admin_comments && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <p style={{ fontSize: '0.7rem', color: '#6d28d9', fontWeight: 600, marginBottom: '0.2rem' }}>Editor's Comments</p>
                                  <p style={{ fontSize: '0.8rem', color: '#4c1d95', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{j.prev_admin_comments}</p>
                                </div>
                              )}
                              {j.prev_reviewer_comments && (
                                <div>
                                  <p style={{ fontSize: '0.7rem', color: '#6d28d9', fontWeight: 600, marginBottom: '0.2rem' }}>Reviewer's Comments</p>
                                  <p style={{ fontSize: '0.8rem', color: '#4c1d95', lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>{j.prev_reviewer_comments}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Reviewer panel */}
          <div style={{ flex: '1', minWidth: '240px' }}>
            <div className="card" style={{ position: 'sticky', top: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title">Available Reviewers</div>
                <div className="card-description">
                  {selected ? 'Click to assign to selected journal' : 'Select a journal first'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                  Approved reviewers only
                </div>
              </div>
              <div className="card-content space-y-4">
                {reviewers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--muted-foreground)' }}>
                    <p className="text-sm">No approved reviewers yet.</p>
                    <p className="text-xs" style={{ marginTop: '0.25rem' }}>Go to <strong>Manage Users</strong> to approve pending reviewers.</p>
                  </div>
                )}
                {reviewers.map(r => {
                  const selectedJournal = selected ? journals.find(j => j.id === selected) : null
                  const alreadyAssigned = selected && (assignments[selected] ?? []).some(a => a.reviewer_id === r.id)
                  const isFull = selected && (assignments[selected] ?? []).length >= 1
                  const isPrevReviewer = selectedJournal && selectedJournal.prev_reviewer_name && selectedJournal.prev_reviewer_name === r.name

                  return (
                    <div key={r.id} style={{ 
                      border: isPrevReviewer ? '2px solid #7c3aed' : '1px solid var(--border)', 
                      background: isPrevReviewer ? '#faf5ff' : 'transparent',
                      borderRadius: 'var(--radius)', 
                      padding: '0.875rem' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p className="font-medium text-sm" style={{ color: isPrevReviewer ? '#6d28d9' : 'inherit' }}>{r.name}</p>
                          {isPrevReviewer && <span style={{ display: 'inline-block', marginTop: '0.25rem', fontSize: '0.65rem', background: '#ede9fe', color: '#6d28d9', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>Previous Reviewer</span>}
                        </div>
                        <button
                          className={`btn btn-sm ${alreadyAssigned ? 'btn-outline' : 'btn-primary'}`}
                          disabled={!selected || alreadyAssigned || (!alreadyAssigned && isFull)}
                          onClick={() => selected && assignReviewer(selected, r)}
                        >
                          {alreadyAssigned ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Reviewer?"
        message={`Are you sure you want to remove ${confirmData?.reviewerName ?? 'the reviewer'} from this journal?`}
        confirmText="Remove"
        loading={confirmLoading}
        type="danger"
      />
    </div>
  )
}
