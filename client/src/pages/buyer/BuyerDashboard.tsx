import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, Search, Calculator, FileText, BarChart3, Package, Map, ShoppingCart, Plus, X, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

const navItems = [
  { label: 'Overview', path: '/buyer', icon: <LayoutDashboard size={18} /> },
  { label: 'Marketplace', path: '/buyer/marketplace', icon: <Search size={18} /> },
  { label: 'My Requirements', path: '/buyer/requirements', icon: <FileText size={18} /> },
  { label: 'Landed Cost Calc', path: '/buyer/calculator', icon: <Calculator size={18} /> },
  { label: 'My Orders', path: '/buyer/orders', icon: <ShoppingCart size={18} /> },
  { label: 'Supply Gap', path: '/buyer/gap', icon: <BarChart3 size={18} /> },
  { label: 'Map', path: '/map', icon: <Map size={18} /> },
  { label: 'Marketplace', path: '/marketplace', icon: <Package size={18} /> },
];

interface DashData {
  openRequirements: number;
  pendingDeliveries: number;
  totalMatched: number;
  avgLandedCostRsTon: number;
}

function BuyerOverview() {
  const [dash, setDash] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buyer/dashboard').then(r => setDash(r.data.data)).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Open Requirements', value: dash?.openRequirements ?? 0, color: '#60a5fa', note: 'Active procurement needs' },
    { label: 'Pending Deliveries', value: dash?.pendingDeliveries ?? 0, color: '#f59e0b', note: 'In transit or confirmed' },
    { label: 'Total Matched', value: dash?.totalMatched ?? 0, color: '#22c55e', note: 'Successfully supplied' },
    { label: 'Avg Landed Cost', value: `₹${Math.round(dash?.avgLandedCostRsTon ?? 0)}`, color: '#a78bfa', note: 'Per ton all-in' },
  ];

  // Mock supply vs demand chart data
  const gapData = ['Jan','Feb','Mar','Apr','May','Jun'].map(m => ({
    month: m,
    required: Math.floor(100 + Math.random() * 50),
    supplied: Math.floor(60 + Math.random() * 60),
  }));

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📊 Supply vs Demand Gap (TPD)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="required" fill="#60a5fa" radius={[4,4,0,0]} name="Required" />
              <Bar dataKey="supplied" fill="#22c55e" radius={[4,4,0,0]} name="Supplied" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>💰 Landed Cost Trend (₹/ton)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={gapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="required" stroke="#a78bfa" strokeWidth={2} dot={false} name="Landed Cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/buyer/marketplace" className="btn btn-primary btn-sm"><Search size={16} /> Browse Marketplace</a>
          <a href="/buyer/requirements" className="btn btn-secondary btn-sm"><FileText size={16} /> Post Requirement</a>
          <a href="/buyer/calculator" className="btn btn-secondary btn-sm"><Calculator size={16} /> Landed Cost Calculator</a>
          <a href="/buyer/orders" className="btn btn-secondary btn-sm"><ShoppingCart size={16} /> View Orders</a>
        </div>
      </div>
    </div>
  );
}

function BuyerMarketplace() {
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ biomassType: '', district: '', maxPrice: '', maxMoisture: '' });

  const fetchListings = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    api.get(`/buyer/marketplace?${params}`).then(r => setListings(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const biomassTypes = ['Rice Husk', 'Rice Straw', 'Mustard Straw', 'Tea Waste', 'Municipal Waste', 'Jute Waste'];

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Marketplace</h2>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Biomass Type</label>
            <select className="form-input form-select" value={filters.biomassType} onChange={e => setFilters(f => ({ ...f, biomassType: e.target.value }))}>
              <option value="">All types</option>
              {biomassTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">District</label>
            <select className="form-input form-select" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}>
              <option value="">All districts</option>
              <option value="SONITPUR">Sonitpur</option>
              <option value="KAMRUP">Kamrup</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Max Price (₹/ton)</label>
            <input type="number" className="form-input" placeholder="e.g. 1500" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Max Moisture %</label>
            <input type="number" className="form-input" placeholder="e.g. 25" value={filters.maxMoisture} onChange={e => setFilters(f => ({ ...f, maxMoisture: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={fetchListings} style={{ alignSelf: 'flex-end' }}>
            <Search size={16} /> Search
          </button>
        </div>
      </div>

      {/* Listings grid */}
      {loading ? <div className="skeleton" style={{ height: 300 }} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {listings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', gridColumn: '1/-1' }}>
              <Search size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3>No listings found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters.</p>
            </div>
          ) : listings.map((l: Record<string, unknown>) => (
            <div key={l.id as string} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{l.biomassType as string}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {(l.district as string)?.replace(/_/g, ' ')} · {(l.sellerUser as Record<string, unknown>)?.fullName as string}
                  </div>
                </div>
                <span className="badge badge-green"><span className="badge badge-green">{l.qualityGrade as string}</span></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>PRICE</div><div style={{ fontWeight: 800, color: 'var(--text-accent)', fontSize: '1.2rem' }}>₹{l.priceRsTon as number}<span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ton</span></div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>QTY</div><div style={{ fontWeight: 600 }}>{l.quantityTonsMonth as number} T/mo</div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>MOISTURE</div><div>{l.moisturePct != null ? String(l.moisturePct) : '—'}%</div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DELIVERY</div><div style={{ fontSize: '0.8rem' }}>{(l.deliveryOption as string)?.replace(/_/g, ' ')}</div></div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Make Offer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LandedCostCalc() {
  const [form, setForm] = useState({ listingId: '', distanceKm: 185, fuelCostRsKm: 8.5, vehicleLoadTons: 10, tollChargesRs: 280, storageCostRsTonDay: 15, storageDays: 2, handlingCostRsTon: 120 });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!form.listingId) { return; }
    setLoading(true);
    try {
      const r = await api.post('/buyer/landed-cost', form);
      setResult(r.data.data);
    } catch { }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Landed Cost Calculator</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Input Parameters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'listingId', label: 'Listing ID', placeholder: 'listing-seed-001' },
              { key: 'distanceKm', label: 'Distance (km)', type: 'number' },
              { key: 'fuelCostRsKm', label: 'Fuel Cost (₹/km)', type: 'number' },
              { key: 'vehicleLoadTons', label: 'Vehicle Load (tons)', type: 'number' },
              { key: 'tollChargesRs', label: 'Toll Charges (₹)', type: 'number' },
              { key: 'storageCostRsTonDay', label: 'Storage Cost (₹/ton/day)', type: 'number' },
              { key: 'storageDays', label: 'Storage Days', type: 'number' },
              { key: 'handlingCostRsTon', label: 'Handling Cost (₹/ton)', type: 'number' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input type={f.type ?? 'text'} className="form-input" value={(form as Record<string, unknown>)[f.key] as string} placeholder={f.placeholder}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))} />
              </div>
            ))}
            <button className="btn btn-primary" onClick={calculate} disabled={loading}>
              {loading ? 'Calculating…' : 'Calculate Landed Cost'}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Result Breakdown</h3>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Base Price', value: result.basePrice as number, color: 'var(--text-primary)' },
                { label: 'Transport Cost', value: result.transportCostRsTon as number, color: '#60a5fa' },
                { label: 'Storage Cost', value: result.storageCostRsTon as number, color: '#f59e0b' },
                { label: 'Handling Cost', value: result.handlingCostRsTon as number, color: '#a78bfa' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: r.color }}>₹{r.value?.toFixed(2)}/ton</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(34,197,94,0.1)', borderRadius: 10, marginTop: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total Landed Cost</span>
                <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-accent)', fontFamily: 'Outfit' }}>₹{(result.totalLandedCostRsTon as number)?.toFixed(2)}<span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/ton</span></span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Calculator size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Enter parameters and click Calculate to see the landed cost breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuyerOrders() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buyer/orders').then(r => setOrders(r.data.data)).finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    REQUESTED: 'badge-blue', NEGOTIATING: 'badge-amber', CONFIRMED: 'badge-green',
    IN_TRANSIT: 'badge-purple', DELIVERED: 'badge-green', PAID: 'badge-green',
    CLOSED: 'badge-gray', CANCELLED: 'badge-red',
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>My Orders</h2>
      <div className="table-container">
        <table>
          <thead><tr><th>Order</th><th>Seller</th><th>Biomass</th><th>Qty</th><th>Offered ₹</th><th>Landed ₹</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No orders yet. Browse the marketplace to make offers.</td></tr>
            ) : orders.map((o: Record<string, unknown>) => (
              <tr key={o.id as string}>
                <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{(o.id as string).slice(-8)}</span></td>
                <td>{(((o.listing as Record<string, unknown>)?.sellerUser as Record<string, unknown>)?.fullName as string) ?? '—'}</td>
                <td>{((o.listing as Record<string, unknown>)?.biomassType as string)}</td>
                <td>{o.quantityTons as number} T</td>
                <td>₹{o.offeredPriceRsTon as number}</td>
                <td>{o.landedCostRsTon ? `₹${(o.landedCostRsTon as number).toFixed(0)}` : '—'}</td>
                <td><span className={`badge ${statusColor[o.status as string] ?? 'badge-gray'}`}>{o.status as string}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt as string).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Requirements Page ──────────────────────────────────────────────────────────────
const DISTRICTS = ['SONITPUR','KAMRUP','KAMRUP_METRO','BISWANATH','NAGAON','GOALPARA','BARPETA','NALBARI','JORHAT','DIBRUGARH'];
const BIOMASS_TYPES = ['Rice Husk','Rice Straw','Mustard Straw','Tea Waste','Municipal Waste','Jute Waste','Bagasse','Coconut Shell'];

const defaultReqForm = {
  biomassType: 'Rice Husk',
  quantityTonsMonth: 100,
  maxPriceRsTon: '',
  maxMoisturePct: '',
  maxAshPct: '',
  deliveryDistrict: 'SONITPUR',
  deliveryLocationArea: '',
  transactionType: 'SPOT',
  description: '',
};

function RequirementsPage() {
  const [reqs, setReqs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof defaultReqForm>(defaultReqForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchReqs = () => {
    setLoading(true);
    api.get('/buyer/requirements').then(r => setReqs(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchReqs(); }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/buyer/requirements', {
        ...form,
        quantityTonsMonth: Number(form.quantityTonsMonth),
        maxPriceRsTon: form.maxPriceRsTon ? Number(form.maxPriceRsTon) : undefined,
        maxMoisturePct: form.maxMoisturePct ? Number(form.maxMoisturePct) : undefined,
        maxAshPct: form.maxAshPct ? Number(form.maxAshPct) : undefined,
      });
      toast.success('Requirement posted!');
      setShowForm(false);
      setForm(defaultReqForm);
      fetchReqs();
    } catch {
      toast.error('Failed to post requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/buyer/requirements/${id}`);
      toast.success('Requirement removed');
      setReqs(prev => prev.filter((r: Record<string, unknown>) => r.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem' }}>My Requirements</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Post Requirement</>}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>New Requirement</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Biomass Type *</label>
              <select className="form-input form-select" value={form.biomassType} onChange={e => setForm(f => ({ ...f, biomassType: e.target.value }))}>
                {BIOMASS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity (T/month) *</label>
              <input type="number" className="form-input" value={form.quantityTonsMonth}
                onChange={e => setForm(f => ({ ...f, quantityTonsMonth: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Price (₹/ton)</label>
              <input type="number" className="form-input" placeholder="No ceiling" value={form.maxPriceRsTon}
                onChange={e => setForm(f => ({ ...f, maxPriceRsTon: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Moisture %</label>
              <input type="number" className="form-input" placeholder="e.g. 25" value={form.maxMoisturePct}
                onChange={e => setForm(f => ({ ...f, maxMoisturePct: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery District *</label>
              <select className="form-input form-select" value={form.deliveryDistrict} onChange={e => setForm(f => ({ ...f, deliveryDistrict: e.target.value }))}>
                {DISTRICTS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <select className="form-input form-select" value={form.transactionType} onChange={e => setForm(f => ({ ...f, transactionType: e.target.value }))}>
                <option value="SPOT">Spot</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="Quality preferences, certifications required, etc."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Requirement'}
          </button>
        </div>
      )}

      {/* Requirements list */}
      {loading ? <div className="skeleton" style={{ height: 200 }} /> : reqs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No requirements yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Post a requirement to let sellers know what you need.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Post First Requirement</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {reqs.map((req: Record<string, unknown>) => (
            <div key={req.id as string} className="card" style={{ position: 'relative' }}>
              <button onClick={() => handleDelete(req.id as string)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <Trash2 size={15} />
              </button>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{req.biomassType as string}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', fontSize: '0.85rem', marginBottom: '0.875rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Quantity</span><br /><strong>{req.quantityTonsMonth as number} T/mo</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Max Price</span><br /><strong>{req.maxPriceRsTon ? `₹${req.maxPriceRsTon}` : 'Open'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Delivery District</span><br /><strong>{(req.deliveryDistrict as string).replace(/_/g, ' ')}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Type</span><br /><span className="badge badge-blue">{req.transactionType as string}</span></div>
              </div>
              {Boolean(req.description) && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{String(req.description)}</p>}
              <span className={`badge ${req.isActive ? 'badge-green' : 'badge-gray'}`} style={{ marginTop: '0.625rem' }}>
                {req.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Supply Gap Page ───────────────────────────────────────────────────────────────
const PIE_COLORS = ['#22c55e', '#ef4444'];

function SupplyGapPage() {
  const [gap, setGap] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buyer/supply-gap').then(r => setGap(r.data.data)).finally(() => setLoading(false));
  }, []);

  const required = gap ? (gap.totalRequiredTonsMonth as number) : 0;
  const matched = gap ? (gap.totalMatchedTons as number) : 0;
  const gapVal = gap ? (gap.gapTons as number) : 0;
  const facilities = gap ? (gap.facilities as Record<string, unknown>[]) : [];

  const pieData = [
    { name: 'Matched Supply', value: matched },
    { name: 'Supply Gap', value: gapVal },
  ];

  const fulfillmentPct = required > 0 ? ((matched / required) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem' }}>Supply-Demand Gap Analysis</h2>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="stat-card">
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Required</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'Outfit' }}>{required.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>tons/month</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Matched</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', fontFamily: 'Outfit' }}>{matched.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>tons secured</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Gap</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: gapVal > 0 ? '#ef4444' : '#22c55e', fontFamily: 'Outfit' }}>{gapVal.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{gapVal > 0 ? 'tons unfulfilled' : 'Fully covered ✅'}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Fulfillment</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: Number(fulfillmentPct) >= 80 ? '#22c55e' : '#f59e0b', fontFamily: 'Outfit' }}>{fulfillmentPct}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of requirements met</div>
            </div>
          </div>

          {/* Progress bar */}
          {required > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <span>Supply fulfillment progress</span>
                <span style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{fulfillmentPct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, Number(fulfillmentPct))}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Matched: {matched} T</span>
                <span>Required: {required} T/month</span>
              </div>
            </div>
          )}

          {/* Pie chart */}
          {required > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Supply vs Gap</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [`${Number(v).toLocaleString('en-IN')} T`]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Facilities */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>My Processing Facilities</h3>
                {facilities.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No processing facilities registered yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {facilities.map((f: Record<string, unknown>) => (
                      <div key={f.id as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.name as string}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.facilityType as string} · {(f.district as string).replace(/_/g, ' ')}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{f.installedCapacityTPD as number} TPD</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Capacity</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {required === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <BarChart3 size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No requirements posted</h3>
              <p style={{ color: 'var(--text-muted)' }}>Post requirements first to see your supply-demand gap analysis.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BuyerDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Buyer Dashboard" role="BUYER">
      <Routes>
        <Route path="/" element={<BuyerOverview />} />
        <Route path="/marketplace" element={<BuyerMarketplace />} />
        <Route path="/calculator" element={<LandedCostCalc />} />
        <Route path="/orders" element={<BuyerOrders />} />
        <Route path="/requirements" element={<RequirementsPage />} />
        <Route path="/gap" element={<SupplyGapPage />} />
      </Routes>
    </DashboardLayout>
  );
}
