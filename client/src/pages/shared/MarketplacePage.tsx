import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowLeft, Leaf, MapPin, Droplets, Zap,
  Package, ChevronDown, X, TrendingDown, ShoppingCart, SlidersHorizontal,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const BIOMASS_TYPES = [
  'Rice Husk', 'Rice Straw', 'Mustard Straw', 'Tea Waste',
  'Municipal Waste', 'Jute Waste', 'Bagasse', 'Coconut Shell',
  'Wheat Straw', 'Maize Cob',
];

const DISTRICTS = [
  'SONITPUR', 'KAMRUP', 'KAMRUP_METRO', 'BISWANATH', 'NAGAON',
  'GOALPARA', 'BARPETA', 'NALBARI', 'JORHAT', 'DIBRUGARH',
];

const QUALITY_GRADES = ['A', 'B', 'C'];


interface Listing {
  id: string;
  biomassType: string;
  quantityTonsMonth: number;
  priceRsTon: number;
  moisturePct?: number;
  qualityGrade: string;
  calorificValueKcalKg?: number;
  deliveryOption: string;
  district: string;
  locationArea?: string;
  status: string;
  sellerUser?: { fullName: string; district: string; mobile?: string };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OfferModalProps {
  listing: Listing;
  onClose: () => void;
  onSubmit: (data: { offeredPriceRsTon: number; quantityTons: number; notes: string }) => void;
  loading: boolean;
}

function OfferModal({ listing, onClose, onSubmit, loading }: OfferModalProps) {
  const [offeredPrice, setOfferedPrice] = useState(listing.priceRsTon);
  const [quantity, setQuantity] = useState(Math.min(10, listing.quantityTonsMonth));
  const [notes, setNotes] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Make an Offer</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {listing.biomassType} · Listed at <strong style={{ color: 'var(--text-accent)' }}>₹{listing.priceRsTon}/ton</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Your Offered Price (₹/ton)</label>
            <input
              type="number"
              className="form-input"
              value={offeredPrice}
              min={1}
              onChange={e => setOfferedPrice(Number(e.target.value))}
            />
            {offeredPrice < listing.priceRsTon * 0.8 && (
              <p style={{ color: '#f59e0b', fontSize: '0.78rem', marginTop: '0.25rem' }}>⚠️ Offer is significantly below asking price</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Quantity (tons)</label>
            <input
              type="number"
              className="form-input"
              value={quantity}
              min={0.5}
              max={listing.quantityTonsMonth}
              step={0.5}
              onChange={e => setQuantity(Number(e.target.value))}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              Available: {listing.quantityTonsMonth} T/month
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Delivery preferences, quality requirements..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Cost summary */}
          <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total offer value</span>
              <span style={{ fontWeight: 700, color: 'var(--text-accent)' }}>
                ₹{(offeredPrice * quantity).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>vs. asking price</span>
              <span style={{ fontWeight: 600, color: offeredPrice <= listing.priceRsTon ? '#22c55e' : '#ef4444' }}>
                {offeredPrice <= listing.priceRsTon
                  ? `₹${((listing.priceRsTon - offeredPrice) * quantity).toLocaleString('en-IN')} savings`
                  : `₹${((offeredPrice - listing.priceRsTon) * quantity).toLocaleString('en-IN')} above ask`
                }
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading}
              onClick={() => onSubmit({ offeredPriceRsTon: offeredPrice, quantityTons: quantity, notes })}
            >
              {loading ? 'Submitting…' : <><ShoppingCart size={16} /> Submit Offer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [offerListing, setOfferListing] = useState<Listing | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    biomassType: '',
    district: '',
    maxPrice: '',
    minPrice: '',
    maxMoisture: '',
    minCalorific: '',
    minQuantity: '',
    qualityGrade: '',
    sortBy: 'priceRsTon',
  });

  const fetchListings = useCallback(async (pageNum = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pageNum), limit: '12' });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    try {
      const r = await api.get(`/buyer/marketplace?${params}`);
      setListings(r.data.data);
      setPagination(r.data.pagination);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings(page);
  }, [page, fetchListings]);

  const handleSearch = () => {
    setPage(1);
    fetchListings(1);
  };

  const clearFilters = () => {
    setFilters({ biomassType: '', district: '', maxPrice: '', minPrice: '', maxMoisture: '', minCalorific: '', minQuantity: '', qualityGrade: '', sortBy: 'priceRsTon' });
  };

  const handleMakeOffer = async (data: { offeredPriceRsTon: number; quantityTons: number; notes: string }) => {
    if (!offerListing) return;
    setOfferLoading(true);
    try {
      await api.post('/orders', {
        listingId: offerListing.id,
        quantityTons: data.quantityTons,
        offeredPriceRsTon: data.offeredPriceRsTon,
        notes: data.notes,
      });
      toast.success('Offer submitted! The seller will be notified.');
      setOfferListing(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to submit offer');
    } finally {
      setOfferLoading(false);
    }
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'sortBy' && v).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-glass)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Leaf size={20} color="var(--text-accent)" />
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>BioChain Marketplace</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Browse active biomass listings across Assam
            </p>
          </div>
        </div>
        {pagination && (
          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem' }}>
        {/* Search + Filter Bar */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Biomass type select */}
            <div style={{ flex: '1 1 180px', position: 'relative' }}>
              <select className="form-input form-select" value={filters.biomassType}
                onChange={e => setFilters(f => ({ ...f, biomassType: e.target.value }))}>
                <option value="">All Biomass Types</option>
                {BIOMASS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>

            {/* District select */}
            <div style={{ flex: '1 1 160px' }}>
              <select className="form-input form-select" value={filters.district}
                onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}>
                <option value="">All Districts</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            {/* Sort */}
            <div style={{ flex: '1 1 160px' }}>
              <select className="form-input form-select" value={filters.sortBy}
                onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}>
                <option value="priceRsTon">Sort: Price ↑</option>
                <option value="quantityTonsMonth">Sort: Quantity</option>
                <option value="createdAt">Sort: Newest</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={handleSearch} style={{ gap: '0.5rem' }}>
              <Search size={16} /> Search
            </button>

            <button
              className={`btn ${activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltersOpen(o => !o)}
              style={{ gap: '0.5rem', position: 'relative' }}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#22c55e', color: '#000', fontSize: '0.7rem',
                  fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{activeFilterCount}</span>
              )}
              <ChevronDown size={14} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {activeFilterCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ gap: '0.5rem', opacity: 0.8 }}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Advanced filters */}
          {filtersOpen && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Min Price (₹/ton)</label>
                <input type="number" className="form-input" placeholder="e.g. 500" value={filters.minPrice}
                  onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Price (₹/ton)</label>
                <input type="number" className="form-input" placeholder="e.g. 2000" value={filters.maxPrice}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Moisture %</label>
                <input type="number" className="form-input" placeholder="e.g. 25" value={filters.maxMoisture}
                  onChange={e => setFilters(f => ({ ...f, maxMoisture: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Min Calorific (kcal/kg)</label>
                <input type="number" className="form-input" placeholder="e.g. 3000" value={filters.minCalorific}
                  onChange={e => setFilters(f => ({ ...f, minCalorific: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Min Quantity (T/mo)</label>
                <input type="number" className="form-input" placeholder="e.g. 50" value={filters.minQuantity}
                  onChange={e => setFilters(f => ({ ...f, minQuantity: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Quality Grade</label>
                <select className="form-input form-select" value={filters.qualityGrade}
                  onChange={e => setFilters(f => ({ ...f, qualityGrade: e.target.value }))}>
                  <option value="">Any Grade</option>
                  {QUALITY_GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 260 }} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', gridColumn: '1/-1' }}>
            <Package size={56} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem', opacity: 0.4 }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No listings found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Try adjusting your filters or check back later.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Listings grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  canMakeOffer={user?.role === 'BUYER'}
                  onMakeOffer={() => setOfferListing(listing)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Offer Modal */}
      {offerListing && (
        <OfferModal
          listing={offerListing}
          onClose={() => setOfferListing(null)}
          onSubmit={handleMakeOffer}
          loading={offerLoading}
        />
      )}
    </div>
  );
}

function ListingCard({ listing, canMakeOffer, onMakeOffer }: {
  listing: Listing;
  canMakeOffer: boolean;
  onMakeOffer: () => void;
}) {
  const qualityColor = listing.qualityGrade === 'A' ? 'badge-green' : listing.qualityGrade === 'B' ? 'badge-amber' : 'badge-red';
  const deliveryLabel = listing.deliveryOption === 'EX_WORKS' ? 'Ex Works' : listing.deliveryOption === 'DELIVERED' ? 'Delivered' : 'Both';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(34,197,94,0.12)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>{listing.biomassType}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <MapPin size={11} />
            {listing.district.replace(/_/g, ' ')}
            {listing.locationArea && ` · ${listing.locationArea}`}
          </div>
        </div>
        <span className={`badge ${qualityColor}`}>Grade {listing.qualityGrade}</span>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1rem' }}>
        <div style={{ background: 'rgba(34,197,94,0.07)', borderRadius: 8, padding: '0.625rem 0.75rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            PRICE
          </div>
          <div style={{ fontWeight: 800, color: 'var(--text-accent)', fontSize: '1.2rem', fontFamily: 'Outfit' }}>
            ₹{listing.priceRsTon.toLocaleString('en-IN')}
            <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ton</span>
          </div>
        </div>
        <div style={{ background: 'rgba(96,165,250,0.07)', borderRadius: 8, padding: '0.625rem 0.75rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            QTY
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {listing.quantityTonsMonth}
            <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}> T/mo</span>
          </div>
        </div>

        {listing.moisturePct != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem' }}>
            <Droplets size={13} color="#60a5fa" />
            <span style={{ color: 'var(--text-muted)' }}>Moisture:</span>
            <span style={{ fontWeight: 600 }}>{listing.moisturePct}%</span>
          </div>
        )}
        {listing.calorificValueKcalKg != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem' }}>
            <Zap size={13} color="#f59e0b" />
            <span style={{ color: 'var(--text-muted)' }}>CV:</span>
            <span style={{ fontWeight: 600 }}>{listing.calorificValueKcalKg.toLocaleString('en-IN')} kcal/kg</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>🚚 {deliveryLabel}</span>
        {listing.sellerUser && <span>by {listing.sellerUser.fullName}</span>}
      </div>

      {/* Actions */}
      {canMakeOffer ? (
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={onMakeOffer}>
          <TrendingDown size={15} /> Make Offer
        </button>
      ) : (
        <div style={{ width: '100%', padding: '0.625rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginTop: 'auto' }}>
          Login as buyer to make offers
        </div>
      )}
    </div>
  );
}
