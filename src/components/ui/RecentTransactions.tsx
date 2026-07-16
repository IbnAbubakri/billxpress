// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Phone, Zap, Tv, GraduationCap, Target, RefreshCw, CreditCard, MoreHorizontal, ArrowRight } from 'lucide-react';
import VirtualTransactionList from './VirtualTransactionList';
import { useTransactions } from '../../hooks/useTransactions';

const typeIcons: Record<string, React.ReactNode> = {
  airtime: <Phone className="w-5 h-5" aria-hidden="true" />,
  data: <Wifi className="w-5 h-5" aria-hidden="true" />,
  tv: <Tv className="w-5 h-5" aria-hidden="true" />,
  electricity: <Zap className="w-5 h-5" aria-hidden="true" />,
  education: <GraduationCap className="w-5 h-5" aria-hidden="true" />,
  betting: <Target className="w-5 h-5" aria-hidden="true" />,
  airtime_to_cash: <RefreshCw className="w-5 h-5" aria-hidden="true" />,
  wallet_funding: <CreditCard className="w-5 h-5" aria-hidden="true" />,
};

const typeColors: Record<string, string> = {
  airtime: 'text-green-600',
  data: 'text-blue-600',
  tv: 'text-purple-600',
  electricity: 'text-yellow-600',
  education: 'text-indigo-600',
  betting: 'text-red-600',
  airtime_to_cash: 'text-teal-600',
  wallet_funding: 'text-emerald-600',
};

const RecentTransactions = () => {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useTransactions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 dark:bg-dark-700 text-gray-300';
    }
  };

  const listData = (transactions || []).map((t: { id: string | number; type: string; amount: number; status: string; date: string; description: string }) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    status: t.status === 'completed' ? 'Successful' : t.status === 'pending' ? 'Pending' : 'Failed',
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    description: t.description,
  }));

  const displayData = showAll ? listData : listData.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-dark-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-dark-700 rounded" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-dark-700 rounded" />
            </div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-dark-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!listData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-50 dark:bg-dark-700 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-500" />
        </div>
        <p className="text-gray-900 dark:text-white font-semibold mb-1">No transactions yet</p>
        <p className="text-gray-600 text-sm mb-6">Your payment history will appear here</p>
        <button
          onClick={() => navigate('/airtime')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Make Your First Payment
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {listData.length > 10 ? (
        <VirtualTransactionList
          transactions={showAll ? listData : displayData}
          height={showAll ? 640 : 320}
          itemSize={64}
        />
      ) : (
        displayData.map((transaction) => {
          const Icon = typeIcons[transaction.type] || <CreditCard className="w-5 h-5" />;
          const color = typeColors[transaction.type] || 'text-gray-600';
          return (
            <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 ${color}`}>
                  {Icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-black dark:text-white truncate">
                      {transaction.description}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-black dark:text-white text-sm sm:text-base">
                        {'\u20A6'}{Math.abs(transaction.amount).toLocaleString()}
                      </span>
                      <button aria-label="More options" className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-black dark:text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      <span className="mr-1">{'\u25CF'}</span>
                      {transaction.status}
                    </div>
                    <span className="text-xs text-black dark:text-white">{transaction.date}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      {listData.length > 5 && (
        <div className="p-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-secondary dark:text-white hover:underline font-medium"
          >
            {showAll ? 'Show less' : 'View all transactions'}
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(RecentTransactions);