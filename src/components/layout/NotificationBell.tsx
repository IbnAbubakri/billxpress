// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Bell } from "lucide-react";

interface NotificationBellProps {
  show: boolean;
  onToggle: () => void;
}

export function NotificationBell({ show, onToggle }: NotificationBellProps) {
  return (
    <div className="lg:hidden absolute top-4 right-4 z-30">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={show}
        onClick={onToggle}
        className="p-2 rounded-full bg-white dark:bg-dark-800 shadow-md text-black dark:text-white hover:text-secondary cursor-pointer active:scale-[0.98]"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
      </button>
      {show && (
        <div className="absolute top-12 right-0 w-72 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border dark:border-dark-700 overflow-hidden">
          <div className="p-4 border-b dark:border-dark-700">
            <h3 className="font-semibold text-black dark:text-white">Notifications</h3>
          </div>
          <div className="p-8 text-center text-black dark:text-white text-sm">
            No new notifications
          </div>
        </div>
      )}
    </div>
  );
}
