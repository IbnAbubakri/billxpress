import { useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';

import LoadingScreen from './components/ui/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import PWAPrompt from './components/ui/PWAPrompt';
import PageErrorBoundary from './components/PageErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider, useToast } from './hooks/useToast';
import { ToastContainer } from './components/ui/ToastContainer';

const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const ResetPasswordPage = lazy(() => import('./components/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./components/auth/VerifyEmailPage'));
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
const LandingPage = lazy(() => import('./components/marketing/LandingPage'));
const FundCallback = lazy(() => import('./components/wallet/FundCallback'));

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

  function getErrorMessage(err: unknown): string {
    if (err && typeof err === 'object') {
      const axiosErr = err as Record<string, unknown>;
      const response = axiosErr.response as Record<string, unknown> | undefined;
      if (response?.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.error === 'string') return data.error;
      }
      if (typeof axiosErr.message === 'string') return axiosErr.message;
    }
    return 'An unexpected error occurred';
  }

  const onLogin = useCallback(
    async (login: string, password: string, totpCode?: string): Promise<{ mfaRequired?: boolean; tempEmail?: string } | void> => {
      try {
        const result = await handleLogin(login, password, totpCode);
        if (result.mfaRequired) {
          return { mfaRequired: true, tempEmail: result.email };
        }
        addToast('Login successful!', 'success');
        navigate('/dashboard');
      } catch (err: unknown) {
        addToast(getErrorMessage(err), 'error');
        throw err;
      }
    },
    [handleLogin, navigate, addToast],
  );

  const onRegister = useCallback(
    async (data: { email: string; password: string; phone?: string; name?: string }) => {
      try {
        await handleRegister(data);
        addToast('Account created successfully!', 'success');
        navigate('/dashboard');
      } catch (err: unknown) {
        addToast(getErrorMessage(err), 'error');
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
          <Route path="/login" element={
            !isAuthenticated ? <LoginPage onLogin={onLogin} /> : <Navigate to="/dashboard" replace />
          } />
          <Route path="/register" element={
            !isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />
          } />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route path="/admin/login" element={
            !isAdmin ? <AdminLogin /> : <Navigate to="/admin" replace />
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin} requireAdmin redirectTo="/admin/login">
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
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Dashboard"><Dashboard user={user} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/airtime" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Airtime"><AirtimePage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/data" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Data"><DataPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/tv" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="TV"><TVSubscriptionPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/electricity" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Electricity"><ElectricityPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/education" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Education"><EducationPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/airtime-to-cash" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="AirtimeToCash"><AirtimeToCashPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/betting" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Betting"><BettingPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/wallet/fund/verify" element={<FundCallback />} />
          <Route path="/wallet" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Wallet"><WalletPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Transactions"><TransactionsPage user={user} onLogout={handleLogout} /></PageErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
              <PageErrorBoundary pageName="Profile"><ProfilePage user={user} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} /></PageErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
        </Routes>
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PWAPrompt />
    </Suspense>
  );
}

function App() {
  return (
    <SentryErrorBoundary>
      <ErrorBoundary>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </ErrorBoundary>
    </SentryErrorBoundary>
  );
}

export default App;
