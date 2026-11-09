import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SellerDashboard from './pages/seller/SellerDashboard';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import MarketplacePage from './pages/shared/MarketplacePage';
import MapPage from './pages/shared/MapPage';
import PriceTrendsPage from './pages/shared/PriceTrendsPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children, role }: { children: React.ReactElement; role?: string | string[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div style={{ width: 32, height: 32, border: '2px solid var(--green-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/seller/*" element={
        <ProtectedRoute role="SELLER"><SellerDashboard /></ProtectedRoute>
      } />
      <Route path="/buyer/*" element={
        <ProtectedRoute role="BUYER"><BuyerDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/marketplace" element={
        <ProtectedRoute><MarketplacePage /></ProtectedRoute>
      } />
      <Route path="/map" element={
        <ProtectedRoute><MapPage /></ProtectedRoute>
      } />
      <Route path="/prices" element={
        <ProtectedRoute><PriceTrendsPage /></ProtectedRoute>
      } />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
