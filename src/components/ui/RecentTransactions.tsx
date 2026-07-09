import React from 'react';
import { Wifi, Phone, Zap, Tv, GraduationCap, MoreHorizontal } from 'lucide-react';

const RecentTransactions: React.FC = () => {
  const transactions = [
    {
      id: 1,
      type: 'Wallet Funding',
      amount: 50000.00,
      status: 'Successful',
      date: 'Jul 6, 2026',
      time: '09:20 AM',
      transactionId: 'BDG7XK42M1',
      icon: Wifi,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'Airtime',
      amount: 500.00,
      status: 'Successful',
      date: 'Jul 5, 2026',
      time: '06:42 AM',
      transactionId: 'BDG4326kJ39',
      icon: Phone,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'Electricity',
      amount: 5000.00,
      status: 'Failed',
      date: 'Jul 4, 2026',
      time: '11:30 AM',
      transactionId: 'BDG48348E46',
      icon: Zap,
      color: 'text-yellow-600'
    },
    {
      id: 4,
      type: 'DStv Subscription',
      amount: 12400.00,
      status: 'Pending',
      date: 'Jul 3, 2026',
      time: '02:15 PM',
      transactionId: 'BDG36661703',
      icon: Tv,
      color: 'text-purple-600'
    },
    {
      id: 5,
      type: 'JAMB Registration',
      amount: 4700.00,
      status: 'Successful',
      date: 'Jul 2, 2026',
      time: '04:20 PM',
      transactionId: 'BDG15592A50',
      icon: GraduationCap,
      color: 'text-orange-600'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Successful':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 dark:bg-dark-700 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Successful':
        return '●';
      case 'Pending':
        return '●';
      case 'Failed':
        return '●';
      default:
        return '●';
    }
  };

  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((transaction) => {
        const Icon = transaction.icon;
        return (
          <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center ${transaction.color}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-neutral-100 truncate">
                      {transaction.type}
                    </h4>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                      <span className="mr-1">{getStatusIcon(transaction.status)}</span>
                      {transaction.status}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{transaction.date}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{transaction.time}</span>
                    <span className="hidden md:inline">•</span>
                    <span className="hidden md:inline font-mono">{transaction.transactionId}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-neutral-100">
                    ₦{transaction.amount.toLocaleString()}
                  </div>
                </div>
                
                <button aria-label="More options" className="p-2 hover:bg-gray-100 dark:bg-dark-700 dark:hover:bg-dark-700 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="p-4 text-center">
        <button className="text-secondary hover:underline font-medium">
          View all transactions
        </button>
      </div>
    </div>
  );
};

export default React.memo(RecentTransactions);