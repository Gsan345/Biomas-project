import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

const BIOMASS_TYPES = ['Rice Husk', 'Rice Straw', 'Mustard Straw', 'Tea Waste', 'Municipal Waste', 'Jute Waste'];
const DISTRICTS = ['SONITPUR', 'KAMRUP'];
const COLORS = ['#22c55e', '#60a5fa', '#f59e0b', '#a78bfa', '#ef4444', '#10b981'];

export default function PriceTrendsPage() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, unknown>[]>([]);
  const [seasonal, setSeasonal] = useState<Record<string, unknown>[]>([]);
  const [selectedBiomass, setSelectedBiomass] = useState('Rice Husk');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedBiomass) params.set('biomassType', selectedBiomass);
    if (selectedDistrict) params.set('district', selectedDistrict);
    Promise.all([
      api.get(`/prices/trends?${params}`),
      api.get(`/prices/seasonal?${params}`),
    ]).then(([p, s]) => {
      setPrices(p.data.data);
      setSeasonal(s.data.data);
    }).finally(() => setLoading(false));
  }, [selectedBiomass, selectedDistrict]);


  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlySeasons = MONTHS_SHORT.map((m, i) => {
    const monthName = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][i];
    const item = seasonal.find((s: Record<string, unknown>) => s.month === monthName);
    return { month: m, availability: item ? item.availabilityTons as number : 0, moisture: item ? item.moisturePct as number : 0 };
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>📈 Price Trends & Seasonal Availability</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical prices, district comparison and seasonal availability heatmap</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Filters */}
        <div className="card">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label className="form-label">Biomass Type</label>
              <select className="form-input form-select" value={selectedBiomass} onChange={e => setSelectedBiomass(e.target.value)}>
                <option value="">All types</option>
                {BIOMASS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label className="form-label">District</label>
              <select className="form-input form-select" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}>
                <option value="">Both districts</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Price trend chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>
            💰 Price Trend — {selectedBiomass || 'All Biomass Types'} (₹/ton)
          </h3>
          {loading ? <div className="skeleton" style={{ height: 280 }} /> : prices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No price data for selected filters.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={prices.map((p: Record<string, unknown>) => ({
                date: new Date(p.date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                [p.district as string]: p.priceRsTon,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`₹${v}/ton`]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {DISTRICTS.map((d, i) => (
                  <Line key={d} type="monotone" dataKey={d} stroke={COLORS[i]} strokeWidth={2} dot={false} name={d.replace(/_/g, ' ')} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Seasonal availability */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>
            📅 Seasonal Availability — {selectedBiomass || 'All Types'} (tons/month)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlySeasons}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="availability" fill="#22c55e" radius={[4,4,0,0]} name="Availability (T)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prices table */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📋 Price Records</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Code</th><th>Date</th><th>Biomass</th><th>District</th><th>Market</th><th>₹/ton</th><th>₹/quintal</th><th>Quality</th><th>Source</th></tr></thead>
              <tbody>
                {prices.map((p: Record<string, unknown>) => (
                  <tr key={p.id as string}>
                    <td><span className="badge badge-gray">{p.code as string}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(p.date as string).toLocaleDateString('en-IN')}</td>
                    <td>{p.biomassType as string}</td>
                    <td>{(p.district as string)?.replace(/_/g, ' ')}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.market as string}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-accent)' }}>₹{p.priceRsTon as number}</td>
                    <td>₹{p.priceRsQuintal as number}</td>
                    <td><span className={`badge ${p.qualityGrade === 'A' ? 'badge-green' : p.qualityGrade === 'B' ? 'badge-amber' : 'badge-red'}`}>{p.qualityGrade as string}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.dataSource as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
