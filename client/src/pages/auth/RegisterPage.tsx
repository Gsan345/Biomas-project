import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, AlertCircle, User, Building2, Navigation, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// ── Shared validation ─────────────────────────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

const DISTRICTS = ['SONITPUR','KAMRUP','KAMRUP_METRO','BISWANATH','NAGAON','GOALPARA','BARPETA','NALBARI','JORHAT','SIBSAGAR','DIBRUGARH','TINSUKIA','LAKHIMPUR','DHEMAJI','GOLAGHAT','DARRANG','UDALGURI','BAKSA'];
const BIOMASS_TYPES = ['Rice Husk','Rice Straw','Mustard Straw','Jute Waste','Tea Waste','Sugarcane Bagasse','Wheat Straw','Municipal Waste','Bamboo','Maize Stover','Cotton Stalk','Sawdust'];

const baseSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().regex(MOBILE_REGEX, 'Enter valid 10-digit Indian mobile'),
  password: z.string().regex(PASSWORD_REGEX, 'Min 8 chars: uppercase, lowercase, number & special char'),
  confirmPassword: z.string(),
  district: z.string().min(1, 'Select district'),
  termsAccepted: z.literal(true, { message: 'You must accept the terms' }),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const sellerSchema = baseSchema.extend({
  sellerType: z.string().min(1, 'Select seller type'),
  organisationName: z.string().optional(),
  locationArea: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  operationalStatus: z.string().default('OPERATIONAL'),
});

const buyerSchema = baseSchema.extend({
  buyerType: z.string().min(1, 'Select buyer type'),
  companyName: z.string().min(2, 'Company name required'),
  ownerOrOperator: z.string().optional(),
  locationArea: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  installedCapacityTPD: z.string().optional(),
  maxMoisturePct: z.string().optional(),
  deliveryRequired: z.boolean().default(false),
});

type Step = 'role' | 'form';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[@$!%*?&]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const levels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.375rem' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="strength-bar" style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : 'var(--bg-secondary)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: colors[score] }}>{levels[score]}</span>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'SELLER' | 'BUYER' | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeedstocks, setSelectedFeedstocks] = useState<string[]>([]);

  const schema = role === 'SELLER' ? sellerSchema : buyerSchema;
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema) as any,
  });

  const password = watch('password') ?? '';

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setValue('latitude', pos.coords.latitude.toFixed(6));
        setValue('longitude', pos.coords.longitude.toFixed(6));
        toast.success('Location captured!');
      },
      () => toast.error('Could not get location')
    );
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        role,
        termsAccepted: true,
        latitude: data.latitude ? parseFloat(data.latitude as string) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude as string) : undefined,
        installedCapacityTPD: data.installedCapacityTPD ? parseFloat(data.installedCapacityTPD as string) : undefined,
        maxMoisturePct: data.maxMoisturePct ? parseFloat(data.maxMoisturePct as string) : undefined,
        feedstockTypesAccepted: selectedFeedstocks,
      };
      await api.post('/auth/register', payload);
      toast.success('Registration successful! Check console for email verification link (dev mode).');
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Registration failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const FormField = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      {children}
      {error && <span className="form-error"><AlertCircle size={13} />{error}</span>}
    </div>
  );

  if (step === 'role') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={22} color="white" />
              </div>
              <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.375rem', background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BioChain</span>
            </Link>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Create your account</h1>
            <p style={{ color: 'var(--text-muted)' }}>First, tell us who you are</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Seller Card */}
            <div className={`role-card${role === 'SELLER' ? ' selected' : ''}`} onClick={() => setRole('SELLER')}>
              {role === 'SELLER' && <div style={{ position: 'absolute', top: 12, right: 12 }}><CheckCircle size={20} color="var(--text-accent)" /></div>}
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <User size={32} color="var(--text-accent)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>I am a Seller</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Farmer, rice mill, tea estate, food processor or municipal body with biomass to offer
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem', justifyContent: 'center' }}>
                {['Farmer', 'Rice Mill', 'Tea Estate', 'Municipality'].map(t => (
                  <span key={t} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Buyer Card */}
            <div className={`role-card${role === 'BUYER' ? ' selected' : ''}`} onClick={() => setRole('BUYER')}>
              {role === 'BUYER' && <div style={{ position: 'absolute', top: 12, right: 12 }}><CheckCircle size={20} color="var(--text-accent)" /></div>}
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Building2 size={32} color="#60a5fa" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>I am a Buyer</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Waste-to-energy plant, brick kiln, pellet unit, or biogas plant seeking feedstock supply
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem', justifyContent: 'center' }}>
                {['WtE Plant', 'Brick Kiln', 'Pellet Unit', 'Biogas'].map(t => (
                  <span key={t} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '0.875rem', fontSize: '1rem' }} disabled={!role} onClick={() => role && setStep('form')}>
            Continue as {role === 'SELLER' ? 'Seller' : role === 'BUYER' ? 'Buyer' : '…'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--text-accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BioChain</span>
          </Link>
          <div className="badge badge-green" style={{ marginBottom: '0.75rem' }}>
            {role === 'SELLER' ? '🌱 Seller Registration' : '🏭 Buyer Registration'}
          </div>
          <h1 style={{ fontSize: '1.625rem' }}>Complete your profile</h1>
          <button onClick={() => setStep('role')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            ← Change role
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ── Section: Personal Info ─────────────────────────────────── */}
          <div>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField id="fullName" label="Full Name *" error={errors.fullName?.message as string}>
                <input id="fullName" className={`form-input${errors.fullName ? ' error' : ''}`} placeholder="Ranjit Borah" {...register('fullName')} />
              </FormField>
              <FormField id="email" label="Email *" error={errors.email?.message as string}>
                <input id="email" type="email" className={`form-input${errors.email ? ' error' : ''}`} placeholder="you@example.com" {...register('email')} />
              </FormField>
              <FormField id="mobile" label="Mobile *" error={errors.mobile?.message as string}>
                <input id="mobile" className={`form-input${errors.mobile ? ' error' : ''}`} placeholder="9435XXXXXX" maxLength={10} {...register('mobile')} />
              </FormField>
              <FormField id="district" label="District *" error={errors.district?.message as string}>
                <select id="district" className={`form-input form-select${errors.district ? ' error' : ''}`} {...register('district')}>
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                </select>
              </FormField>
            </div>
          </div>

          {/* ── Section: Password ──────────────────────────────────────── */}
          <div>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Password
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField id="password" label="Password *" error={errors.password?.message as string}>
                <div style={{ position: 'relative' }}>
                  <input id="password" type={showPwd ? 'text' : 'password'} className={`form-input${errors.password ? ' error' : ''}`} placeholder="••••••••" style={{ paddingRight: '2.75rem' }} {...register('password')} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </FormField>
              <FormField id="confirmPassword" label="Confirm Password *" error={errors.confirmPassword?.message as string}>
                <div style={{ position: 'relative' }}>
                  <input id="confirmPassword" type={showConfirmPwd ? 'text' : 'password'} className={`form-input${errors.confirmPassword ? ' error' : ''}`} placeholder="••••••••" style={{ paddingRight: '2.75rem' }} {...register('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormField>
            </div>
          </div>

          {/* ── Seller-specific fields ───────────────────────────────── */}
          {role === 'SELLER' && (
            <div>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Seller Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField id="sellerType" label="Seller Type *" error={errors.sellerType?.message as string}>
                  <select id="sellerType" className={`form-input form-select${errors.sellerType ? ' error' : ''}`} {...register('sellerType')}>
                    <option value="">Select type…</option>
                    <option value="FARMER">Farmer</option>
                    <option value="RICE_MILL">Rice Mill</option>
                    <option value="TEA_ESTATE">Tea Estate</option>
                    <option value="FOOD_PROCESSING">Food Processing</option>
                    <option value="OTHER_INDUSTRY">Other Industry</option>
                    <option value="MUNICIPAL_BODY">Municipal Body</option>
                  </select>
                </FormField>
                <FormField id="organisationName" label="Organisation Name" error="">
                  <input id="organisationName" className="form-input" placeholder="e.g. Borah Rice Mill" {...register('organisationName')} />
                </FormField>
                <FormField id="locationArea" label="Location / Area" error="">
                  <input id="locationArea" className="form-input" placeholder="e.g. Tezpur, Sonitpur" {...register('locationArea')} />
                </FormField>
                <FormField id="operationalStatus" label="Operational Status" error="">
                  <select id="operationalStatus" className="form-input form-select" {...register('operationalStatus')}>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="SEASONAL">Seasonal</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </FormField>
              </div>
              {/* GPS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginTop: '1rem', alignItems: 'end' }}>
                <FormField id="latitude" label="Latitude (GPS)" error="">
                  <input id="latitude" className="form-input" placeholder="26.6338" {...register('latitude')} />
                </FormField>
                <FormField id="longitude" label="Longitude (GPS)" error="">
                  <input id="longitude" className="form-input" placeholder="92.8005" {...register('longitude')} />
                </FormField>
                <button type="button" className="btn btn-secondary" onClick={handleGetLocation} style={{ marginBottom: 0, height: 44 }}>
                  <Navigation size={16} /> Use My Location
                </button>
              </div>
            </div>
          )}

          {/* ── Buyer-specific fields ─────────────────────────────────── */}
          {role === 'BUYER' && (
            <div>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Buyer / Facility Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField id="buyerType" label="Buyer Type *" error={errors.buyerType?.message as string}>
                  <select id="buyerType" className={`form-input form-select${errors.buyerType ? ' error' : ''}`} {...register('buyerType')}>
                    <option value="">Select type…</option>
                    <option value="WASTE_TO_ENERGY">Waste-to-Energy Plant</option>
                    <option value="BRICK_KILN">Brick Kiln</option>
                    <option value="PELLET_UNIT">Pellet Unit</option>
                    <option value="BIOGAS_PLANT">Biogas Plant</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormField>
                <FormField id="companyName" label="Company Name *" error={errors.companyName?.message as string}>
                  <input id="companyName" className={`form-input${errors.companyName ? ' error' : ''}`} placeholder="Assam GreenPower Ltd" {...register('companyName')} />
                </FormField>
                <FormField id="ownerOrOperator" label="Owner / Operator" error="">
                  <input id="ownerOrOperator" className="form-input" placeholder="Name" {...register('ownerOrOperator')} />
                </FormField>
                <FormField id="installedCapacityTPD" label="Installed Capacity (TPD)" error="">
                  <input id="installedCapacityTPD" type="number" className="form-input" placeholder="150" {...register('installedCapacityTPD')} />
                </FormField>
                <FormField id="maxMoisturePct" label="Max Moisture %" error="">
                  <input id="maxMoisturePct" type="number" className="form-input" placeholder="25" min="0" max="100" {...register('maxMoisturePct')} />
                </FormField>
                <FormField id="locationArea" label="Location / Area" error="">
                  <input id="locationArea" className="form-input" placeholder="Guwahati Industrial Area" {...register('locationArea')} />
                </FormField>
              </div>
              {/* Feedstocks accepted */}
              <div style={{ marginTop: '1rem' }}>
                <label className="form-label">Feedstock Types Accepted</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {BIOMASS_TYPES.map(bt => (
                    <button key={bt} type="button" className={`filter-chip${selectedFeedstocks.includes(bt) ? ' active' : ''}`} onClick={() => setSelectedFeedstocks(prev => prev.includes(bt) ? prev.filter(x => x !== bt) : [...prev, bt])}>
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
              {/* GPS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginTop: '1rem', alignItems: 'end' }}>
                <FormField id="latitude" label="Latitude (GPS)" error="">
                  <input id="latitude" className="form-input" placeholder="26.1445" {...register('latitude')} />
                </FormField>
                <FormField id="longitude" label="Longitude (GPS)" error="">
                  <input id="longitude" className="form-input" placeholder="91.7362" {...register('longitude')} />
                </FormField>
                <button type="button" className="btn btn-secondary" onClick={handleGetLocation} style={{ marginBottom: 0, height: 44 }}>
                  <Navigation size={16} /> Use My Location
                </button>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <input type="checkbox" {...register('deliveryRequired')} style={{ accentColor: 'var(--green-500)', width: 16, height: 16 }} />
                  Delivery to facility required (we cannot collect ourselves)
                </label>
              </div>
            </div>
          )}

          {/* Terms */}
          <div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
              <input id="termsAccepted" type="checkbox" {...register('termsAccepted')} style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--green-500)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                I agree to BioChain's <a href="#" style={{ color: 'var(--text-accent)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--text-accent)' }}>Privacy Policy</a>. I understand my role ({role}) cannot be changed after registration.
              </span>
            </label>
            {errors.termsAccepted && <span className="form-error" style={{ marginTop: '0.25rem' }}><AlertCircle size={13} />{errors.termsAccepted.message as string}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}>
            {isLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Creating account…</span> : `Create ${role === 'SELLER' ? 'Seller' : 'Buyer'} Account`}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--text-accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
