import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div className="card animate-fade-in" style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Leaf size={20} color="white" /></div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BioChain</span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Reset your password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter your email and we'll send a reset link</p>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <Mail size={48} color="var(--text-accent)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Check your console</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>In dev mode, the reset link is logged to the server console. Check your email in production.</p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem' }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <Link to="/login" style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
