import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const categories = [
  'Communication', 'Full Paper', 'Review',
]

export default function UploadJournal() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [abstractFile, setAbstractFile] = useState(null)
  const [abstractDrag, setAbstractDrag] = useState(false)
  const [form, setForm] = useState({ title: '', category: '', keywords: '' })

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped?.type === 'application/pdf') setFile(dropped)
    else toast.error('Please upload a PDF file')
  }, [toast])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected?.type === 'application/pdf') setFile(selected)
    else toast.error('Please upload a PDF file')
  }

  const handleAbstractDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setAbstractDrag(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleAbstractDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setAbstractDrag(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped?.type === 'application/pdf') setAbstractFile(dropped)
    else toast.error('Please upload a PDF file')
  }, [toast])

  const handleAbstractFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected?.type === 'application/pdf') setAbstractFile(selected)
    else toast.error('Please upload a PDF file')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { toast.error('Please upload a journal file'); return }
    if (!abstractFile) { toast.error('Please upload an abstract PDF'); return }
    if (!form.category) { toast.error('Please select a category'); return }
    if (!user) { toast.error('You must be logged in'); return }

    setSubmitting(true)
    try {
      // 1. Upload journal PDF to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('journals')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      // 2. Get the public URL for journal
      const { data: urlData } = supabase.storage
        .from('journals')
        .getPublicUrl(fileName)

      // 3. Upload abstract PDF to Supabase Storage
      const abstractExt = abstractFile.name.split('.').pop()
      const abstractFileName = `${user.id}/abstract_${Date.now()}.${abstractExt}`

      const { error: abstractUploadError } = await supabase.storage
        .from('journals')
        .upload(abstractFileName, abstractFile, { cacheControl: '3600', upsert: false })

      if (abstractUploadError) throw abstractUploadError

      // 4. Get the public URL for abstract
      const { data: abstractUrlData } = supabase.storage
        .from('journals')
        .getPublicUrl(abstractFileName)

      // 5. Insert journal record into DB
      const { error: insertError } = await supabase.from('journals').insert({
        student_id: user.id,
        title: form.title,
        abstract: abstractUrlData.publicUrl,
        category: form.category,
        keywords: form.keywords,
        file_url: urlData.publicUrl,
        status: 'submitted',
        review_level: 0,
      })

      if (insertError) throw insertError

      toast.success('Journal submitted successfully!')
      navigate('/student/journals')
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Upload Journal</h1>
        <p className="page-subtitle">Submit your research paper for review</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Journal Details</div>
          <div className="card-description">Please fill in all the required information about your journal submission.</div>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="form-group">
              <label htmlFor="title">Title <span style={{ color: 'var(--destructive)' }}>*</span></label>
              <input id="title" className="input" placeholder="Enter the title of your journal"
                value={form.title} onChange={set('title')} required />
            </div>

            <div className="form-group">
              <label>Abstract (PDF) <span style={{ color: 'var(--destructive)' }}>*</span></label>
              {!abstractFile ? (
                <div
                  className={`dropzone${abstractDrag ? ' active' : ''}`}
                  onDragEnter={handleAbstractDrag} onDragLeave={handleAbstractDrag}
                  onDragOver={handleAbstractDrag} onDrop={handleAbstractDrop}
                  style={{ borderColor: 'var(--input)' }}
                >
                  <div className="dropzone-icon"><FileText size={32} /></div>
                  <p className="dropzone-text"><strong>Click to upload</strong> or drag and drop your abstract</p>
                  <p className="dropzone-hint">PDF only (max 5 MB)</p>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleAbstractFileChange} />
                </div>
              ) : (
                <div className="file-preview">
                  <div className="file-preview-info">
                    <div className="file-preview-icon"><FileText size={20} /></div>
                    <div>
                      <p className="file-preview-name">{abstractFile.name}</p>
                      <p className="file-preview-size">{(abstractFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => setAbstractFile(null)} aria-label="Remove abstract file">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="category">Category <span style={{ color: 'var(--destructive)' }}>*</span></label>
                <select id="category" className="select" value={form.category} onChange={set('category')}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="keywords">Keywords <span style={{ color: 'var(--destructive)' }}>*</span></label>
                <input id="keywords" className="input" placeholder="e.g., machine learning, healthcare, AI"
                  value={form.keywords} onChange={set('keywords')} required />
              </div>
            </div>

            <div className="form-group">
              <label>Upload Journal File <span style={{ color: 'var(--destructive)' }}>*</span></label>
              {!file ? (
                <div
                  className={`dropzone${dragActive ? ' active' : ''}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag}
                  onDragOver={handleDrag} onDrop={handleDrop}
                >
                  <div className="dropzone-icon"><Upload size={40} /></div>
                  <p className="dropzone-text"><strong>Click to upload</strong> or drag and drop</p>
                  <p className="dropzone-hint">PDF only (max 10 MB)</p>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} />
                </div>
              ) : (
                <div className="file-preview">
                  <div className="file-preview-info">
                    <div className="file-preview-icon"><FileText size={20} /></div>
                    <div>
                      <p className="file-preview-name">{file.name}</p>
                      <p className="file-preview-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => setFile(null)} aria-label="Remove file">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="page-footer-actions">
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Uploading & Submitting…' : <><CheckCircle size={16} /> Submit Journal</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

