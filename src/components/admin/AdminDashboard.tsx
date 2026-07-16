// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import Seo from '../ui/Seo';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../../api/client';
import { colors } from '../../constants/theme';
import { useDarkMode } from '../../hooks/useDarkMode';
import {
  Users, DollarSign, CreditCard, TrendingUp,
  ArrowUpRight, Smartphone, Wifi, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const AdminDashboard = () => {
  const { isDark } = useDarkMode();
  const chartGridStroke = isDark ? '#334155' : '#f1f5f9';
  const chartTooltipStyle = { backgroundColor: isDark ? '#1e293b' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', color: isDark ? '#e2e8f0' : '#1e293b' };
  const chartAxisStroke = isDark ? '#94a3b8' : '#64748b';
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await walletApi.get('/admin/stats');
      return data.stats;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: revenueChart } = useQuery({
    queryKey: ['admin', 'revenue-chart'],
    queryFn: async () => {
      const { data } = await walletApi.get('/admin/revenue-chart');
      return data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: serviceDist } = useQuery({
    queryKey: ['admin', 'service-distribution'],
    queryFn: async () => {
      const { data } = await walletApi.get('/admin/service-distribution');
      return data.data as Array<{ name: string; value: number }>;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentTxns } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const { data } = await walletApi.get('/admin/transactions');
      return data.transactions;
    },
    staleTime: 60 * 1000,
  });

  const stats = [
    { title: 'Total Revenue', value: statsData ? `₦${Number(statsData.totalRevenue).toLocaleString()}` : '—', change: '', trend: 'up', icon: DollarSign, color: 'success' },
    { title: 'Active Users', value: statsData ? Number(statsData.totalUsers).toLocaleString() : '—', change: '', trend: 'up', icon: Users, color: 'primary' },
    { title: 'Transactions', value: statsData ? Number(statsData.totalTransactions).toLocaleString() : '—', change: '', trend: 'up', icon: CreditCard, color: 'accent' },
    { title: 'Success Rate', value: statsData ? `${statsData.successRate}%` : '—', change: '', trend: 'up', icon: TrendingUp, color: 'info' },
  ];

  const getColorClasses = (color: string) => {
    const m: Record<string, string> = { success: 'bg-success-500 text-white', primary: 'bg-slate-500 text-white', accent: 'bg-accent-500 text-white', info: 'bg-info-500 text-white' };
    return m[color] || m.primary;
  };

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = { completed: 'bg-success-100 dark:bg-success-900/30 text-success-700', pending: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700', failed: 'bg-error-100 dark:bg-error-900/30 text-error-700' };
    return m[status] || m.pending;
  };

  const serviceColors = [colors.primary, '#d946ef', '#22c55e', '#f59e0b', '#ef4444'];

  const transactions = Array.isArray(recentTxns) ? recentTxns : [];

  return (
    <div className="space-y-8">
      <Seo title="Admin Dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-ginto font-bold text-black dark:text-white">Dashboard Overview</h1>
          <p className="text-black dark:text-white mt-1">Monitor your VTU platform performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.2 }} className="stats-card group hover:scale-105 active:scale-[0.98]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">{stat.title}</p>
                <p className="text-xl font-bold text-black dark:text-white mt-1">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-medium ml-1 text-success-600">{stat.change}</span>
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.2 }} className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-ginto font-semibold text-black dark:text-white">Revenue Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChart || []}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="month" stroke={chartAxisStroke} fontSize={12} />
              <YAxis stroke={chartAxisStroke} fontSize={12} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke={colors.primary} fillOpacity={1} fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.2 }} className="chart-container">
          <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">Service Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={serviceDist || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {(serviceDist || []).map((_entry: { name: string; value: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={serviceColors[index] || colors.primary} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {(serviceDist || []).map((service: { name: string; value: number }, index: number) => (
              <div key={service.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: serviceColors[index] || colors.primary }} />
                  <span className="text-black dark:text-white">{service.name}</span>
                </div>
                <span className="font-medium text-black dark:text-white">{service.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.2 }} className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700">
        <div className="p-4 border-b border-neutral-100 dark:border-dark-700">
          <h2 className="text-base font-ginto font-semibold text-black dark:text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-dark-700">
              {transactions.map((tx: { id: number; user_name: string; service: string; amount: number; status: string; created_at: string }) => (
                <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-dark-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{tx.user_name?.charAt(0)}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-black dark:text-white">{tx.user_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {(tx.service || '').toLowerCase().includes('airtime') && <Smartphone className="w-4 h-4 text-slate-500" />}
                      {(tx.service || '').toLowerCase().includes('data') && <Wifi className="w-4 h-4 text-accent-500" />}
                      {(tx.service || '').toLowerCase().includes('electricity') && <Zap className="w-4 h-4 text-warning-500" />}
                      <span className="text-sm text-black dark:text-white">{tx.service}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-white">₦{Number(tx.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status)}`}>{tx.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-black dark:text-white">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;