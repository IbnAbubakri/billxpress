// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import type { ReactNode } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface ConfirmModalProps {
  show?: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  icon?: ReactNode;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 dark:bg-dark-900/80">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
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
            className={`flex-1 py-3 rounded-2xl font-medium transition-colors ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
