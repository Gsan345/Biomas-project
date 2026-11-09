import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Leaf, Loader } from 'lucide-react';
import api from '../../lib/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(r => { setStatus('success'); setMessage(r.data.message); })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.error ?? 'Verification failed.'); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BioChain</span>
        </div>
        {status === 'loading' && <><Loader size={48} color="var(--text-accent)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} /><h2>Verifying email…</h2></>}
        {status === 'success' && <><CheckCircle size={48} color="var(--text-accent)" style={{ margin: '0 auto 1rem' }} /><h2 style={{ marginBottom: '0.5rem' }}>Email Verified!</h2><p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p><Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>Go to Login</Link></>}
        {status === 'error' && <><XCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} /><h2 style={{ marginBottom: '0.5rem' }}>Verification Failed</h2><p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p><Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>Back to Login</Link></>}
      </div>
    </div>
  );
}
