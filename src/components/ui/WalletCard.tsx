// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import FundWalletModal from '../modals/FundWalletModal';
import WithdrawModal from '../modals/WithdrawModal';
import type { User } from '../../types';

interface WalletCardProps {
  user: User | null;
}

const WalletCard: React.FC<WalletCardProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [showBalance, setShowBalance] = useState(true);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const refreshUser = () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

  return (
    <>
      <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white dark:bg-dark-800 bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                <Wallet className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-white text-opacity-80 text-sm">Wallet Balance</p>
                <p className="text-white text-opacity-60 text-xs">Available funds</p>
              </div>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              className="p-2 hover:bg-white dark:bg-dark-800 hover:bg-opacity-20 rounded-lg transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>

          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 truncate">
              {showBalance ? `₦${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦***'}
            </h2>
            <p className="text-white text-opacity-60 text-sm">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFundModal(true)}
              className="flex-1 bg-white dark:bg-dark-800 bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm px-3 sm:px-6 py-3 rounded-2xl font-medium transition-all flex items-center justify-center text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              Fund Wallet
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 bg-transparent border border-white border-opacity-30 hover:bg-white dark:bg-dark-800 hover:bg-opacity-10 px-3 sm:px-6 py-3 rounded-2xl font-medium transition-all flex items-center justify-center text-sm sm:text-base"
            >
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {showFundModal && (
        <FundWalletModal onClose={() => setShowFundModal(false)} onSuccess={refreshUser} />
      )}

      {showWithdrawModal && (
        <WithdrawModal user={user} onClose={() => setShowWithdrawModal(false)} onSuccess={refreshUser} />
      )}
    </>
  );
};

export default React.memo(WalletCard);