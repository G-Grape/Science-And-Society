import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--background)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glowing effects */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
        filter: 'blur(60px)', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%', width: '30vw', height: '30vw',
        background: 'radial-gradient(circle, rgba(0,0,0,0.4) 0%, transparent 70%)',
        filter: 'blur(60px)', zIndex: 0
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          padding: '3rem 2rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '2rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(201, 168, 76, 0.1)',
            marginBottom: '1.5rem',
            border: '1px solid rgba(201, 168, 76, 0.3)'
          }}
        >
          <FileQuestion size={40} color="var(--gold)" />
        </motion.div>
        
        <h1 style={{ 
          fontSize: '4rem', 
          margin: '0 0 0.5rem', 
          fontFamily: 'var(--font-serif)',
          color: 'var(--foreground)',
          lineHeight: 1
        }}>404</h1>
        
        <h2 style={{ 
          fontSize: '1.5rem', 
          margin: '0 0 1rem', 
          fontWeight: 500,
          color: 'var(--foreground)'
        }}>Page Not Found</h2>
        
        <p style={{ 
          color: 'var(--muted-foreground)', 
          lineHeight: 1.6,
          marginBottom: '2rem',
          fontSize: '1.05rem'
        }}>
          The page you are looking for doesn't exist or has been moved. 
          Let's get you back to the right path.
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => window.history.back()}
            className="btn btn-outline"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
            Go Back
          </button>
          
          <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <Home size={18} style={{ marginRight: '0.5rem' }} />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
