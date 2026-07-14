// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Logo } from '../ui/Logo';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navigationItems: NavItem[] = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/airtime", label: "Buy Airtime", icon: Phone },
  { path: "/data", label: "Buy Data", icon: Wifi },
  { path: "/tv", label: "Cable TV", icon: Tv },
  { path: "/electricity", label: "Electricity", icon: Zap },
  { path: "/education", label: "Education", icon: GraduationCap },
  { path: "/airtime-to-cash", label: "Airtime to Cash", icon: ArrowRightLeft },
  { path: "/betting", label: "Betting", icon: Target },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/transactions", label: "Transactions", icon: History },
  { path: "/profile", label: "Profile", icon: User },
];

function NavItem({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left cursor-pointer ${
        isActive
          ? "bg-primary-50 text-primary-700 dark:bg-dark-700 dark:text-primary-300 shadow-sm"
          : "text-black dark:text-white hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-secondary"
      }`}
    >
      <Icon
        className={`mr-3 h-5 w-5 flex-shrink-0 ${
          isActive
            ? "text-primary-700 dark:text-primary-300"
            : "text-black dark:text-white group-hover:text-secondary"
        }`}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <>
      <div className="flex-shrink-0 flex items-center px-4 h-16 border-b dark:border-dark-700">
        <Logo />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigationItems.map((item) => (
            <NavItem key={item.path} item={item} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>
    </>
  );
}
