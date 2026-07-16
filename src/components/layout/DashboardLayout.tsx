// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { LogoutButton } from './LogoutButton';
import { MobileNav } from './MobileNav';
import { NotificationBell } from './NotificationBell';
import type { User as AppUser } from "../../types";

interface DashboardLayoutProps {
  children: ReactNode;
  user: AppUser | null;
  onLogout: () => void;
}

const DashboardLayout = ({
  children,
  onLogout,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900">
      <a href="#main-content" className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-white focus-visible:text-slate-700 focus-visible:rounded-2xl focus-visible:shadow-lg focus-visible:outline-none">
        Skip to content
      </a>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-dark-800 shadow-xl">
          <Sidebar />
          <ThemeToggle />
          <LogoutButton onLogout={onLogout} />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
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
          className={`relative flex-1 flex flex-col max-w-xs w-full min-h-0 bg-white dark:bg-dark-800 shadow-xl transform transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
          <div className="flex-shrink-0 border-t dark:border-dark-700">
            <ThemeToggle />
            <LogoutButton onLogout={onLogout} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pl-[max(1rem,env(safe-area-inset-left))] flex flex-col flex-1 overflow-x-hidden">
        <main id="main-content" className="flex-1 pb-20 lg:pb-8 relative">
          {location.pathname === '/dashboard' && (
            <div className="lg:hidden fixed top-4 left-4 z-30">
              <button
                type="button"
                aria-label="Open sidebar"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-2xl bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm border border-neutral-200/50 dark:border-dark-700/50 shadow-lg shadow-neutral-200/50 dark:shadow-black/20 text-black dark:text-white hover:bg-white dark:hover:bg-dark-700 hover:shadow-xl hover:border-neutral-300 dark:hover:border-dark-600 active:scale-95 transition-all duration-200 ease-out"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
          {location.pathname === '/dashboard' && (
            <NotificationBell
              show={showNotifications}
              onToggle={() => setShowNotifications(!showNotifications)}
            />
          )}
          {children}
        </main>

        <MobileNav />
      </div>
    </div>
  );
};

export default DashboardLayout;
