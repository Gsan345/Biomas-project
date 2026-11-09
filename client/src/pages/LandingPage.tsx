import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, TrendingUp, MapPin, Zap, ChevronRight, ArrowRight, TreePine, Factory, Truck } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  registeredSellers: number;
  registeredBuyers: number;
  activeListings: number;
  totalBiomassAvailableTons: number;
  districtsActive: number;
}

export default function LandingPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  const features = [
    { icon: TreePine, title: 'Source Discovery', desc: 'Find agricultural, industrial and municipal biomass sources across Assam districts with real-time availability.' },
    { icon: TrendingUp, title: 'Live Pricing', desc: 'Track market prices, Rs/ton trends and seasonal factors for every biomass type and district.' },
    { icon: MapPin, title: 'Interactive Map', desc: 'Visualise all sources, collection points, processing facilities and transport routes on OpenStreetMap.' },
    { icon: Truck, title: 'Landed Cost Calculator', desc: 'Automatically calculate total landed cost including transport, storage and handling charges.' },
    { icon: Factory, title: 'Supply-Demand Matching', desc: 'Connect buyers and sellers directly with negotiated orders and real-time order tracking.' },
    { icon: Zap, title: 'Seasonal Planning', desc: 'Plan feedstock procurement with 12-month seasonal availability calendars and weather alerts.' },
  ];

  const statItems = [
    { label: 'Registered Sellers', value: stats?.registeredSellers ?? 0, suffix: '+' },
    { label: 'Registered Buyers', value: stats?.registeredBuyers ?? 0, suffix: '+' },
    { label: 'Active Listings', value: stats?.activeListings ?? 0, suffix: '' },
    { label: 'Biomass Available', value: Math.round((stats?.totalBiomassAvailableTons ?? 0) / 1000) * 1000, suffix: ' tons/mo' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BioChain</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <Link to={`/${user.role.toLowerCase()}`} className="btn btn-primary">
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/register" className="btn btn-primary">Register Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-gradient" style={{ padding: '6rem 1.5rem 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="badge badge-green animate-fade-in" style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', marginRight: 4 }} />
            Now live in Sonitpur & Kamrup districts, Assam
          </div>
          <h1 className="animate-fade-in" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            <span className="gradient-text">Biomass Supply Chain</span><br />
            Management for Assam
          </h1>
          <p className="animate-fade-in" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            BioChain connects biomass sellers (farmers, rice mills, tea estates) with buyers
            (WtE plants, brick kilns, pellet units) — managing sourcing, pricing, transport and orders in one platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-xl animate-fade-in">
              Start for Free <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-xl animate-fade-in">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div style={{ maxWidth: 1100, margin: '-2rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {statItems.map((s, i) => (
            <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s`, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-accent)', fontFamily: 'Outfit' }}>
                {s.value.toLocaleString()}{s.suffix}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: '5rem auto', padding: '0 1.5rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.75rem' }}>
          Everything you need for <span className="gradient-text">biomass trade</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem' }}>Built specifically for Assam's agricultural and industrial biomass ecosystem</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74, 222, 128, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <f.icon size={24} color="var(--text-accent)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 1100, margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(74, 222, 128, 0.05))' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to join the green economy?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Register as a Seller to list biomass, or as a Buyer to discover and procure sustainable feedstock.</p>
          <Link to="/register" className="btn btn-primary btn-xl">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Leaf size={16} color="var(--text-accent)" />
          <strong style={{ color: 'var(--text-accent)' }}>BioChain</strong>
        </div>
        <p>Biomass Supply Chain Management Platform — Assam, India</p>
        <p style={{ marginTop: '0.5rem' }}>© {new Date().getFullYear()} BioChain. Built for sustainable energy.</p>
      </footer>
    </div>
  );
}
