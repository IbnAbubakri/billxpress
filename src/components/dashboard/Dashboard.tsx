// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import Seo from '../ui/Seo';
import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';
import DashboardLayout from '../layout/DashboardLayout';
import WalletCard from '../ui/WalletCard';
import ServiceGrid from '../ui/ServiceGrid';
import { TransactionChart, SpendingChart } from '../ui/LazyCharts';
import RecentTransactions from '../ui/RecentTransactions';
import ProfileCompletion from '../ui/ProfileCompletion';
import LogoutModal from '../ui/LogoutModal';
import PageErrorBoundary from '../PageErrorBoundary';
import { useAuth } from '../../hooks/useAuth';
import type { User, ProfileUpdateData } from '../../types';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  onUpdateProfile?: (data: ProfileUpdateData) => Promise<User>;
}

const Dashboard = ({ user, onLogout, onUpdateProfile }: DashboardProps) => {
  const [showLogout, setShowLogout] = useState(false);
  const [dismissEmailBanner, setDismissEmailBanner] = useState(() => {
    try {
      const stored = localStorage.getItem('dismissEmailBanner');
      if (!stored) return false;
      return Date.now() - Number(stored) < 86400000;
    }
    catch { return false; }
  });
  const { handleSendVerification } = useAuth();

  const handleDismissEmailBanner = () => {
    setDismissEmailBanner(true);
    try { localStorage.setItem('dismissEmailBanner', String(Date.now())); } catch { console.warn('[Dashboard] localStorage unavailable'); }
  };

  const profileComplete = !!(
    user?.emailVerified &&
    user?.billingStreet &&
    user?.billingCity &&
    user?.bvn &&
    user?.accountNumber &&
    user?.bankName
  );

  return (
    <DashboardLayout user={user} onLogout={() => setShowLogout(true)}>
      <Seo title="Dashboard" />
      <div className="p-4 pl-14 lg:p-6 lg:pl-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-bold text-black dark:text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Valued Customer'}
            </h1>
            <p className="text-xs text-black dark:text-white">Welcome back!</p>
          </div>
        </div>
        {!dismissEmailBanner && user && !user.emailVerified && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Verify your email address</p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                Please check your inbox for the verification email or{' '}
                <button onClick={async () => { try { await handleSendVerification(); trackEvent('resend_verification'); alert('Verification email sent!'); } catch { alert('Failed to send. Try again.'); } }} className="underline font-medium hover:text-amber-700">
                  click here to resend
                </button>
              </p>
            </div>
            <button onClick={handleDismissEmailBanner} className="p-1 text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {!profileComplete && <ProfileCompletion user={user} onUpdateProfile={onUpdateProfile} />}

        <div className="mb-6">
          <WalletCard user={user} />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-secondary dark:text-white mb-4">Quick Services</h2>
          <ServiceGrid />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <PageErrorBoundary pageName="Chart">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 md:p-4 border-l-4 border-l-slate-400 dark:border-l-slate-500">
              <h3 className="text-base font-semibold text-secondary dark:text-white mb-4">Daily Transactions</h3>
              <TransactionChart />
            </div>
          </PageErrorBoundary>
          <PageErrorBoundary pageName="Chart">
            <div className="bg-slate-50 dark:bg-dark-800/60 rounded-2xl shadow-sm p-4 md:p-4 border border-slate-100 dark:border-dark-700">
              <h3 className="text-base font-semibold text-secondary dark:text-white mb-4">Bill Distribution</h3>
              <SpendingChart />
            </div>
          </PageErrorBoundary>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm">
          <div className="p-4 border-b dark:border-dark-700">
            <h3 className="text-base font-semibold text-secondary dark:text-white">Recent Transactions</h3>
          </div>
          <RecentTransactions />
        </div>
      </div>

      {showLogout && (
        <LogoutModal
          onConfirm={() => { setShowLogout(false); onLogout(); }}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
