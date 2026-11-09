import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, Leaf, ListPlus, ShoppingBag, TrendingUp, Calendar, Map, Package } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line
} from 'recharts';

const navItems = [
  { label: 'Overview', path: '/seller', icon: <LayoutDashboard size={18} /> },
  { label: 'My Sources', path: '/seller/sources', icon: <Leaf size={18} /> },
  { label: 'My Listings', path: '/seller/listings', icon: <ListPlus size={18} /> },
  { label: 'Incoming Orders', path: '/seller/orders', icon: <ShoppingBag size={18} /> },
  { label: 'Price Insights', path: '/seller/prices', icon: <TrendingUp size={18} /> },
  { label: 'Seasonal Calendar', path: '/seller/seasonal', icon: <Calendar size={18} /> },
  { label: 'Map', path: '/map', icon: <Map size={18} /> },
  { label: 'Marketplace', path: '/marketplace', icon: <Package size={18} /> },
];

interface DashData {
  activeListings: number;
  openOrders: number;
  revenueToDate: number;
  totalQtyThisMonth: number;
  avgPriceRsTon: number;
}

function OverviewPage() {
  const [dash, setDash] = useState<DashData | null>(null);
  const [seasonal, setSeasonal] = useState<Array<Record<string, unknown>>>([]);
  const [prices, setPrices] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/seller/dashboard'),
      api.get('/seller/seasonal'),
      api.get('/seller/price-insights'),
    ]).then(([d, s, p]) => {
      setDash(d.data.data);
      setSeasonal(s.data.data);
      setPrices(p.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Aggregate seasonal data by month
  const monthlyData = MONTHS_SHORT.map((m, i) => {
    const monthName = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][i];
    const monthItems = seasonal.filter((s: Record<string, unknown>) => s.month === monthName);
    return { month: m, availability: monthItems.reduce((sum: number, s: Record<string, unknown>) => sum + (s.availabilityTons as number || 0), 0) };
  });

  const priceChartData = prices.slice(0, 12).reverse().map((p: Record<string, unknown>) => ({
    date: new Date(p.date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    price: p.priceRsTon,
    type: p.biomassType,
  }));

  const statCards = [
    { label: 'Active Listings', value: dash?.activeListings ?? 0, suffix: '', color: '#22c55e', note: 'Visible to buyers' },
    { label: 'Open Orders', value: dash?.openOrders ?? 0, suffix: '', color: '#60a5fa', note: 'Awaiting action' },
    { label: 'Qty This Month', value: dash?.totalQtyThisMonth ?? 0, suffix: ' T', color: '#f59e0b', note: 'Tons available' },
    { label: 'Revenue to Date', value: `₹${((dash?.revenueToDate ?? 0) / 1000).toFixed(0)}K`, suffix: '', color: '#a78bfa', note: 'From closed orders' },
  ];

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
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
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit' }}>{s.value}{s.suffix}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Seasonal availability */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📅 Seasonal Availability (tons/month)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="availability" stroke="#22c55e" fill="rgba(34,197,94,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Price trend */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📈 Price Trend (₹/ton)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`₹${v}`, 'Price/ton']} />
              <Bar dataKey="price" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/seller/listings" className="btn btn-primary btn-sm"><ListPlus size={16} /> Create Listing</a>
          <a href="/seller/sources" className="btn btn-secondary btn-sm"><Leaf size={16} /> Add Source</a>
          <a href="/seller/orders" className="btn btn-secondary btn-sm"><ShoppingBag size={16} /> View Orders</a>
          <a href="/marketplace" className="btn btn-secondary btn-sm"><Package size={16} /> View Marketplace</a>
        </div>
      </div>
    </div>
  );
}

function SourcesPage() {
  const [industrial, setIndustrial] = useState<Record<string, unknown>[]>([]);
  const [agr, setAgr] = useState<Record<string, unknown>[]>([]);
  const [msw, setMsw] = useState<Record<string, unknown>[]>([]);
  const [activeTab, setActiveTab] = useState('industrial');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/seller/sources/industrial'),
      api.get('/seller/sources/agricultural'),
      api.get('/seller/sources/municipal'),
    ]).then(([i, a, m]) => {
      setIndustrial(i.data.data);
      setAgr(a.data.data);
      setMsw(m.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'industrial', label: 'Industrial', count: industrial.length },
    { key: 'agricultural', label: 'Agricultural', count: agr.length },
    { key: 'municipal', label: 'Municipal Waste', count: msw.length },
  ];

  const data = activeTab === 'industrial' ? industrial : activeTab === 'agricultural' ? agr : msw;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>My Biomass Sources</h2>
        <button className="btn btn-primary btn-sm"><ListPlus size={15} /> Add Source</button>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab-item${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label} <span className="badge badge-green" style={{ marginLeft: '0.375rem' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name / Industry</th>
                <th>Biomass Type</th>
                <th>District</th>
                <th>Qty/Month</th>
                <th>Price (₹/ton)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sources yet. Add your first source.</td></tr>
              ) : data.map((s: Record<string, unknown>) => (
                <tr key={s.id as string}>
                  <td><span className="badge badge-gray">{s.code as string}</span></td>
                  <td style={{ fontWeight: 500 }}>{(s.name || s.industryName || s.city) as string}</td>
                  <td>{s.biomassType as string}</td>
                  <td>{(s.district as string)?.replace(/_/g, ' ')}</td>
                  <td>{s.availableQtyTonsMonth as number} T</td>
                  <td>₹{(s.priceRsTon || s.currentPriceRsTon) as number}</td>
                  <td><span className={`badge ${s.operationalStatus === 'OPERATIONAL' ? 'badge-green' : s.operationalStatus === 'SEASONAL' ? 'badge-amber' : 'badge-red'}`}>{s.operationalStatus as string || 'ACTIVE'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ListingsPage() {
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/my-listings').then(r => setListings(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>My Listings</h2>
        <button className="btn btn-primary btn-sm"><ListPlus size={15} /> Create Listing</button>
      </div>
      {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {listings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', gridColumn: '1/-1' }}>
              <Leaf size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No listings yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create your first biomass listing to start receiving offers from buyers.</p>
              <button className="btn btn-primary"><ListPlus size={16} /> Create First Listing</button>
            </div>
          ) : listings.map((l: Record<string, unknown>) => (
            <div key={l.id as string} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{l.biomassType as string}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(l.district as string)?.replace(/_/g, ' ')} · {l.locationArea as string}</div>
                </div>
                <span className={`badge ${l.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}`}>{l.status as string}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Price</div><div style={{ fontWeight: 700, color: 'var(--text-accent)', fontSize: '1.1rem' }}>₹{l.priceRsTon as number}<span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ton</span></div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Quantity</div><div style={{ fontWeight: 600 }}>{l.quantityTonsMonth as number} T/mo</div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Moisture</div><div>{l.moisturePct != null ? String(l.moisturePct) : '—'}%</div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Quality</div><div><span className="badge badge-green">{l.qualityGrade as string}</span></div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/orders').then(r => setOrders(r.data.data)).finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    REQUESTED: 'badge-blue', NEGOTIATING: 'badge-amber', CONFIRMED: 'badge-green',
    IN_TRANSIT: 'badge-purple', DELIVERED: 'badge-green', PAID: 'badge-green',
    CLOSED: 'badge-gray', CANCELLED: 'badge-red',
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Incoming Orders</h2>
      {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Order ID</th><th>Buyer</th><th>Biomass</th><th>Qty (T)</th><th>Offered ₹/ton</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No orders yet.</td></tr>
              ) : orders.map((o: Record<string, unknown>) => (
                <tr key={o.id as string}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{(o.id as string).slice(-8)}</span></td>
                  <td>{((o.buyerUser as Record<string, unknown>)?.fullName as string) ?? '—'}</td>
                  <td>{((o.listing as Record<string, unknown>)?.biomassType as string)}</td>
                  <td>{o.quantityTons as number}</td>
                  <td>₹{o.offeredPriceRsTon as number}</td>
                  <td><span className={`badge ${statusColor[o.status as string] ?? 'badge-gray'}`}>{o.status as string}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt as string).toLocaleDateString('en-IN')}</td>
                  <td>{o.status === 'REQUESTED' && <div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-primary btn-sm">Accept</button><button className="btn btn-secondary btn-sm">Counter</button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Price Insights Page ───────────────────────────────────────────────────────
function PriceInsightsPage() {
  const [prices, setPrices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const biomassTypes = ['Rice Husk', 'Rice Straw', 'Tea Waste', 'Municipal Waste', 'Jute Waste'];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedType) params.set('biomassType', selectedType);
    api.get(`/seller/price-insights?${params}`)
      .then(r => setPrices(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedType]);

  const chartData = prices.slice(0, 20).reverse().map((p: Record<string, unknown>) => ({
    date: new Date(p.date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    price: p.priceRsTon,
    type: p.biomassType,
  }));

  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + (p.priceRsTon as number), 0) / prices.length) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices.map(p => p.priceRsTon as number)) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.priceRsTon as number)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Price Insights</h2>
        <select className="form-input form-select" style={{ width: 200 }} value={selectedType}
          onChange={e => setSelectedType(e.target.value)}>
          <option value="">All Biomass Types</option>
          {biomassTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Average Price', value: `₹${avgPrice.toLocaleString('en-IN')}`, suffix: '/ton', color: '#22c55e' },
          { label: 'Peak Price', value: `₹${maxPrice.toLocaleString('en-IN')}`, suffix: '/ton', color: '#ef4444' },
          { label: 'Low Price', value: `₹${minPrice.toLocaleString('en-IN')}`, suffix: '/ton', color: '#60a5fa' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.suffix}</div>
          </div>
        ))}
      </div>

      {/* Price trend chart */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📈 Price Trend (₹/ton)</h3>
        {loading ? <div className="skeleton" style={{ height: 260 }} /> : chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No price data for your district yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [`₹${v}/ton`, 'Price']} />
              <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Price table */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📋 Recent Price Records</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Biomass</th><th>Market</th><th>₹/ton</th><th>₹/quintal</th><th>Quality</th><th>Source</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><div className="skeleton" style={{ height: 20 }} /></td></tr> :
                prices.map((p: Record<string, unknown>) => (
                  <tr key={p.id as string}>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(p.date as string).toLocaleDateString('en-IN')}</td>
                    <td>{p.biomassType as string}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(p.market as string) || '—'}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--text-accent)' }}>₹{p.priceRsTon as number}</span></td>
                    <td>₹{p.priceRsQuintal as number}</td>
                    <td><span className={`badge ${p.qualityGrade === 'A' ? 'badge-green' : p.qualityGrade === 'B' ? 'badge-amber' : 'badge-red'}`}>Grade {p.qualityGrade as string}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(p.dataSource as string) || '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Seasonal Calendar Page ────────────────────────────────────────────────────
function SeasonalCalendarPage() {
  const [seasonal, setSeasonal] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/seasonal').then(r => setSeasonal(r.data.data)).finally(() => setLoading(false));
  }, []);

  const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Aggregate monthly totals
  const monthlyData = MONTHS_SHORT.map((m, i) => {
    const items = seasonal.filter((s: Record<string, unknown>) => s.month === MONTHS[i]);
    return { month: m, availability: items.reduce((sum, s) => sum + (s.availabilityTons as number || 0), 0) };
  });

  // Group by biomass type
  const types = [...new Set(seasonal.map((s: Record<string, unknown>) => s.biomassType as string))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem' }}>Seasonal Availability Calendar</h2>

      {/* Monthly area chart */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📅 12-Month Availability Overview (tons)</h3>
        {loading ? <div className="skeleton" style={{ height: 260 }} /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [`${typeof v === 'number' ? v.toLocaleString('en-IN') : v} tons`, 'Availability']} />
              <Area type="monotone" dataKey="availability" stroke="#22c55e" fill="url(#availGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-type breakdown */}
      {!loading && types.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🌿 By Biomass Type</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Biomass Type</th>
                  {MONTHS_SHORT.map(m => <th key={m} style={{ textAlign: 'center', fontSize: '0.72rem' }}>{m}</th>)}
                  <th>Annual Total</th>
                </tr>
              </thead>
              <tbody>
                {types.map((type: string) => {
                  const annual = MONTHS.reduce((sum, month) => {
                    const item = seasonal.find((s: Record<string, unknown>) => s.biomassType === type && s.month === month);
                    return sum + (item ? (item.availabilityTons as number) : 0);
                  }, 0);
                  return (
                    <tr key={type}>
                      <td style={{ fontWeight: 600 }}>{type}</td>
                      {MONTHS.map((month: string) => {
                        const item = seasonal.find((s: Record<string, unknown>) => s.biomassType === type && s.month === month);
                        const val = item ? (item.availabilityTons as number) : 0;
                        const opacity = annual > 0 ? 0.1 + (val / annual) * 0.7 : 0;
                        return (
                          <td key={month} style={{ textAlign: 'center', position: 'relative', padding: '0.5rem' }}>
                            <div style={{ background: val > 0 ? `rgba(34,197,94,${opacity})` : 'transparent', borderRadius: 4, padding: '0.2rem 0.4rem', fontSize: '0.78rem', fontWeight: val > 0 ? 600 : 400, color: val > 0 ? 'var(--text-accent)' : 'var(--text-muted)' }}>
                              {val > 0 ? val.toLocaleString('en-IN') : '—'}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{annual.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && types.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p>No seasonal data available for your district yet.</p>
        </div>
      )}
    </div>
  );
}

export default function SellerDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Seller Dashboard" role="SELLER">
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/prices" element={<PriceInsightsPage />} />
        <Route path="/seasonal" element={<SeasonalCalendarPage />} />
      </Routes>
    </DashboardLayout>
  );
}
