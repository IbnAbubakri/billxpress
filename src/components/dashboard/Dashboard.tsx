import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, X, PartyPopper } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';
import DashboardLayout from '../layout/DashboardLayout';
import WalletCard from '../ui/WalletCard';
import ServiceGrid from '../ui/ServiceGrid';
import { TransactionChart, SpendingChart } from '../ui/LazyCharts';
import RecentTransactions from '../ui/RecentTransactions';
import ProfileCompletion from '../ui/ProfileCompletion';
import LogoutModal from '../ui/LogoutModal';
import PageErrorBoundary from '../PageErrorBoundary';
import { useTransactions } from '../../hooks/useTransactions';
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
  const navigate = useNavigate();
  const { handleSendVerification } = useAuth();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const emptyTransactions = !txLoading && (!transactions || transactions.length === 0);

  const handleDismissEmailBanner = () => {
    setDismissEmailBanner(true);
    try { localStorage.setItem('dismissEmailBanner', String(Date.now())); } catch { /* noop */ }
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
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
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

        {emptyTransactions ? (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-dark-800 dark:to-dark-800 rounded-2xl border border-dashed border-primary-200 dark:border-dark-700 p-6 text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                <PartyPopper className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to BillXpress!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                You're all set. Make your first payment to see your transaction history and spending charts here.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { trackEvent('quick_action', { action: 'airtime' }); navigate('/airtime'); }} className="p-4 bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-left">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Buy Airtime</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Top up your phone</p>
              </button>
              <button onClick={() => { trackEvent('quick_action', { action: 'data' }); navigate('/data'); }} className="p-4 bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-left">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Buy Data</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stay connected</p>
              </button>
              <button onClick={() => { trackEvent('quick_action', { action: 'cable' }); navigate('/cable'); }} className="p-4 bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-left">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Pay Cable</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">TV subscriptions</p>
              </button>
              <button onClick={() => { trackEvent('quick_action', { action: 'electricity' }); navigate('/electricity'); }} className="p-4 bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-left">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Pay Electricity</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Power bills</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <PageErrorBoundary pageName="Chart">
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 md:p-4">
                <h3 className="text-base font-semibold text-secondary dark:text-white mb-4">Daily Transactions</h3>
                <TransactionChart />
              </div>
            </PageErrorBoundary>
            <PageErrorBoundary pageName="Chart">
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 md:p-4">
                <h3 className="text-base font-semibold text-secondary dark:text-white mb-4">Bill Distribution</h3>
                <SpendingChart />
              </div>
            </PageErrorBoundary>
          </div>
        )}

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
