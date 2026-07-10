import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart3, 
  DollarSign, 
  Users, 
  CreditCard, 
  User, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Sun,
  Moon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Pricing Control', href: '/admin/pricing', icon: DollarSign },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
    { name: 'Profile', href: '/admin/profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-dark-900">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary-700 focus:rounded-2xl focus:shadow-lg focus:outline-none">
        Skip to content
      </a>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-dark-800 shadow-xl lg:static lg:translate-x-0 lg:shadow-none border-r border-neutral-200 dark:border-dark-700"
      >
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-6 py-6 border-b border-neutral-200 dark:border-dark-700">
            <Logo />
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
                className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-200 dark:border-dark-700">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-neutral-50 dark:bg-dark-900">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate">
                  {user?.email || 'Admin'}
                </p>
                <p className="text-xs text-black dark:text-white truncate">
                  Administrator
                </p>
              </div>
            </div>
            <button
              onClick={toggle}
              className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-primary-50 dark:hover:bg-dark-700 hover:text-primary-700 dark:hover:text-primary-400 w-full"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full mt-3 flex items-center space-x-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-dark-800 border-b border-neutral-200 dark:border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-700 transition-colors"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="hidden md:flex items-center space-x-2 bg-neutral-50 dark:bg-dark-900 rounded-2xl px-4 py-2 w-96">
                <Search className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search transactions, users..."
                  className="bg-transparent border-none outline-none flex-1 text-sm placeholder-neutral-400"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button aria-label="Notifications" className="relative p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-700 transition-colors">
                <Bell className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <main id="admin-content" className="flex-1 overflow-auto p-4">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
