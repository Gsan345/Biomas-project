import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Bell, LogOut, Menu, Sun, Moon, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  role: string;
}

export default function DashboardLayout({ children, navItems, title, role }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light');
  };

  const roleColor = role === 'SELLER' ? '#22c55e' : role === 'BUYER' ? '#60a5fa' : '#f59e0b';

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #4ade80, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BioChain</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${roleColor}44`, fontSize: '0.875rem', fontWeight: 700, color: roleColor }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.7rem', color: roleColor, fontWeight: 600 }}>{role}</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '1rem 0', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path} className={`sidebar-item${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span style={{ width: 20, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                {item.label}
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--green-400)' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
          <button className="sidebar-item" onClick={toggleTheme}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="sidebar-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-content">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 20, paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary btn-sm" style={{ display: 'none', padding: '0.5rem' }} id="menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" style={{ position: 'relative', padding: '0.5rem' }}>
              <Bell size={18} />
              <span className="notif-dot" style={{ position: 'absolute', top: 6, right: 6 }} />
            </button>
          </div>
        </div>

        {/* Page content */}
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          #menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
