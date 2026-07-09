import { ArrowLeft, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import WalletCard from "../ui/WalletCard";
import RecentTransactions from "../ui/RecentTransactions";
import ConfirmModal from "../ui/ConfirmModal";

import type { PageProps } from '../../types/page';

interface WalletPageProps extends PageProps {}

const WalletPage = ({ user, onLogout }: WalletPageProps) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
          <WalletCard user={user} />
          <RecentTransactions />
        </div>
      </div>
      <ConfirmModal
        show={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </DashboardLayout>
  );
};

export default WalletPage;
