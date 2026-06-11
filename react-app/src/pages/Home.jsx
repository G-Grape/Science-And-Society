import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { FileText, LogIn, ArrowRight, Shield, Users, Clock, Award, Upload, Search, CheckCircle, BookOpen, Mail, Phone, MapPin, Send, Calendar, Globe, Type, Edit, FileCheck, Download } from 'lucide-react'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'

/* ── Animated Section wrapper ─────────────────────────────────────── */
function AnimatedSection({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const animClass = visible
    ? (direction === 'left' ? 'animate-slide-left' : direction === 'right' ? 'animate-slide-right' : 'animate-fade-up')
    : ''
  const style = { opacity: visible ? undefined : 0, transitionDelay: `${delay}ms` }

  return (
    <div ref={ref} className={`${animClass} ${className}`} style={style}>
      {children}
    </div>
  )
}

/* ── Issues Sidebar ───────────────────────────────────────────────── */
function IssuesSidebar() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIssues() {
      // Query the published_issues view (bypasses RLS — safe for public home page)
      const { data, error } = await supabase
        .from('published_issues')
        .select('id, title, abstract, created_at, author_name')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) console.error('IssuesSidebar fetch error:', error)
      setIssues(data ?? [])
      setLoading(false)
    }
    fetchIssues()
  }, [])

  return (
    <div className="card" style={{ height: '100%', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} className="text-primary" /> All Issues
        </h2>
        <p className="card-description">Recently published journals</p>
      </div>
      <div className="card-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {loading ? (
          <div className="spinner" style={{ margin: '2rem auto' }} />
        ) : issues.length === 0 ? (
          <p className="text-muted text-sm text-center">No published issues yet.</p>
        ) : (
          <div className="space-y-4">
            {issues.map(issue => (
              <div key={issue.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 className="font-semibold text-sm" style={{ marginBottom: '0.25rem', lineHeight: 1.3 }}>
                  {issue.title}
                </h3>
                <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
                  by {issue.author_name || 'Unknown Author'} • {new Date(issue.created_at).toLocaleDateString()}
                </p>
                {issue.abstract?.startsWith('http') ? (
                  <a href={issue.abstract} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', marginTop: '0.25rem' }}>
                    <Download size={14} /> Download Abstract
                  </a>
                ) : (
                  <p className="text-xs text-muted" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {issue.abstract}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Link to="/published-issues" className="btn btn-outline" style={{ width: '100%' }}>
          View More Issues <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

/* ── Hero Section ─────────────────────────────────────────────────── */
function HeroSection() {
  const stats = [
    { number: '500+', label: 'Journals Submitted' },
    { number: '50+', label: 'Expert Reviewers' },
    { number: '95%', label: 'Satisfaction Rate' },
  ]

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
      </div>

      <div className="container hero-content" style={{ width: '100%' }}>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr', alignItems: 'center' }} className="md-grid-cols-3">

          {/* Left Column: Hero Text (takes up more space on wide screens) */}
          <div style={{ gridColumn: '1 / -1' }} className="md-col-span-2">
            <div style={{ maxWidth: '48rem', textAlign: 'left' }}>
              <AnimatedSection delay={0}>
                <div className="hero-badge">Science and Society</div>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <h1 className="hero-title" style={{ textAlign: 'left' }}>Journal Submission &amp; Review System</h1>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <p className="hero-desc" style={{ marginLeft: 0, textAlign: 'left' }}>
                  A comprehensive academic platform for submitting, reviewing, and publishing research journals.
                  Streamlined multi-level review process ensuring quality and integrity.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={300}>
                <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    <FileText size={20} />
                    Submit Journal
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    <LogIn size={20} />
                    Login
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            <div className="hero-stats" style={{ justifyContent: 'flex-start', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              {stats.map((s, i) => (
                <AnimatedSection key={s.label} delay={400 + i * 100} direction="up">
                  <div className="hero-stat-card">
                    <div className="hero-stat-num">{s.number}</div>
                    <div className="hero-stat-label">{s.label}</div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Right Column: Issues Sidebar */}
          <div className="md-col-span-1" style={{ marginTop: '2rem' }}>
            <AnimatedSection delay={600} direction="left">
              <IssuesSidebar />
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── About Section ────────────────────────────────────────────────── */
const features = [
  { icon: Shield, title: 'Secure Submission', description: 'End-to-end encrypted submissions ensuring your research remains confidential throughout the review process.' },
  { icon: Users, title: 'Expert Reviewers', description: 'Multi-level review by domain experts ensuring thorough evaluation and constructive feedback.' },
  { icon: Clock, title: 'Fast Turnaround', description: 'Streamlined workflow with real-time status tracking for quick and transparent review cycles.' },
  { icon: Award, title: 'Quality Standards', description: 'Rigorous academic standards maintained through our comprehensive peer review process.' },
]

function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <AnimatedSection>
          <div className="section-header">
            <h2 className="section-title">About Science and Society</h2>
            <p className="section-desc">
              Science and Society is an academic initiative by Nirmala College, providing a robust platform
              for scholarly journal submissions and multi-level peer reviews.
            </p>
          </div>
        </AnimatedSection>

        <div className="features-grid">
          {features.map((f, i) => (
            <AnimatedSection key={f.title} delay={i * 100} direction="up" className="feature-wrapper">
              <div className="feature-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="feature-icon"><f.icon size={24} /></div>
                <h3>{f.title}</h3>
                <p style={{ flex: 1 }}>{f.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Workflow Section ─────────────────────────────────────────────── */
const steps = [
  { icon: Upload, step: '01', title: 'Submit Journal', description: 'Upload your research paper with all required details and supporting documents.' },
  { icon: Search, step: '02', title: 'Initial Review', description: 'Your submission undergoes initial screening for format compliance and relevance.' },
  { icon: CheckCircle, step: '03', title: 'Peer Review', description: 'Expert reviewers evaluate your work through multiple levels of assessment.' },
  { icon: BookOpen, step: '04', title: 'Publication', description: 'Approved journals are published and indexed in our academic repository.' },
]

function WorkflowSection() {
  return (
    <section id="workflow" className="workflow-section">
      <div className="container">
        <AnimatedSection>
          <div className="section-header">
            <h2 className="section-title">Submission Workflow</h2>
            <p className="section-desc">Our streamlined process ensures efficient handling of your research from submission to publication.</p>
          </div>
        </AnimatedSection>

        <div className="workflow-steps">
          <div className="workflow-line" />
          {steps.map((step, i) => (
            <div key={step.title} className="workflow-step">
              <div className="workflow-step-grid">
                {i % 2 !== 0 && <div className="desktop-spacer" />}
                <AnimatedSection delay={i * 150} direction={i % 2 === 0 ? 'right' : 'left'}>
                  <div className="workflow-card">
                    <div className="workflow-step-header">
                      <div className="workflow-step-icon"><step.icon size={24} /></div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary)' }}>Step {step.step}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </AnimatedSection>
                {i % 2 === 0 && <div className="desktop-spacer" />}
              </div>
              <div className="workflow-dot">
                <div className="workflow-dot-inner">
                  <div className="workflow-dot-ping" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Contact Section ──────────────────────────────────────────────── */
function ContactSection() {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success("Message sent! We'll get back to you soon.")
    setSubmitting(false)
    e.target.reset()
  }

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <AnimatedSection>
          <div className="section-header">
            <h2 className="section-title">Contact Us</h2>
            <p className="section-desc">Have questions about the submission process? Get in touch with our team.</p>
          </div>
        </AnimatedSection>

        <div className="contact-grid">
          <AnimatedSection delay={100} direction="left">
            <div className="card" style={{ border: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <div className="card-header">
                <div className="card-title">Send us a message</div>
                <div className="card-description">Fill out the form and we will respond within 24–48 hours.</div>
              </div>
              <div className="card-content">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid-2">
                    <div className="form-group">
                      <label htmlFor="c-name">Name</label>
                      <input id="c-name" className="input" placeholder="Your name" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-email">Email</label>
                      <input id="c-email" type="email" className="input" placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="c-subject">Subject</label>
                    <input id="c-subject" className="input" placeholder="How can we help?" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="c-message">Message</label>
                    <textarea id="c-message" className="textarea" placeholder="Your message..." rows={4} required />
                  </div>
                  <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                    {submitting ? 'Sending…' : <><Send size={16} /> Send Message</>}
                  </button>
                </form>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200} direction="right">
            <div className="contact-info-cards">
              {[
                { icon: Mail, title: 'Email', lines: ['contact@gyansamavesh.edu', 'support@gyansamavesh.edu'] },
                { icon: Phone, title: 'Phone', lines: ['+91 123 456 7890', 'Mon–Fri, 9:00 AM – 5:00 PM IST'] },
                { icon: MapPin, title: 'Address', lines: ['Nirmala College', 'Muvattupuzha, Kerala, India'] },
              ].map(({ icon: Icon, title, lines }) => (
                <div key={title} className="contact-info-card">
                  <div className="contact-info-icon"><Icon size={20} /></div>
                  <div>
                    <h3>{title}</h3>
                    {lines.map(l => <p key={l}>{l}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ── Guidelines Section ───────────────────────────────────────────── */
const guidelineCards = [
  {
    icon: Calendar,
    title: '1. PUBLICATION SCHEME',
    content: (
      <p className="text-muted text-sm" style={{ lineHeight: '1.6' }}>
        The journal is published as a biannual publication in January–June and July–December issues. The Editor reserves the right to accept/reject manuscripts and to edit articles wherever considered necessary. Manuscripts become the property of the publisher.
      </p>
    )
  },
  {
    icon: Globe,
    title: '2. LANGUAGE',
    content: <p className="text-muted text-sm" style={{ lineHeight: '1.6' }}>English</p>
  },
  {
    icon: BookOpen,
    title: '3. SUBJECTS COVERED',
    content: (
      <p className="text-muted text-sm" style={{ lineHeight: '1.6' }}>
        Science, Humanities, Commerce, Management, Literature, Education, Engineering and Ethics.
      </p>
    )
  },
  {
    icon: FileText,
    title: '4. SUBMISSION GUIDELINES',
    content: (
      <ul className="text-muted text-sm" style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: '1.6' }}>
        <li><strong>General Articles:</strong> Articles should not exceed 5000 words.</li>
        <li><strong>Review Articles:</strong> Articles are expected to survey and discuss recent developments in a field. Word limit: 4000–5000 words. Limit of cited references: up to 50.</li>
        <li><strong>Research Articles:</strong> Should present results of original research. Size: 2500–3500 words.</li>
        <li><strong>Reports:</strong> Factual reports on topics of interest such as conferences, seminars, etc. (less than 2000 words).</li>
        <li><strong>News and Views:</strong> Brief announcements, comments on new developments in any discipline (less than 750 words, max 2 display items).</li>
        <li><strong>Resource Reviews:</strong> New books, websites, CDs, etc.</li>
        <li><strong>Letters to the Editor:</strong> May be limited to less than 500 words.</li>
      </ul>
    )
  },
  {
    icon: Users,
    title: '5. INSTRUCTIONS TO THE AUTHORS',
    content: (
      <div className="text-muted text-sm space-y-2" style={{ lineHeight: '1.6' }}>
        <p>Articles will be peer-reviewed.</p>
        <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>The title page should include:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
          <li>Title of the paper</li>
          <li>Author’s name, designation, and postal address with PIN code</li>
          <li>Email address</li>
          <li><strong>Abstract:</strong> Not more than 250 words</li>
          <li><strong>Keywords:</strong> 3–5 words</li>
        </ul>
        <p>Manuscripts should follow a proper structure.</p>
        <p>Pages should be serially numbered.</p>
      </div>
    )
  },
  {
    icon: Type,
    title: 'FORMATTING INSTRUCTIONS',
    content: (
      <div className="text-muted text-sm space-y-2" style={{ lineHeight: '1.6' }}>
        <p>Manuscripts should be submitted along with a soft copy.</p>
        <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Text formatting:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>Use normal plain font (e.g., Times New Roman, 12 pt)</li>
          <li>Divide your article into clearly defined sections and subsections.</li>
        </ul>
      </div>
    )
  },
  {
    icon: Edit,
    title: 'REFERENCES',
    content: (
      <div className="text-muted text-sm space-y-2" style={{ lineHeight: '1.6' }}>
        <p>All references should be cited in the text using numbers in square brackets.</p>
        <p>References should be listed consecutively.</p>
        <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Example formats:</p>
        <div style={{ backgroundColor: 'var(--bg)', padding: '0.75rem', borderRadius: '0.25rem', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
          <p><strong>Journal:</strong> Author, Journal name, Volume, Page, Year</p>
          <p><strong>Book:</strong> Author, Book name, Publisher, Place, Year, Pages</p>
        </div>
      </div>
    )
  },
  {
    icon: CheckCircle,
    title: 'ACKNOWLEDGEMENT',
    content: (
      <p className="text-muted text-sm" style={{ lineHeight: '1.6' }}>Should be placed at the end of the paper before references.</p>
    )
  },
  {
    icon: FileCheck,
    title: 'TABLES AND FIGURES',
    content: (
      <ul className="text-muted text-sm" style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', lineHeight: '1.6' }}>
        <li>Should be embedded in the text.</li>
        <li>Must have proper numbering and captions.</li>
        <li>High-quality images (preferably 300 dpi resolution).</li>
        <li>Grayscale mode is preferred.</li>
      </ul>
    )
  },
  {
    icon: Search,
    title: 'FOOTNOTES',
    content: <p className="text-muted text-sm" style={{ lineHeight: '1.6' }}>Should be minimal.</p>
  },
  {
    icon: Upload,
    title: 'SUBMISSION',
    content: (
      <ul className="text-muted text-sm" style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', lineHeight: '1.6' }}>
        <li>Submit original manuscript in MS Word format.</li>
        <li>Proof corrections must be returned within one week.</li>
      </ul>
    )
  }
]

function GuidelinesSection() {
  return (
    <section id="guidelines" className="about-section bg-card">
      <div className="container">
        <AnimatedSection>
          <div className="section-header">
            <h2 className="section-title">Guidelines for Contributors</h2>
            <p className="section-desc">Please review these essential guidelines to ensure a smooth submission and peer-review process.</p>
          </div>
        </AnimatedSection>

        <div className="guidelines-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          {guidelineCards.map((g, i) => (
            <AnimatedSection key={g.title} delay={i * 100} direction="up">
              <div className="card guideline-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', height: '100%' }}>
                <div className="feature-icon" style={{ flexShrink: 0, width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(21, 128, 61, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius)' }}>
                  <g.icon size={24} />
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--foreground)', fontSize: '1.125rem', fontWeight: '600' }}>{g.title}</h3>
                  {g.content}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Home Page ────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <HeroSection />
      <GuidelinesSection />
      <AboutSection />
      <WorkflowSection />
      <ContactSection />
    </>
  )
}
