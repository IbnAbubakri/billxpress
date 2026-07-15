// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../../api/client';
import { Users, Search, CheckCircle, XCircle } from 'lucide-react';

interface AppUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  role: string;
  joined_date: string;
  last_login: string;
}

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await walletApi.get('/admin/users');
      return data.users as AppUser[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const users = usersData || [];

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const viewUserDetails = (user: AppUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getStatusColor = (role: string) =>
    role === 'admin' ? 'bg-slate-100 dark:bg-dark-700 text-slate-700' : 'bg-success-100 dark:bg-success-900/30 text-success-700';

  const activeUsers = users.filter(u => u.role !== 'suspended').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-ginto font-bold text-black dark:text-white">User Management</h1>
          <p className="text-black dark:text-white mt-1">Manage and monitor user accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: users.length.toString(), icon: Users, color: 'primary' },
          { title: 'Active Users', value: activeUsers.toString(), icon: CheckCircle, color: 'success' },
        ].map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.2 }} className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">{stat.title}</p>
                <p className="text-xl font-bold text-black dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                stat.color === 'primary' ? 'bg-slate-500' : 'bg-success-500'
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
          <input type="text" placeholder="Search users by name, email, or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-dark-700">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-neutral-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{user.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-black dark:text-white">{user.name}</p>
                        <p className="text-sm text-black dark:text-white">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-black dark:text-white">{user.email}</p>
                    <p className="text-sm text-black dark:text-white">{user.phone}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-black dark:text-white">₦{Number(user.balance).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.role)}`}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => viewUserDetails(user)} aria-label="View Details"
                      className="p-2 text-slate-600 hover:bg-slate-50 dark:hover:bg-dark-700 rounded-lg transition-colors">
                      <Search className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-black dark:text-white">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-dark-900/80">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeIn' }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-neutral-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-ginto font-semibold text-black dark:text-white">User Details</h2>
                <button onClick={() => setShowUserModal(false)} aria-label="Close modal" className="p-2 text-black dark:text-white hover:text-black dark:hover:text-white rounded-lg transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-slate-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{selectedUser.name?.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-black dark:text-white">{selectedUser.name}</h4>
                  <p className="text-black dark:text-white">{selectedUser.email}</p>
                  <p className="text-black dark:text-white">{selectedUser.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-dark-800 rounded-xl p-4">
                  <p className="text-sm font-medium text-black dark:text-white mb-1">Balance</p>
                  <p className="text-lg font-bold text-black dark:text-white">₦{Number(selectedUser.balance).toLocaleString()}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-dark-800 rounded-xl p-4">
                  <p className="text-sm font-medium text-black dark:text-white mb-1">Role</p>
                  <p className="text-lg font-bold text-black dark:text-white capitalize">{selectedUser.role}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-dark-700">
                  <span className="text-black dark:text-white">Joined</span>
                  <span className="font-medium text-black dark:text-white">{new Date(selectedUser.joined_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-black dark:text-white">Last Login</span>
                  <span className="font-medium text-black dark:text-white">{new Date(selectedUser.last_login).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;