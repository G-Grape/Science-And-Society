import { useEffect, useState } from 'react'
import { Search, UserCheck, UserPlus, RefreshCw } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/ConfirmModal'

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

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [journalsRes, reviewersRes, assignmentsRes] = await Promise.all([
      supabase
        .from('journals')
        .select('id, title, category, created_at, profiles(name)')
        .in('status', ['submitted', 'under_review'])
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, name, role, status')
        .eq('role', 'reviewer')
        .eq('status', 'active'),  // Only admin-approved reviewers
      supabase
        .from('assignments')
        .select('id, journal_id, reviewer_id, profiles(name)'),
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

    const { data, error } = await supabase
      .from('assignments')
      .insert({ journal_id: journalId, reviewer_id: reviewer.id })
      .select('id, journal_id, reviewer_id, profiles(name)')
      .single()

    if (error) { toast.error('Failed to assign reviewer'); return }

    setAssignments(prev => ({
      ...prev,
      [journalId]: [...(prev[journalId] ?? []), data],
    }))

    // Also update journal status to under_review if it was submitted
    if (journal) {
      await supabase.from('journals').update({ status: 'under_review' }).eq('id', journalId)
      setJournals(prev => prev.filter(j => j.id !== journalId))
      if (selected === journalId) setSelected(null)
    }

    toast.success(`${reviewer.name} assigned successfully!`)
  }

  async function removeReviewer(journalId, assignmentId, reviewerName) {
    const { error } = await supabase.from('assignments').delete().eq('id', assignmentId)
    if (error) { toast.error('Failed to remove reviewer'); return }

    const remaining = (assignments[journalId] ?? []).filter(a => a.id !== assignmentId)
    setAssignments(prev => ({
      ...prev,
      [journalId]: remaining,
    }))

    // If no assignments remain, revert status back to 'submitted'
    if (remaining.length === 0) {
      await supabase.from('journals').update({ status: 'submitted' }).eq('id', journalId)
    }

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
          <RefreshCw size={14} /> Refresh
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
              <input className="input" style={{ paddingLeft: '2.25rem' }}
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

                return (
                  <div key={j.id}
                    className="card"
                    style={cardStyle}
                    onClick={() => setSelected(isSelected ? null : j.id)}
                  >
                    <div className="card-content" style={{ paddingTop: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <p className="font-medium text-sm">{j.title}</p>
                          <p className="text-xs text-muted">by {j.profiles?.name ?? '—'} · {j.category}</p>
                        </div>
                      </div>

                      {assigned.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {assigned.map(a => (
                            <span key={a.id} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <UserCheck size={12} /> {a.profiles?.name ?? '—'}
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
                  const alreadyAssigned = selected && (assignments[selected] ?? []).some(a => a.reviewer_id === r.id)
                  const isFull = selected && (assignments[selected] ?? []).length >= 1
                  return (
                    <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                        </div>
                        <button
                          className={`btn btn-sm ${alreadyAssigned ? 'btn-outline' : 'btn-primary'}`}
                          disabled={!selected || alreadyAssigned || (!alreadyAssigned && isFull)}
                          onClick={() => selected && assignReviewer(selected, r)}
                        >
                          <UserPlus size={13} /> {alreadyAssigned ? 'Assigned' : 'Assign'}
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
