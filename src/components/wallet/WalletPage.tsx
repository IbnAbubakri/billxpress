import React from "react";
import { ArrowLeft } from "lucide-react";
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
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
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
