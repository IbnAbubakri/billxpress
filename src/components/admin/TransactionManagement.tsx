import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  CreditCard, Search, Eye, CheckCircle, XCircle, Clock,
  Smartphone, Wifi, Zap, Tv, Download, X,
} from 'lucide-react';

interface Transaction {
  id: number;
  user_name: string;
  user_email: string;
  service: string;
  service_type: string;
  amount: number;
  status: string;
  created_at: string;
}

const TransactionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const { data: txns } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const { data } = await axios.get('/api/admin/transactions', { withCredentials: true });
      return data.transactions as Transaction[];
    },
    staleTime: 60 * 1000,
  });

  const transactions = txns || [];

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.service || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = {
      completed: 'bg-success-100 dark:bg-success-900/30 text-success-700',
      pending: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700',
      failed: 'bg-error-100 dark:bg-error-900/30 text-error-700',
    };
    return m[status] || m.pending;
  };

  const getStatusIcon = (status: string) => {
    const m: Record<string, React.ElementType> = { completed: CheckCircle, pending: Clock, failed: XCircle };
    return m[status] || Clock;
  };

  const getServiceIcon = (serviceType: string) => {
    const m: Record<string, React.ElementType> = { airtime: Smartphone, data: Wifi, electricity: Zap, cable: Tv };
    return m[serviceType] || Smartphone;
  };

  const getServiceColor = (serviceType: string) => {
    const m: Record<string, string> = { airtime: 'text-primary-500', data: 'text-accent-500', electricity: 'text-warning-500', cable: 'text-info-500' };
    return m[serviceType] || 'text-primary-500';
  };

  const totalAmount = filteredTransactions.reduce((s, t) => s + Number(t.amount), 0);
  const completedCount = filteredTransactions.filter(t => t.status === 'completed').length;
  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const failedCount = filteredTransactions.filter(t => t.status === 'failed').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-ginto font-bold text-black dark:text-white">Transaction Management</h1>
          <p className="text-black dark:text-white mt-1">Monitor and manage all platform transactions</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Amount', value: `₦${totalAmount.toLocaleString()}`, icon: CreditCard, color: 'primary' },
          { title: 'Completed', value: completedCount.toString(), icon: CheckCircle, color: 'success' },
          { title: 'Pending', value: pendingCount.toString(), icon: Clock, color: 'warning' },
          { title: 'Failed', value: failedCount.toString(), icon: XCircle, color: 'error' },
        ].map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">{stat.title}</p>
                <p className="text-xl font-ginto font-bold text-black dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                stat.color === 'primary' ? 'bg-primary-500' : stat.color === 'success' ? 'bg-success-500' : stat.color === 'warning' ? 'bg-warning-500' : 'bg-error-500'
              } text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white w-5 h-5" />
          <input type="text" placeholder="Search by user or service..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-dark-700">
              {filteredTransactions.map(tx => {
                const StatusIcon = getStatusIcon(tx.status);
                const ServiceIcon = getServiceIcon(tx.service_type);
                return (
                  <tr key={tx.id} className="hover:bg-neutral-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-black dark:text-white">{tx.user_name}</p>
                      <p className="text-sm text-black dark:text-white">{tx.user_email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <ServiceIcon className={`w-5 h-5 ${getServiceColor(tx.service_type)}`} />
                        <span className="text-sm text-black dark:text-white">{tx.service}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-black dark:text-white">₦{Number(tx.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{tx.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-black dark:text-white">{new Date(tx.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-black dark:text-white">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => { setSelectedTransaction(tx); setShowTransactionModal(true); }}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-black dark:text-white">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-dark-900/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-neutral-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-ginto font-semibold text-black dark:text-white">Transaction Details</h3>
                <button onClick={() => setShowTransactionModal(false)} className="p-2 text-black dark:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {React.createElement(getServiceIcon(selectedTransaction.service_type), { className: `w-8 h-8 ${getServiceColor(selectedTransaction.service_type)}` })}
                  <div>
                    <h4 className="text-base font-semibold text-black dark:text-white">{selectedTransaction.service}</h4>
                    <p className="text-black dark:text-white">#{selectedTransaction.id}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                  {React.createElement(getStatusIcon(selectedTransaction.status), { className: 'w-4 h-4' })}
                  <span>{selectedTransaction.status}</span>
                </span>
              </div>
              <div className="bg-neutral-50 dark:bg-dark-800 rounded-xl p-4">
                <p className="text-sm font-medium text-black dark:text-white mb-1">Amount</p>
                <p className="text-2xl font-ginto font-bold text-black dark:text-white">₦{Number(selectedTransaction.amount).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-black dark:text-white mb-1">User</p>
                  <p className="text-black dark:text-white">{selectedTransaction.user_name}</p>
                  <p className="text-sm text-black dark:text-white">{selectedTransaction.user_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black dark:text-white mb-1">Date</p>
                  <p className="text-black dark:text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;