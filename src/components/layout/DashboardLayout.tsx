import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Phone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
  ArrowRightLeft,
  Target,
  Wallet,
  History,
  User,
  Menu,
  X,
  Bell,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Logo } from '../ui/Logo';
import type { User as AppUser } from "../../types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: AppUser | null;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { path: "/airtime", label: "Buy Airtime", icon: Phone },
    { path: "/data", label: "Buy Data", icon: Wifi },
    { path: "/tv", label: "Cable TV", icon: Tv },
    { path: "/electricity", label: "Electricity", icon: Zap },
    { path: "/education", label: "Education", icon: GraduationCap },
    {
      path: "/airtime-to-cash",
      label: "Airtime to Cash",
      icon: ArrowRightLeft,
    },
    { path: "/betting", label: "Betting", icon: Target },
    { path: "/wallet", label: "Wallet", icon: Wallet },
    { path: "/transactions", label: "Transactions", icon: History },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const mobileNavigationItems = [
    { path: "/dashboard", label: "Home", icon: LayoutDashboard },
    { path: "/wallet", label: "Wallet", icon: Wallet },
    { path: "/transactions", label: "History", icon: History },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-primary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-xl">
          <div className="flex h-16 flex-shrink-0 items-center px-4 border-b dark:border-dark-700">
            <Logo />
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-2xl transition-all duration-200 w-full text-left ${
                      isActive(item.path)
                        ? "bg-primary text-secondary shadow-sm"
                        : "text-black dark:text-white hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-secondary"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.path)
                          ? "text-secondary"
                          : "text-black dark:text-white group-hover:text-secondary"
                      }`}
                      aria-hidden="true"
                    />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="px-2 pb-2">
              <button
                onClick={toggle}
                className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-primary-50 hover:text-primary-700 w-full"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
            <div className="px-2 pb-4">
              <button
                onClick={onLogout}
                className="group flex items-center px-3 py-3 text-sm font-medium rounded-2xl transition-all duration-200 w-full text-left text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-400 group-hover:text-red-600" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed inset-0 flex z-40 ${
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl transform transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              aria-label="Close sidebar"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-4">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-base leading-none">X</span>
              </div>
              <span className="text-lg font-bold text-secondary">BillXpress</span>
            </div>
            <nav className="px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-2xl transition-all duration-200 w-full text-left ${
                      isActive(item.path)
                        ? "bg-primary text-secondary shadow-sm"
                        : "text-black dark:text-white hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-secondary"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.path)
                          ? "text-secondary"
                          : "text-black dark:text-white group-hover:text-secondary"
                      }`}
                      aria-hidden="true"
                    />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="px-2 pb-2">
            <button
              onClick={toggle}
              className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-primary-50 hover:text-primary-700 w-full"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
          <div className="px-2 pb-4">
            <button
              onClick={onLogout}
              className="group flex items-center px-3 py-3 text-sm font-medium rounded-2xl transition-all duration-200 w-full text-left text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-400 group-hover:text-red-600" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </div>

        {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm lg:hidden">
          <button
            aria-label="Open sidebar"
            className="px-4 border-r border-gray-200 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-base font-semibold text-secondary">
                {navigationItems.find((item) => item.path === location.pathname)
                  ?.label || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center">
              <button aria-label="Notifications" className="p-2 rounded-full text-black dark:text-white hover:text-secondary hover:bg-gray-100">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-20 lg:pb-8">{children}</main>

        {/* Mobile bottom navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="flex">
            {mobileNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                    isActive(item.path) ? "text-secondary" : "text-black dark:text-white"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mb-1 ${
                      isActive(item.path) ? "text-secondary" : "text-black dark:text-white"
                    }`}
                    aria-hidden="true"
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
