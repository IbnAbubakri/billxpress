import { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import WalletCard from '../ui/WalletCard';
import ServiceGrid from '../ui/ServiceGrid';
import TransactionChart from '../ui/TransactionChart';
import SpendingChart from '../ui/SpendingChart';
import RecentTransactions from '../ui/RecentTransactions';
import ProfileCompletion from '../ui/ProfileCompletion';
import LogoutModal from '../ui/LogoutModal';
import type { User } from '../../types';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [showLogout, setShowLogout] = useState(false);

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
        {!profileComplete && <ProfileCompletion user={user} />}

        <div className="mb-6">
          <WalletCard user={user} />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-secondary mb-4">Quick Services</h2>
          <ServiceGrid />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 md:p-4">
            <h3 className="text-base font-semibold text-secondary mb-4">Daily Transactions</h3>
            <TransactionChart />
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 md:p-4">
            <h3 className="text-base font-semibold text-secondary mb-4">Bill Distribution</h3>
            <SpendingChart />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm">
          <div className="p-4 border-b dark:border-dark-700">
            <h3 className="text-base font-semibold text-secondary">Recent Transactions</h3>
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
