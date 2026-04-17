import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, Filter, ShieldAlert, X, Send, ArrowLeft, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function PublishedIssues() {
  const toast = useToast()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  
  // Modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState(null)
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchIssues()
  }, [])

  async function fetchIssues() {
    setLoading(true)
    const { data, error } = await supabase
      .from('published_issues')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) {
      toast.error('Failed to load issues.')
    } else {
      setIssues(data || [])
    }
    setLoading(false)
  }

  const openRequestModal = (journal) => {
    setSelectedJournal(journal)
    setRequestModalOpen(true)
  }

  const closeRequestModal = () => {
    setRequestModalOpen(false)
    setSelectedJournal(null)
    setRequesterName('')
    setRequesterEmail('')
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('paper_requests').insert({
      journal_id: selectedJournal.id,
      journal_title: selectedJournal.title,
      requester_name: requesterName,
      requester_email: requesterEmail
    })

    if (error) {
      toast.error('Failed to submit request. Please try again later.')
    } else {
      toast.success('Access request submitted! The administrative team will contact you.')
      closeRequestModal()
    }
    setSubmitting(false)
  }

  // Derived unique categories for the filter
  const categories = ['All', ...new Set(issues.map(i => i.category))]

  // Filter local data
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase()) || 
                          (issue.author_name || '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || issue.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container" style={{ padding: '4rem 1rem', minHeight: '80vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '2rem', left: '1rem' }}>
        <Link to="/" className="btn btn-ghost">
          <ArrowLeft size={20} /> Back to Home
        </Link>
      </div>

      <div style={{ textAlign: 'center', margin: '2rem auto 3rem auto', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>
          <BookOpen size={48} />
        </div>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Published Issues</h1>
        <p className="section-desc">
          Browse our catalogue of approved and published research papers. Full texts are restricted to maintain academic integrity—request access from our admin team to read full editions.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text" 
            className="input" 
            placeholder="Search by title or author..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem', height: '3rem', fontSize: '1rem' }} 
          />
        </div>
        <div style={{ minWidth: '200px', position: 'relative' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
          <select 
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ paddingLeft: '2.75rem', height: '3rem', fontSize: '1rem', width: '100%' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner" style={{ margin: '4rem auto' }} />
      ) : filteredIssues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p className="text-muted text-lg">No published issues match your search.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '2rem' }}>
          {filteredIssues.map((issue) => (
            <div key={issue.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h2 className="card-title" style={{ fontSize: '1.25rem', lineHeight: 1.3 }}>{issue.title}</h2>
                  <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{issue.category}</span>
                </div>
                <p className="text-sm text-muted">
                  By <span className="font-medium text-foreground">{issue.author_name || 'Anonymous Researcher'}</span> • {new Date(issue.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="card-content" style={{ flex: 1 }}>
                {issue.abstract?.startsWith('http') ? (
                  <a href={issue.abstract} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    <Download size={14} /> Download Abstract
                  </a>
                ) : (
                  <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
                    {issue.abstract}
                  </p>
                )}
              </div>
              <div className="card-footer" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-xs font-semibold text-warning" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <ShieldAlert size={14} /> Full Access Restricted
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => openRequestModal(issue)}>
                  Request Full Paper
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Access Modal */}
      {requestModalOpen && (
        <div className="sidebar-drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={closeRequestModal}>
          <div className="card" style={{ width: '100%', maxWidth: '28rem', position: 'relative', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <button className="btn btn-ghost btn-icon" onClick={closeRequestModal}>
                <X size={20} />
              </button>
            </div>
            <div className="card-header">
              <h3 className="card-title">Request Paper Access</h3>
              <p className="card-description">Admin approval required</p>
            </div>
            <div className="card-content">
              <div style={{ background: 'var(--muted)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <span className="font-semibold" style={{ display: 'block', marginBottom: '0.25rem' }}>Requesting:</span>
                "{selectedJournal?.title}"
              </div>
              
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="form-group">
                  <label>Your Name</label>
                  <input type="text" className="input" placeholder="e.g. Dr. John Doe" value={requesterName} onChange={e => setRequesterName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Your Email</label>
                  <input type="email" className="input" placeholder="john@university.edu" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value)} required />
                  <p className="text-xs text-muted mt-1">We will send the PDF file to this email.</p>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  {submitting ? 'Sending Request...' : <><Send size={16} /> Send Request to Admin</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
