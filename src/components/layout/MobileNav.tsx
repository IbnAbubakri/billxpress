// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  History,
  User,
} from "lucide-react";

interface MobileNavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const mobileNavItems: MobileNavItem[] = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/transactions", label: "History", icon: History },
  { path: "/profile", label: "Profile", icon: User },
];

function MobileNavItem({ item }: { item: MobileNavItem }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors cursor-pointer ${
        isActive ? "text-secondary dark:text-white" : "text-black dark:text-white"
      }`}
    >
      <Icon
        className={`h-5 w-5 mb-1 ${
          isActive ? "text-secondary dark:text-white" : "text-black dark:text-white"
        }`}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}

export function MobileNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-800 border-t dark:border-dark-700 shadow-lg z-40 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex">
        {mobileNavItems.map((item) => (
          <MobileNavItem key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
}
