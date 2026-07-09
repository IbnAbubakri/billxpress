import React from "react";
import { ArrowLeft, Building2, CreditCard, UserCheck, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import WalletCard from "../ui/WalletCard";
import RecentTransactions from "../ui/RecentTransactions";

import type { PageProps } from '../../types/page';

interface WalletPageProps extends PageProps {}

const WalletPage: React.FC<WalletPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogoutClick}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Go back"
            className="mr-4 p-2 hover:bg-gray-100 dark:bg-dark-700 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white">Wallet</h1>
            <p className="text-sm sm:text-base text-black dark:text-white">
              Manage your funds and view transaction history
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Wallet Card */}
          <WalletCard user={user} />

          {/* Account Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-black dark:text-white">Bank</span>
              </div>
              <p className="text-base font-semibold text-black dark:text-white truncate">{user?.bankName || "Not set"}</p>
              <p className="text-xs text-black dark:text-white truncate">{user?.accountName || "—"}</p>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-black dark:text-white">Account Number</span>
              </div>
              <p className="text-base font-semibold text-black dark:text-white">{user?.accountNumber || "—"}</p>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-black dark:text-white">Security</span>
              </div>
              <p className="text-base font-semibold text-black dark:text-white">{user?.hasTransactionPin ? "PIN Active" : "No PIN"}</p>
              <p className="text-xs text-black dark:text-white">Transaction protection</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <RecentTransactions />
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-black dark:text-white mb-4 text-center">
              Confirm Logout
            </h2>
            <p className="text-black dark:text-white mb-4 text-center">
              Are you sure you want to logout?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WalletPage;
