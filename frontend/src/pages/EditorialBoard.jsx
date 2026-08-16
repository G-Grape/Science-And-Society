import { AnimatedSection, StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import { Card3D } from '../components/ui/Card3D'
import { GoldUnderline } from '../components/ui/GoldUnderline'
import { ElegantGridBackground } from '../components/ui/ElegantGridBackground'
import { motion } from 'framer-motion'

/* ── Data ─────────────────────────────────────────────────────────── */
const leadership = [
  { role: 'Patron', name: 'Mar George Madathikandathil', desc: 'Bishop Diocese of Kothamangalam' },
  { role: 'Managing Editor', name: 'Rev. Dr. Jestin K. Kuriakose', desc: 'Principal, Nirmala College, Muvattupuzha (Autonomous)' },
  { role: 'Chief Editor', name: 'Dr. Jyothish Kuthanapillil', desc: 'Dept. of Chemistry, Nirmala College, Muvattupuzha (Autonomous).' },
]

// Sections in the required display order
const sections = [
  {
    title: 'Advisory Board',
    members: [
      { name: 'Prof. V.N. Rajasekharan Pillai', desc: 'Former Vice Chancellor, IGNOU, New Delhi' },
      { name: 'Dr. Jancy James', desc: 'Former Vice Chancellor, Mahatma Gandhi University, Kottayam' },
      { name: 'Rev. Dr. Paul Parathazham', desc: 'Former Director, St. John’s MedicalSciences, Bangalore &Secretary, Higher Education, Diocese of Kothamangalam' },
      { name: 'Dr. Jose Paul', desc: 'Former Chairman,Mormugao Port Trust, Goa.' },
      { name: 'Prof. K. M. Balakrishna', desc: 'Chairman, Dept. of Physics, Mangalore University' },
      { name: 'Dr. George Thomas', desc: 'Rajeev Gandhi Center for Biotechnology, Trivandrum' },
      { name: 'Dr. A.P. Thomas', desc: 'School of Environmental Studies, MG University, Kottayam' },
      { name: 'Dr. K. Sasidharan', desc: 'Emeritus Scientist KFRI, Peechi, Kerala' },
      { name: 'Dr. P. A. Hassan', desc: 'Thermal and Interfacial Chemistry Section, BARC, Mumbai' },
      { name: 'Dr. Shaju Thomas', desc: 'Former HoD, Dept. of Zoology, Nirmala College, Muvattupuzha (Autonomous)' },
    ],
  },
  {
    title: 'Consulting Editors',
    members: [
      { name: 'Dr. K. Sreekumar', desc: 'Dept. of Applied Chemistry, CUSAT, Cochin' },
      { name: 'Prof. K. L. Sebastian', desc: 'Indian Institute of Science, Bangalore' },
      { name: 'Prof. Thomas Mathew', desc: 'University of Maryland, Washington, USA' },
      { name: 'Prof. R. Radhakrishna', desc: 'Indira Gandhi Institute for Development Research, Mumbai' },
      { name: 'Dr. Dominic Jacob E.', desc: 'Dept. of Chemistry (Retd), Nirmala College, Muvattupuzha (Autonomous)' },
      { name: 'Dr. Johny Scaria', desc: 'Dept. of Statistics, Nirmala College, Muvattupuzha (Autonomous)' },
      { name: 'Dr. Thomas Varghese', desc: 'Dept. of Physics, Nirmala College, Muvattupuzha (Autonomous)' },
    ],
  },
  {
    title: 'Associate Editors',
    members: [
      { name: 'Dr. Liji George', desc: 'Dept. of Economics, Nirmala College, Muvattupuzha (Autonomous)' },
      { name: 'Dr. Anu Jossy Joy', desc: 'Dept. of Commerce, Nirmala College, Muvattupuzha (Autonomous).' },
      { name: 'Dr. Sumod George', desc: 'Dept. of Chemistry, Nirmala College, Muvattupuzha (Autonomous).' },
    ],
  },
  {
    title: 'Technical Editors',
    members: [
      { name: 'Dr. Vinod K. V.', desc: 'Dept. of Zoology, Nirmala College, Muvattupuzha (Autonomous)' },
      { name: 'Dr. Manu C. Scaria', desc: 'Dept. of English, Nirmala College, Muvattupuzha (Autonomous)' },
      { name: 'Dr. Rajeshkumar B.', desc: 'Dept. of Physics, Nirmala College, Muvattupuzha (Autonomous)' },
    ],
  },
  {
    title: 'Associate Managing Editors',
    members: [
      { name: 'Rev. Fr. Paul Kalathur', desc: 'Bursar, Nirmala College,Muvattupuzha (Autonomous).' },
      { name: 'Dr. Sony Kuriakose', desc: 'Vice Principal, Dept. ofCommerce, Nirmala College,Muvattupuzha (Autonomous).' },
      { name: 'Mr. Shaimon Joseph', desc: 'Dept. of Economics, Nirmala College, Muvattupuzha (Autonomous).' },
    ],
  },
]

/* ── Page ─────────────────────────────────────────────────────────── */
export default function EditorialBoard() {
  return (
    <>
      <ElegantGridBackground />

      {/* Hero banner */}
      <section style={{
        position: 'relative',
        padding: '5rem 0 3.5rem',
        background: 'linear-gradient(135deg, rgba(29,78,216,0.06) 0%, rgba(201,168,76,0.04) 100%)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedSection direction="up">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <span className="section-label">Leadership</span>
              <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Editorial Board</h1>
              <GoldUnderline width={160} />
              <p className="section-desc" style={{ maxWidth: '600px', margin: '1.25rem auto 0' }}>
                Meet the distinguished academicians and experts guiding <em>Science and Society</em>.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Leadership trio ─────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0 2rem', background: 'var(--background)' }}>
        <div className="container">
          <AnimatedSection direction="up" delay={0.05}>
            <p style={{
              fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--gold)', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center',
            }}>
              Core Leadership
            </p>
          </AnimatedSection>

          <StaggerContainer style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {leadership.map((member) => (
              <StaggerItem key={member.name}>
                <Card3D intensity={5}>
                  <div className="card" style={{
                    height: '100%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', textAlign: 'center',
                    padding: '2.25rem 2rem',
                    background: 'var(--card)',
                    border: '1px solid rgba(29,78,216,0.1)',
                    boxShadow: '0 12px 40px -10px rgba(29,78,216,0.08)',
                  }}>
                    {/* elegant badge */}
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {member.role}
                    </p>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem', color: '#1e3a8a', fontWeight: 800 }}>
                      {member.name}
                    </h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{member.desc}</p>
                  </div>
                </Card3D>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Remaining sections ──────────────────────────────────────── */}
      <section style={{ padding: '1rem 0 5rem', background: 'var(--background)' }}>
        <div className="container" style={{ display: 'grid', gap: '3.5rem' }}>
          {sections.map((section, si) => (
            <AnimatedSection key={section.title} direction="up" delay={si * 0.07}>
              {/* Section heading — sticky */}
              <div style={{
                position: 'sticky',
                top: '68px',
                zIndex: 10,
                display: 'flex', alignItems: 'center', gap: '1rem',
                marginBottom: '1.75rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid',
                borderImage: 'linear-gradient(90deg, var(--primary), var(--gold)) 1',
                background: 'var(--background)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}>
                <h2 style={{
                  fontSize: '1.25rem', fontWeight: 700,
                  color: 'var(--foreground)', margin: 0,
                }}>
                  {section.title}
                </h2>
              </div>

              <StaggerContainer style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}>
                {section.members.map((member, mi) => (
                  <StaggerItem key={member.name}>
                    <motion.div
                      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                      transition={{ duration: 0.18 }}
                      className="card"
                      style={{
                        padding: '1.35rem 1.5rem',
                        height: '100%',
                        borderLeft: '3px solid',
                        borderLeftColor: si % 2 === 0 ? 'var(--primary)' : 'var(--gold)',
                        borderRadius: '0.75rem',
                      }}
                    >
                      <h5 style={{
                        fontSize: '1rem', marginBottom: '0.3rem',
                        fontWeight: 600, color: 'var(--foreground)',
                      }}>
                        {member.name}
                      </h5>
                      <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                        {member.desc}
                      </p>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </AnimatedSection>
          ))}
        </div>
      </section>
    </>
  )
}
