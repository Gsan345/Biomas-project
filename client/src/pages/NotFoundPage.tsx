import { Link } from 'react-router-dom';
import { Leaf, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      flexDirection: 'column',
      textAlign: 'center',
    }}>
      {/* Animated glow blob */}
      <div style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={24} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem', background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BioChain
          </span>
        </div>

        {/* 404 large text */}
        <div style={{
          fontSize: 'clamp(6rem, 15vw, 10rem)',
          fontWeight: 900,
          fontFamily: 'Outfit',
          background: 'linear-gradient(135deg, rgba(74,222,128,0.3), rgba(74,222,128,0.05))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: '1rem',
          letterSpacing: '-0.05em',
          filter: 'drop-shadow(0 0 40px rgba(34,197,94,0.2))',
        }}>
          404
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 400, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to the platform.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.history.back()} className="btn btn-secondary">
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link to="/" className="btn btn-primary">
            <Home size={16} /> Home
          </Link>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quick Links
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Login', path: '/login' },
              { label: 'Register', path: '/register' },
              { label: 'Marketplace', path: '/marketplace' },
              { label: 'Price Trends', path: '/prices' },
            ].map(link => (
              <Link key={link.path} to={link.path} style={{ color: 'var(--text-accent)', fontSize: '0.9rem', textDecoration: 'none', opacity: 0.85 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
