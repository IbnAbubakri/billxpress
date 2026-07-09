import { useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import Dashboard from './components/dashboard/Dashboard';
import AirtimePage from './components/services/AirtimePage';
import DataPage from './components/services/DataPage';
import TVSubscriptionPage from './components/services/TVSubscriptionPage';
import ElectricityPage from './components/services/ElectricityPage';
import EducationPage from './components/services/EducationPage';
import AirtimeToCashPage from './components/services/AirtimeToCashPage';
import BettingPage from './components/services/BettingPage';
import WalletPage from './components/wallet/WalletPage';
import TransactionsPage from './components/transactions/TransactionsPage';
import ProfilePage from './components/profile/ProfilePage';
import LoadingScreen from './components/ui/LoadingScreen';

import AdminLogin from './components/auth/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLayout from './components/layout/AdminLayout';
import Analytics from './components/admin/Analytics';
import PricingControl from './components/admin/PricingControl';
import UserManagement from './components/admin/UserManagement';
import TransactionManagement from './components/admin/TransactionManagement';
import AdminProfile from './components/admin/AdminProfile';

import { useAuth } from './hooks/useAuth';
import { ToastProvider, useToast } from './hooks/useToast';
import { ToastContainer } from './components/ui/ToastContainer';

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
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
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;
