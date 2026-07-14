// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { memo } from "react";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "../../hooks/useDarkMode";

export const ThemeToggle = memo(() => {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="px-2 pb-2">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-primary-50 hover:text-primary-700 w-full cursor-pointer active:scale-[0.98]"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    </div>
  );
});
