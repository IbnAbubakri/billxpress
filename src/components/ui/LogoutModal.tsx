import React from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface LogoutModalProps {
  show?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal = ({ show = true, onConfirm, onCancel }: LogoutModalProps) => {
  const containerRef = useFocusTrap(show, onCancel);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 dark:bg-dark-900/80">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
      >
        <h2 className="text-lg font-bold text-black dark:text-white mb-4 text-center">Confirm Logout</h2>
        <p className="text-black dark:text-white mb-4 text-center">Are you sure you want to logout?</p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LogoutModal);
