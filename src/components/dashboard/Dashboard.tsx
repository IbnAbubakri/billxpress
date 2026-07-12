import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import WalletCard from '../ui/WalletCard';
import ServiceGrid from '../ui/ServiceGrid';
import { TransactionChart, SpendingChart } from '../ui/LazyCharts';
import RecentTransactions from '../ui/RecentTransactions';
import ProfileCompletion from '../ui/ProfileCompletion';
import LogoutModal from '../ui/LogoutModal';
import PageErrorBoundary from '../PageErrorBoundary';
import { useTransactions } from '../../hooks/useTransactions';
import type { User, ProfileUpdateData } from '../../types';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  onUpdateProfile?: (data: ProfileUpdateData) => Promise<User>;
}

const Dashboard = ({ user, onLogout, onUpdateProfile }: DashboardProps) => {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const emptyTransactions = !txLoading && (!transactions || transactions.length === 0);

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
            {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-bold text-black dark:text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-xs text-black dark:text-white">{user?.email || ''}</p>
          </div>
        </div>
        {!profileComplete && <ProfileCompletion user={user} onUpdateProfile={onUpdateProfile} />}

        <div className="mb-6">
          <WalletCard user={user} />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-secondary dark:text-white mb-4">Quick Services</h2>
          <ServiceGrid />
        </div>

        {emptyTransactions ? (
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-dark-800 dark:to-dark-800 rounded-2xl border border-dashed border-primary-200 dark:border-dark-700 p-8 text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to BillXpress!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
              You're all set. Make your first payment to see your transaction history and spending charts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/airtime')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Buy Airtime
              </button>
              <button
                onClick={() => navigate('/data')}
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl border border-gray-200 dark:border-dark-600 hover:shadow-md transition-all duration-200"
              >
                Buy Data
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
