import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart2, ClipboardList, Truck, MapPin, Database, Activity, Plus, X, Upload } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Overview', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Users', path: '/admin/users', icon: <Users size={18} /> },
  { label: 'Survey Progress', path: '/admin/survey', icon: <ClipboardList size={18} /> },
  { label: 'Collection Points', path: '/admin/collection-points', icon: <MapPin size={18} /> },
  { label: 'Transport Routes', path: '/admin/routes', icon: <Truck size={18} /> },
  { label: 'Biomass Prices', path: '/admin/prices', icon: <BarChart2 size={18} /> },
  { label: 'Audit Logs', path: '/admin/audit', icon: <Activity size={18} /> },
  { label: 'Data Import', path: '/admin/import', icon: <Database size={18} /> },
];

function AdminOverview() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  const users = (stats?.users as Record<string, number>) ?? {};
  const listings = (stats?.listings as Record<string, number>) ?? {};
  const sources = (stats?.sources as Record<string, number>) ?? {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="stat-card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sellers</div><div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{users.SELLER ?? 0}</div></div>
            <div className="stat-card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Buyers</div><div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>{users.BUYER ?? 0}</div></div>
            <div className="stat-card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Listings</div><div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{listings.ACTIVE ?? 0}</div></div>
            <div className="stat-card"><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ind. Sources</div><div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>{sources.industrial ?? 0}</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Agricultural Sources', value: sources.agricultural ?? 0, icon: '🌾' },
              { label: 'Municipal Sites', value: sources.municipal ?? 0, icon: '🏙️' },
              { label: 'Collection Points', value: sources.collectionPoints ?? 0, icon: '📦' },
              { label: 'Processing Facilities', value: sources.facilities ?? 0, icon: '🏭' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.value as number}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/admin/users?search=${search}&limit=50`).then(r => setUsers(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleApprove = async (userId: string, isApproved: boolean) => {
    await api.patch(`/admin/users/${userId}/approve`);
    setUsers(prev => prev.map((u: Record<string, unknown>) => u.id === userId ? { ...u, isApproved: !isApproved } : u));
  };

  const toggleSuspend = async (userId: string, isSuspended: boolean) => {
    await api.patch(`/admin/users/${userId}/suspend`, { suspend: !isSuspended });
    setUsers(prev => prev.map((u: Record<string, unknown>) => u.id === userId ? { ...u, isSuspended: !isSuspended } : u));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>User Management</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input className="form-input" placeholder="Search users…" style={{ width: 220 }} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
          <button className="btn btn-primary btn-sm" onClick={fetchUsers}>Search</button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>District</th><th>Verified</th><th>Approved</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading users...</td></tr>
            ) : users.map((u: Record<string, unknown>) => (
              <tr key={u.id as string}>
                <td style={{ fontWeight: 500 }}>{u.fullName as string}</td>
                <td style={{ fontSize: '0.85rem' }}>{u.email as string}</td>
                <td><span className={`badge ${u.role === 'SELLER' ? 'badge-green' : u.role === 'BUYER' ? 'badge-blue' : 'badge-amber'}`}>{u.role as string}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{(u.district as string)?.replace(/_/g, ' ')}</td>
                <td><span className={`badge ${u.isEmailVerified ? 'badge-green' : 'badge-red'}`}>{u.isEmailVerified ? 'Yes' : 'No'}</span></td>
                <td><span className={`badge ${u.isApproved ? 'badge-green' : 'badge-amber'}`}>{u.isApproved ? 'Yes' : 'No'}</span></td>
                <td><span className={`badge ${u.isSuspended ? 'badge-red' : 'badge-green'}`}>{u.isSuspended ? 'Suspended' : 'Active'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!u.isApproved && <button className="btn btn-primary btn-sm" onClick={() => toggleApprove(u.id as string, u.isApproved as boolean)}>Approve</button>}
                    <button className={`btn btn-sm ${u.isSuspended ? 'btn-secondary' : 'btn-danger'}`} onClick={() => toggleSuspend(u.id as string, u.isSuspended as boolean)}>
                      {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SurveyProgress() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/survey-progress').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Survey Progress</h2>
      {loading ? <div className="skeleton" style={{ height: 300 }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.map((s: Record<string, unknown>) => (
            <div key={`${s.surveyType}-${s.district}`} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{(s.surveyType as string).replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(s.district as string).replace(/_/g, ' ')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{s.completedCount as number} / {s.targetCount as number}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending: {s.pendingCount as number}</div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${s.completionPct as number}%` }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem', textAlign: 'right' }}>{(s.completionPct as number).toFixed(1)}% complete</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditLogs() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs').then(r => setLogs(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Audit Logs</h2>
      <div className="table-container">
        <table>
          <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading audit logs...</td></tr>
            ) : logs.map((l: Record<string, unknown>) => (
              <tr key={l.id as string}>
                <td style={{ fontSize: '0.85rem' }}>{((l.user as Record<string, unknown>)?.email as string)}</td>
                <td><span className="badge badge-blue">{l.action as string}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{l.entityType as string}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.ipAddress as string || '—'}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(l.createdAt as string).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Collection Points Page ───────────────────────────────────────────────────────
const ADMIN_DISTRICTS = ['SONITPUR','KAMRUP','KAMRUP_METRO','BISWANATH','NAGAON','GOALPARA','BARPETA','NALBARI','JORHAT','DIBRUGARH'];

const defaultCPForm = {
  name: '', district: 'SONITPUR', locationArea: '', latitude: '', longitude: '',
  storageCapacityTons: '', loadingEquipment: false, weighbridge: false,
  electricity: true, water: true, security: false,
  contactPerson: '', contactMobile: '', storageCostRsTonDay: '', handlingCostRsTon: '',
};

function CollectionPointsPage() {
  const [points, setPoints] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof defaultCPForm>(defaultCPForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchPoints = () => {
    setLoading(true);
    api.get('/admin/collection-points').then(r => setPoints(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchPoints(); }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/admin/collection-points', {
        ...form,
        latitude: Number(form.latitude), longitude: Number(form.longitude),
        storageCapacityTons: form.storageCapacityTons ? Number(form.storageCapacityTons) : undefined,
        storageCostRsTonDay: form.storageCostRsTonDay ? Number(form.storageCostRsTonDay) : undefined,
        handlingCostRsTon: form.handlingCostRsTon ? Number(form.handlingCostRsTon) : undefined,
      });
      toast.success('Collection point added!');
      setShowForm(false);
      setForm(defaultCPForm);
      fetchPoints();
    } catch { toast.error('Failed to add'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Collection Points</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Collection Point</>}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>New Collection Point</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { key: 'name', label: 'Name *' },
              { key: 'locationArea', label: 'Location Area' },
              { key: 'latitude', label: 'Latitude *', type: 'number' },
              { key: 'longitude', label: 'Longitude *', type: 'number' },
              { key: 'storageCapacityTons', label: 'Storage Capacity (T)', type: 'number' },
              { key: 'storageCostRsTonDay', label: 'Storage Cost (₹/T/day)', type: 'number' },
              { key: 'handlingCostRsTon', label: 'Handling Cost (₹/T)', type: 'number' },
              { key: 'contactPerson', label: 'Contact Person' },
              { key: 'contactMobile', label: 'Mobile' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input type={f.type ?? 'text'} className="form-input" value={(form as Record<string, unknown>)[f.key] as string}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">District *</label>
              <select className="form-input form-select" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                {ADMIN_DISTRICTS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            {['loadingEquipment','weighbridge','electricity','water','security'].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                <input type="checkbox" id={k} checked={(form as Record<string, unknown>)[k] as boolean}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} />
                <label htmlFor={k} className="form-label" style={{ margin: 0 }}>
                  {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Collection Point'}
          </button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>District</th><th>Storage (T)</th><th>Weighbridge</th><th>Contact</th><th>Cost (₹/T/day)</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><div className="skeleton" style={{ height: 20 }} /></td></tr> :
              points.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No collection points yet.</td></tr> :
              points.map((cp: Record<string, unknown>) => (
                <tr key={cp.id as string}>
                  <td><span className="badge badge-gray">{cp.code as string}</span></td>
                  <td style={{ fontWeight: 500 }}>{cp.name as string}</td>
                  <td>{(cp.district as string)?.replace(/_/g, ' ')}</td>
                  <td>{cp.storageCapacityTons ? `${cp.storageCapacityTons} T` : '—'}</td>
                  <td><span className={`badge ${cp.weighbridge ? 'badge-green' : 'badge-gray'}`}>{cp.weighbridge ? 'Yes' : 'No'}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{(cp.contactPerson as string) || '—'}</td>
                  <td>{cp.storageCostRsTonDay ? `₹${cp.storageCostRsTonDay}` : '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Transport Routes Page ──────────────────────────────────────────────────
function TransportRoutesPage() {
  const [routes, setRoutes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromLocationName: '', toLocationName: '', distanceKm: '', fuelCostRsKm: '8', vehicleLoadTons: '10', tollChargesRs: '0', roadType: 'DISTRICT_ROAD', roadCondition: 'FAIR' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRoutes = () => {
    setLoading(true);
    api.get('/admin/transport-routes').then(r => setRoutes(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchRoutes(); }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/admin/transport-routes', {
        ...form,
        distanceKm: Number(form.distanceKm),
        fuelCostRsKm: Number(form.fuelCostRsKm),
        vehicleLoadTons: Number(form.vehicleLoadTons),
        tollChargesRs: Number(form.tollChargesRs),
      });
      toast.success('Route added!');
      setShowForm(false);
      fetchRoutes();
    } catch { toast.error('Failed to add route'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Transport Routes</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Route</>}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>New Transport Route</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { key: 'fromLocationName', label: 'From Location *' },
              { key: 'toLocationName', label: 'To Location *' },
              { key: 'distanceKm', label: 'Distance (km) *', type: 'number' },
              { key: 'fuelCostRsKm', label: 'Fuel Cost (₹/km)', type: 'number' },
              { key: 'vehicleLoadTons', label: 'Vehicle Load (T)', type: 'number' },
              { key: 'tollChargesRs', label: 'Toll Charges (₹)', type: 'number' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input type={f.type ?? 'text'} className="form-input" value={(form as Record<string, unknown>)[f.key] as string}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Road Type</label>
              <select className="form-input form-select" value={form.roadType} onChange={e => setForm(f => ({ ...f, roadType: e.target.value }))}>
                {['NATIONAL_HIGHWAY','STATE_HIGHWAY','DISTRICT_ROAD','VILLAGE_ROAD','UNPAVED'].map(rt => <option key={rt} value={rt}>{rt.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Road Condition</label>
              <select className="form-input form-select" value={form.roadCondition} onChange={e => setForm(f => ({ ...f, roadCondition: e.target.value }))}>
                {['GOOD','FAIR','POOR'].map(rc => <option key={rc} value={rc}>{rc}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Route'}
          </button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Code</th><th>From</th><th>To</th><th>Distance</th><th>Road</th><th>Condition</th><th>Transport Cost</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><div className="skeleton" style={{ height: 20 }} /></td></tr> :
              routes.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No routes yet.</td></tr> :
              routes.map((r: Record<string, unknown>) => (
                <tr key={r.id as string}>
                  <td><span className="badge badge-gray">{r.code as string}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{r.fromLocationName as string}</td>
                  <td style={{ fontSize: '0.85rem' }}>{r.toLocationName as string}</td>
                  <td>{r.distanceKm as number} km</td>
                  <td style={{ fontSize: '0.8rem' }}>{(r.roadType as string)?.replace(/_/g, ' ')}</td>
                  <td><span className={`badge ${r.roadCondition === 'GOOD' ? 'badge-green' : r.roadCondition === 'FAIR' ? 'badge-amber' : 'badge-red'}`}>{r.roadCondition as string}</span></td>
                  <td style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{r.transportCostRsTon ? `₹${r.transportCostRsTon}/T` : '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Admin Biomass Prices Page ──────────────────────────────────────────────────
const ADMIN_BIOMASS_TYPES = ['Rice Husk','Rice Straw','Mustard Straw','Tea Waste','Municipal Waste','Jute Waste','Bagasse'];

function AdminPricesPage() {
  const [prices, setPrices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], biomassType: 'Rice Husk', district: 'SONITPUR', priceRsTon: '', market: '', qualityGrade: 'B', dataSource: '', sourceType: 'FARM_GATE', transactionType: 'SPOT' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPrices = () => {
    setLoading(true);
    api.get('/prices?limit=30').then(r => setPrices(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchPrices(); }, []);

  const handleSubmit = async () => {
    if (!form.priceRsTon) { toast.error('Price is required'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/prices', { ...form, priceRsTon: Number(form.priceRsTon) });
      toast.success('Price record added!');
      setShowForm(false);
      fetchPrices();
    } catch { toast.error('Failed to add price'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Biomass Prices</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Price Record</>}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>New Price Record</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Biomass Type *</label>
              <select className="form-input form-select" value={form.biomassType} onChange={e => setForm(f => ({ ...f, biomassType: e.target.value }))}>
                {ADMIN_BIOMASS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">District *</label>
              <select className="form-input form-select" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                {ADMIN_DISTRICTS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹/ton) *</label>
              <input type="number" className="form-input" placeholder="e.g. 1200" value={form.priceRsTon} onChange={e => setForm(f => ({ ...f, priceRsTon: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Market</label>
              <input type="text" className="form-input" placeholder="e.g. Tezpur APMC" value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Quality Grade</label>
              <select className="form-input form-select" value={form.qualityGrade} onChange={e => setForm(f => ({ ...f, qualityGrade: e.target.value }))}>
                {['A','B','C'].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Source Type</label>
              <select className="form-input form-select" value={form.sourceType} onChange={e => setForm(f => ({ ...f, sourceType: e.target.value }))}>
                {['FARM_GATE','COLLECTION_CENTER','INDUSTRY_GATE','MARKET'].map(st => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data Source</label>
              <input type="text" className="form-input" placeholder="e.g. Field survey" value={form.dataSource} onChange={e => setForm(f => ({ ...f, dataSource: e.target.value }))} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Price Record'}
          </button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Code</th><th>Date</th><th>Biomass</th><th>District</th><th>Market</th><th>₹/ton</th><th>₹/quintal</th><th>Grade</th><th>Source</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}><div className="skeleton" style={{ height: 20 }} /></td></tr> :
              prices.map((p: Record<string, unknown>) => (
                <tr key={p.id as string}>
                  <td><span className="badge badge-gray">{p.code as string}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(p.date as string).toLocaleDateString('en-IN')}</td>
                  <td>{p.biomassType as string}</td>
                  <td>{(p.district as string)?.replace(/_/g, ' ')}</td>
                  <td style={{ fontSize: '0.8rem' }}>{(p.market as string) || '—'}</td>
                  <td><strong style={{ color: 'var(--text-accent)' }}>₹{p.priceRsTon as number}</strong></td>
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
  );
}

// ── Bulk Import Page ───────────────────────────────────────────────────────────────
function BulkImportPage() {
  const templates = [
    { name: 'Agricultural Sources', description: 'Import AGR-xxx biomass source records', fields: ['name','district','biomassType','cropName','latitude','longitude','annualProductionTons','priceRsTon'], color: '#22c55e' },
    { name: 'Industrial Sources', description: 'Import IND-xxx industrial source records', fields: ['industryName','industryType','district','latitude','longitude','biomassType','dailyBiomassTons','currentPriceRsTon'], color: '#f59e0b' },
    { name: 'Municipal Waste Sites', description: 'Import MSW-xxx waste site records', fields: ['city','district','latitude','longitude','dailyWasteKg','biodegradablePct','collectionPointType'], color: '#ef4444' },
    { name: 'Biomass Prices', description: 'Import historical price records', fields: ['date','biomassType','district','priceRsTon','market','qualityGrade','dataSource'], color: '#60a5fa' },
    { name: 'Seasonal Availability', description: 'Import monthly availability data', fields: ['biomassType','district','month','availabilityTons','year','moisturePct'], color: '#a78bfa' },
  ];

  const downloadTemplate = (name: string, fields: string[]) => {
    const csvContent = fields.join(',') + '\n' + fields.map(() => '').join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/ /g, '_')}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${name} CSV template`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>Bulk Data Import</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Download CSV templates, fill in your data, and import via API or database seed scripts.
        </p>
      </div>

      {/* Instructions */}
      <div className="card" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-accent)' }}>Import Instructions</h3>
        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <li>Download the CSV template for the data type you want to import</li>
          <li>Fill in all required fields — coordinates must be in decimal degrees (WGS84)</li>
          <li>Use the Prisma seed script: <code style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: '0.8rem' }}>cd server &amp;&amp; npx ts-node prisma/seed.ts</code></li>
          <li>Or use the REST API endpoints with JSON payload (see docs)</li>
        </ol>
      </div>

      {/* Template cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {templates.map(t => (
          <div key={t.name} className="card" style={{ borderTop: `3px solid ${t.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${t.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Database size={18} color={t.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description}</div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fields</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {t.fields.map(f => (
                  <span key={f} style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{f}</span>
                ))}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', gap: '0.5rem' }}
              onClick={() => downloadTemplate(t.name, t.fields)}>
              <Upload size={14} /> Download CSV Template
            </button>
          </div>
        ))}
      </div>

      {/* Seed info */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🌱 Seed Database with Workbook Data</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
          The <code style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: '0.8rem' }}>prisma/seed.ts</code> file already contains complete sample data
          for Sonitpur and Kamrup districts. Run it to populate your database with working data for all biomass types, prices, and sources.
        </p>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#4ade80' }}>
          $ cd server<br />
          $ npx ts-node prisma/seed.ts<br />
          <span style={{ color: '#86efac' }}>✓ Seeded 120+ records across all tables</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Panel" role="ADMIN">
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/survey" element={<SurveyProgress />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/collection-points" element={<CollectionPointsPage />} />
        <Route path="/routes" element={<TransportRoutesPage />} />
        <Route path="/prices" element={<AdminPricesPage />} />
        <Route path="/import" element={<BulkImportPage />} />
      </Routes>
    </DashboardLayout>
  );
}
