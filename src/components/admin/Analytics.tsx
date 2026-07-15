// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { colors } from '../../constants/theme';
import { useDarkMode } from '../../hooks/useDarkMode';
import { TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  daily: Array<{ day: string; revenue: number; transactions: number }>;
  serviceStats: Array<{ service: string; transactions: number; revenue: number }>;
  userGrowth: Array<{ month: string; new_users: number }>;
}

const Analytics: React.FC = () => {
  const { isDark } = useDarkMode();
  const chartGridStroke = isDark ? '#334155' : '#f1f5f9';
  const chartTooltipStyle = { backgroundColor: isDark ? '#1e293b' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', color: isDark ? '#e2e8f0' : '#1e293b' };
  const chartAxisStroke = isDark ? '#94a3b8' : '#64748b';
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const { data } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/analytics', { withCredentials: true });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const totalRevenue = data?.daily?.reduce((s, d) => s + Number(d.revenue), 0) || 0;
  const totalUsers = data?.userGrowth?.reduce((s, d) => s + Number(d.new_users), 0) || 0;
  const totalTxns = data?.daily?.reduce((s, d) => s + Number(d.transactions), 0) || 0;

  const metrics = [
    { title: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, change: '', icon: DollarSign, color: 'success' },
    { title: 'New Users', value: totalUsers.toLocaleString(), change: '', icon: Users, color: 'primary' },
    { title: 'Transactions', value: totalTxns.toLocaleString(), change: '', icon: Activity, color: 'accent' },
    { title: 'Success Rate', value: '—', change: '', icon: TrendingUp, color: 'info' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-ginto font-bold text-black dark:text-white">Analytics Dashboard</h1>
          <p className="text-black dark:text-white mt-1">Comprehensive insights into your VTU platform</p>
        </div>
        <div className="flex items-center space-x-3">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-4 py-2 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div key={metric.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.2 }} className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">{metric.title}</p>
                <p className="text-xl font-bold text-black dark:text-white mt-1">{metric.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                metric.color === 'success' ? 'bg-success-500' : metric.color === 'primary' ? 'bg-slate-500' : metric.color === 'accent' ? 'bg-accent-500' : 'bg-info-500'
              } text-white`}>
                <metric.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.2 }} className="chart-container">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
          <h2 className="text-base font-ginto font-semibold text-black dark:text-white">Performance Overview</h2>
          <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)} className="px-3 py-2 bg-neutral-50 dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            <option value="revenue">Revenue</option>
            <option value="transactions">Transactions</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data?.daily || []}>
            <defs>
              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
            <XAxis dataKey="day" stroke={chartAxisStroke} fontSize={12} />
            <YAxis stroke={chartAxisStroke} fontSize={12} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Area type="monotone" dataKey={selectedMetric} stroke={colors.primary} fillOpacity={1} fill="url(#performanceGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.2 }} className="chart-container">
          <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">Service Performance</h2>
          <div className="space-y-3">
            {(data?.serviceStats || []).map((svc: { service: string; transactions: number; revenue: number }) => (
              <div key={svc.service} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-black dark:text-white">{svc.service}</p>
                  <p className="text-sm text-black dark:text-white">₦{Number(svc.revenue).toLocaleString()} • {svc.transactions} transactions</p>
                </div>
              </div>
            ))}
            {(!data?.serviceStats || data.serviceStats.length === 0) && (
              <p className="text-black dark:text-white text-center py-4">No service data yet</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.2 }} className="chart-container">
          <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="month" stroke={chartAxisStroke} fontSize={12} />
              <YAxis stroke={chartAxisStroke} fontSize={12} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="new_users" fill={colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;