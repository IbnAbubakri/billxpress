// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  onLogout: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  return (
    <div className="px-2 pb-4">
      <button
        type="button"
        onClick={onLogout}
        className="group flex items-center px-3 py-3 text-sm font-medium rounded-2xl transition-all duration-200 w-full text-left text-red-600 hover:bg-red-50 active:scale-[0.98] cursor-pointer"
      >
        <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-400 group-hover:text-red-600" aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}
