import { useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LoadingScreen from './components/ui/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast } from './hooks/useToast';
import { ToastContainer } from './components/ui/ToastContainer';

const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./components/auth/ResetPasswordPage'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const AirtimePage = lazy(() => import('./components/services/AirtimePage'));
const DataPage = lazy(() => import('./components/services/DataPage'));
const TVSubscriptionPage = lazy(() => import('./components/services/TVSubscriptionPage'));
const ElectricityPage = lazy(() => import('./components/services/ElectricityPage'));
const EducationPage = lazy(() => import('./components/services/EducationPage'));
const AirtimeToCashPage = lazy(() => import('./components/services/AirtimeToCashPage'));
const BettingPage = lazy(() => import('./components/services/BettingPage'));
const WalletPage = lazy(() => import('./components/wallet/WalletPage'));
const TransactionsPage = lazy(() => import('./components/transactions/TransactionsPage'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'));

const AdminLogin = lazy(() => import('./components/auth/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Analytics = lazy(() => import('./components/admin/Analytics'));
const PricingControl = lazy(() => import('./components/admin/PricingControl'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const TransactionManagement = lazy(() => import('./components/admin/TransactionManagement'));
const AdminProfile = lazy(() => import('./components/admin/AdminProfile'));

import { useAuth } from './hooks/useAuth';

function AppContent() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleUpdateProfile,
  } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, addToast } = useToast();

  const onLogin = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await handleLogin(email, password);
        if (result.mfaRequired) {
          addToast('MFA code required', 'info');
          return;
        }
        addToast('Login successful!', 'success');
        navigate('/dashboard');
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.message || 'Login failed';
        addToast(msg, 'error');
        throw err;
      }
    },
    [handleLogin, navigate, addToast],
  );

  const onRegister = useCallback(
    async (email: string, password: string) => {
      try {
        await handleRegister(email, password);
        addToast('Account created successfully!', 'success');
        navigate('/dashboard');
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.message || 'Registration failed';
        addToast(msg, 'error');
        throw err;
      }
    },
    [handleRegister, navigate, addToast],
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/admin/login"
            element={
              !isAdmin ? (
                <AdminLogin />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />
          <Route
            path="/admin/*"
            element={
              isAdmin ? (
                <AdminLayout onLogout={handleLogout}>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="pricing" element={<PricingControl />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="transactions" element={<TransactionManagement />} />
                    <Route path="profile" element={<AdminProfile />} />
                  </Routes>
                </AdminLayout>
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />

          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
              <Route path="/register" element={<RegisterPage onRegister={onRegister} />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
              <Route path="/airtime" element={<AirtimePage user={user} onLogout={handleLogout} />} />
              <Route path="/data" element={<DataPage user={user} onLogout={handleLogout} />} />
              <Route path="/tv" element={<TVSubscriptionPage user={user} onLogout={handleLogout} />} />
              <Route path="/electricity" element={<ElectricityPage user={user} onLogout={handleLogout} />} />
              <Route path="/education" element={<EducationPage user={user} onLogout={handleLogout} />} />
              <Route path="/airtime-to-cash" element={<AirtimeToCashPage user={user} onLogout={handleLogout} />} />
              <Route path="/betting" element={<BettingPage user={user} onLogout={handleLogout} />} />
              <Route path="/wallet" element={<WalletPage user={user} onLogout={handleLogout} />} />
              <Route path="/transactions" element={<TransactionsPage user={user} onLogout={handleLogout} />} />
              <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}

          <Route
            path="/"
            element={
              <Navigate
                to={isAdmin ? '/admin' : isAuthenticated ? '/dashboard' : '/login'}
                replace
              />
            }
          />
        </Routes>
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
