// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { type ReactNode } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface ConfirmModalProps {
  show?: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  icon?: ReactNode;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

const ConfirmModal = ({
  show = true,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  icon,
  isLoading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) => {
  const containerRef = useFocusTrap(show, onCancel);

  if (!show) return null;

  const confirmBtnClass =
    confirmVariant === "danger"
      ? "bg-red-500 text-white hover:bg-red-600"
      : "bg-secondary text-white hover:bg-opacity-90";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-dark-900/80">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4"
      >
        {icon && <div className="text-center mb-4">{icon}</div>}
        <h2 className="text-lg font-bold text-black dark:text-white mb-4 text-center">{title}</h2>
        {message && (
          <p className="text-black dark:text-white mb-4 text-center">{message}</p>
        )}
        {children && <div className="mb-4">{children}</div>}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-2xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtnClass}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Processing...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConfirmModal);
