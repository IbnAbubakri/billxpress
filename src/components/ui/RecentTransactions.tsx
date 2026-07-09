import { useState } from 'react';
import { Wifi, Phone, Zap, Tv, GraduationCap, MoreHorizontal } from 'lucide-react';

const RecentTransactions = () => {
  const [showAll, setShowAll] = useState(false);

  const allTransactions = [
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
    },
    {
      id: 6,
      type: 'Data Bundle',
      amount: 2000.00,
      status: 'Successful',
      date: 'Jul 1, 2026',
      time: '10:05 AM',
      transactionId: 'BDG78F2K19',
      icon: Wifi,
      color: 'text-blue-600'
    },
    {
      id: 7,
      type: 'Airtime',
      amount: 200.00,
      status: 'Successful',
      date: 'Jun 29, 2026',
      time: '08:30 PM',
      transactionId: 'BDG91A47B32',
      icon: Phone,
      color: 'text-green-600'
    },
    {
      id: 8,
      type: 'Wallet Funding',
      amount: 100000.00,
      status: 'Successful',
      date: 'Jun 28, 2026',
      time: '01:45 PM',
      transactionId: 'BDG52X8C71',
      icon: Wifi,
      color: 'text-blue-600'
    },
    {
      id: 9,
      type: 'Electricity',
      amount: 3500.00,
      status: 'Failed',
      date: 'Jun 25, 2026',
      time: '07:15 AM',
      transactionId: 'BDG63D9E04',
      icon: Zap,
      color: 'text-yellow-600'
    },
    {
      id: 10,
      type: 'DStv Subscription',
      amount: 8400.00,
      status: 'Successful',
      date: 'Jun 21, 2026',
      time: '03:00 PM',
      transactionId: 'BDG27H5F88',
      icon: Tv,
      color: 'text-purple-600'
    }
  ];

  const transactions = showAll ? allTransactions : allTransactions.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Successful':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 dark:bg-dark-700 text-gray-300';
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
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 ${transaction.color}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-black dark:text-white truncate">
                    {transaction.type}
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold text-black dark:text-white text-sm sm:text-base">
                      ₦{transaction.amount.toLocaleString()}
                    </span>
                    <button aria-label="More options" className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-black dark:text-white" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    <span className="mr-1">{getStatusIcon(transaction.status)}</span>
                    {transaction.status}
                  </div>
                  <span className="text-xs text-black dark:text-white">{transaction.date}</span>
                  <span className="text-xs text-black dark:text-white">•</span>
                  <span className="text-xs text-black dark:text-white">{transaction.time}</span>
                  <span className="hidden md:inline text-xs text-black dark:text-white">•</span>
                  <span className="hidden md:inline font-mono text-xs text-black dark:text-white">{transaction.transactionId}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="p-4 text-center">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-secondary dark:text-white hover:underline font-medium"
        >
          {showAll ? 'Show less' : 'View all transactions'}
        </button>
      </div>
    </div>
  );
};

export default RecentTransactions;