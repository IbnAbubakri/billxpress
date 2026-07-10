import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  total_spent: number;
  transactions: number;
  status: 'active' | 'suspended' | 'pending';
  joined_date: string;
  last_login: string;
}

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Mock data - replace with actual API calls
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Chidi Okonkwo',
      email: 'john.doe@email.com',
      phone: '+234 801 234 5678',
      balance: 15000,
      total_spent: 125000,
      transactions: 45,
      status: 'active',
      joined_date: '2024-01-15',
      last_login: '2024-01-20 14:30'
    },
    {
      id: 2,
      name: 'Ngozi Obi',
      email: 'jane.smith@email.com',
      phone: '+234 802 345 6789',
      balance: 8500,
      total_spent: 89000,
      transactions: 32,
      status: 'active',
      joined_date: '2024-01-10',
      last_login: '2024-01-19 09:15'
    },
    {
      id: 3,
      name: 'Emeka Okafor',
      email: 'mike.johnson@email.com',
      phone: '+234 803 456 7890',
      balance: 2500,
      total_spent: 45000,
      transactions: 18,
      status: 'suspended',
      joined_date: '2024-01-05',
      last_login: '2024-01-18 16:45'
    },
    {
      id: 4,
      name: 'Amina Mohammed',
      email: 'sarah.wilson@email.com',
      phone: '+234 804 567 8901',
      balance: 12000,
      total_spent: 156000,
      transactions: 67,
      status: 'active',
      joined_date: '2023-12-20',
      last_login: '2024-01-20 11:20'
    },
    {
      id: 5,
      name: 'Oluwaseun Adeyemi',
      email: 'david.brown@email.com',
      phone: '+234 805 678 9012',
      balance: 0,
      total_spent: 12000,
      transactions: 8,
      status: 'pending',
      joined_date: '2024-01-18',
      last_login: '2024-01-19 13:10'
    }
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (userId: number, newStatus: 'active' | 'suspended') => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-success-100 dark:bg-success-900/30 text-success-700',
      suspended: 'bg-error-100 dark:bg-error-900/30 text-error-700',
      pending: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: CheckCircle,
      suspended: XCircle,
      pending: Calendar
    };
    return icons[status as keyof typeof icons] || Calendar;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-ginto font-bold text-black dark:text-white">User Management</h1>
          <p className="text-black dark:text-white mt-1">Manage and monitor user accounts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: users.length.toString(), icon: Users, color: 'primary' },
          { title: 'Active Users', value: users.filter(u => u.status === 'active').length.toString(), icon: CheckCircle, color: 'success' },
          { title: 'Suspended', value: users.filter(u => u.status === 'suspended').length.toString(), icon: XCircle, color: 'error' },
          { title: 'Pending', value: users.filter(u => u.status === 'pending').length.toString(), icon: Calendar, color: 'warning' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">{stat.title}</p>
                <p className="text-xl font-ginto font-bold text-black dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                stat.color === 'primary' ? 'bg-primary-500' :
                stat.color === 'success' ? 'bg-success-500' :
                stat.color === 'error' ? 'bg-error-500' : 'bg-warning-500'
              } text-white`}>
                <stat.icon className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white w-5 h-5" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-dark-700">
              {filteredUsers.map((user) => {
                const StatusIcon = getStatusIcon(user.status);
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-neutral-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">{user.name}</p>
                          <p className="text-sm text-black dark:text-white">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-black dark:text-white">
                          <Mail className="w-4 h-4 text-black dark:text-white" aria-hidden="true" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-black dark:text-white">
                          <Phone className="w-4 h-4 text-black dark:text-white" aria-hidden="true" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-black dark:text-white">
                        ₦{user.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-black dark:text-white">
                        ₦{user.total_spent.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-black dark:text-white">{user.transactions}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{user.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewUserDetails(user)}
                          aria-label="View Details"
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                            aria-label="Suspend User"
                            className="p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg transition-colors"
                            title="Suspend User"
                          >
                            <Ban className="w-4 h-4" aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            aria-label="Activate User"
                            className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-colors"
                            title="Activate User"
                          >
                            <CheckCircle className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-dark-900/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-ginto font-semibold text-black dark:text-white">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  aria-label="Close modal"
                  className="p-2 text-black dark:text-white hover:text-black dark:hover:text-white rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedUser.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-black dark:text-white">{selectedUser.name}</h4>
                  <p className="text-black dark:text-white">{selectedUser.email}</p>
                  <p className="text-black dark:text-white">{selectedUser.phone}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-dark-800 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-success-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-black dark:text-white">Current Balance</span>
                  </div>
                  <p className="text-lg font-bold text-black dark:text-white">₦{selectedUser.balance.toLocaleString()}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-dark-800 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-primary-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-black dark:text-white">Total Spent</span>
                  </div>
                  <p className="text-lg font-bold text-black dark:text-white">₦{selectedUser.total_spent.toLocaleString()}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-dark-700">
                  <span className="text-black dark:text-white">Total Transactions</span>
                  <span className="font-medium text-black dark:text-white">{selectedUser.transactions}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-dark-700">
                  <span className="text-black dark:text-white">Account Status</span>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                    {React.createElement(getStatusIcon(selectedUser.status), { className: "w-3 h-3" })}
                    <span>{selectedUser.status}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-dark-700">
                  <span className="text-black dark:text-white">Joined Date</span>
                  <span className="font-medium text-black dark:text-white">
                    {new Date(selectedUser.joined_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-black dark:text-white">Last Login</span>
                  <span className="font-medium text-black dark:text-white">{selectedUser.last_login}</span>
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