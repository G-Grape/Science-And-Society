import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, CheckCircle, Clock } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'

export default function AdminCompileIssue() {
  const navigate = useNavigate()
  const toast = useToast()

  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPapers, setSelectedPapers] = useState(new Set())

  const [form, setForm] = useState({
    volume_number: '',
    issue_number: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    // Fetch papers in "Future Issue" pool
    const { data: futurePapers, error: papersError } = await supabase
      .from('journals')
      .select('id, title, abstract, created_at, profiles(name, id), author_name')
      .eq('status', 'published')
      .is('volume_number', null)
      .order('created_at', { ascending: true })

    if (papersError) {
      toast.error('Failed to load future papers')
    } else {
      setPapers(futurePapers || [])
    }

    // Fetch current issue defaults to help admin know what to increment to
    const { data: currIssue } = await supabase
      .from('current_issue')
      .select('volume_number, issue_number, volume_topic, timeline, last_submission_date')
      .single()

    if (currIssue) {
      setForm({
        volume_number: currIssue.volume_number || '',
        issue_number: currIssue.issue_number || ''
      })
    }
    setLoading(false)
  }

  const togglePaper = (id) => {
    const next = new Set(selectedPapers)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPapers(next)
  }

  const toggleAll = () => {
    if (selectedPapers.size === papers.length) {
      setSelectedPapers(new Set())
    } else {
      setSelectedPapers(new Set(papers.map(p => p.id)))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.volume_number.trim()) return toast.error('Please enter the volume number')
    if (!form.issue_number.trim()) return toast.error('Please enter the issue number')
    if (selectedPapers.size === 0) return toast.error('Please select at least one paper for this issue')

    setSubmitting(true)
    try {
      // 1. Update all selected papers with the new volume and issue number
      const selectedIds = Array.from(selectedPapers)
      const { error: updateError } = await supabase
        .from('journals')
        .update({
          volume_number: form.volume_number.trim(),
          issue_number: form.issue_number.trim(),
          published_at: new Date().toISOString()
        })
        .in('id', selectedIds)

      if (updateError) throw updateError

      // 2. Update the current_issue table so the frontend knows this is the new "Current Issue"
      const { error: issueError } = await supabase
        .from('current_issue')
        .update({
          volume_number: form.volume_number.trim(),
          issue_number: form.issue_number.trim()
        })
        .eq('id', 1)

      if (issueError) {
        // Attempt manual rollback to prevent inconsistent state
        await supabase
          .from('journals')
          .update({ volume_number: null, issue_number: null })
          .in('id', selectedIds)
        throw new Error(`Failed to update current issue state. Papers have been rolled back to prevent inconsistencies.`)
      }

      toast.success(`Successfully published Volume ${form.volume_number} Issue ${form.issue_number}`)

      // Reset selections and refresh list
      setSelectedPapers(new Set())
      fetchData()

    } catch (err) {
      toast.error(err.message || 'Creating issue failed. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Create New Issue</h1>
        <p className="page-subtitle">Group accepted "Articles in Press" papers into a specific Volume and Issue for publication.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_350px]" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px' }}>

        {/* Left Col: Papers Selection */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">Articles in Press</div>
              <div className="card-description">Select papers to include in this print run.</div>
            </div>
            {papers.length > 0 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={toggleAll}>
                {selectedPapers.size === papers.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
            ) : papers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted-foreground)' }}>
                <p style={{ fontStyle: 'italic', fontSize: '0.95rem' }}>No accepted papers waiting to be published.</p>
                <p className="text-xs" style={{ marginTop: '0.5rem' }}>Accepted papers will appear here once published from the Accepted Papers page.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map(paper => (
                  <label key={paper.id} style={{
                    display: 'flex', gap: '1rem', padding: '1rem',
                    background: selectedPapers.has(paper.id) ? 'var(--primary-light)' : 'var(--muted)',
                    border: `1px solid ${selectedPapers.has(paper.id) ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedPapers.has(paper.id)}
                      onChange={() => togglePaper(paper.id)}
                      style={{ marginTop: '0.25rem', width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{paper.title}</h4>
                      <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
                        By {paper.profiles?.name || paper.author_name || '—'}
                      </p>
                      <p className="text-xs text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {paper.abstract}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Create Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <div className="card-title">Issue Details</div>
            <div className="card-description">This will automatically become the new "Current Issue".</div>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label>Volume Number <span style={{}}>*</span></label>
                <input className="input" placeholder="e.g. Volume 2" value={form.volume_number} onChange={e => setForm(p => ({ ...p, volume_number: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Issue Number <span style={{}}>*</span></label>
                <input className="input" placeholder="e.g. Issue 1" value={form.issue_number} onChange={e => setForm(p => ({ ...p, issue_number: e.target.value }))} required />
              </div>

              <div style={{ paddingTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting || selectedPapers.size === 0}>
                  {submitting ? <><div className="spinner-sm" /> Creating…</> : <><Layers size={16} /> Create Issue ({selectedPapers.size})</>}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
