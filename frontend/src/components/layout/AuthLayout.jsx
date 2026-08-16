import { motion } from 'framer-motion';
import { ElegantGridBackground } from '../ui/ElegantGridBackground';
import { BackgroundElements } from '../ui/BackgroundElements';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuthLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="auth-layout" style={{ minHeight: '100vh', display: 'flex', width: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      
      {/* ── LEFT SIDE (Branding / Visuals) ── */}
      <div className="auth-left-panel" style={{
        flex: '0 0 45%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-section))',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        
        {/* Dynamic Backgrounds */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.8 }}>
          <ElegantGridBackground />
          <BackgroundElements />
        </div>

        {/* Branding Content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <img src="/assets/images/logo.png" alt="Science & Society Logo" style={{ height: '48px' }} />
            <span className="navbar-brand-title--elegant" style={{ fontSize: '1.5rem', marginBottom: 0, color: 'var(--foreground)' }}>Science & Society</span>
          </div>

          <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--foreground)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Advancing <br/>
            <span style={{ background: 'linear-gradient(90deg, var(--primary), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Human Knowledge</span>
          </h1>
          
          <p style={{ fontSize: '1.125rem', color: 'var(--muted-foreground)', lineHeight: 1.6, maxWidth: '400px' }}>
            A premium academic platform dedicated to rigorous peer review, seamless collaboration, and the global dissemination of impactful research.
          </p>
        </div>

        {/* Decorative corner glow */}
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.15, borderRadius: '50%' }} />
      </div>

      {/* ── RIGHT SIDE (Form Content) ── */}
      <div className="auth-right-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--background)'
      }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ x: -3 }}
          style={{ 
            position: 'absolute', top: '2rem', left: '2rem', zIndex: 100, 
            display: 'flex', alignItems: 'center', gap: '0.4rem', 
            background: 'var(--card)', backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--foreground)', 
            fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </motion.button>

        {/* Form Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          overflowY: 'auto'
        }}>
          <div style={{ width: '100%', maxWidth: '440px', marginTop: '2rem' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
