// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Toast } from '../../hooks/useToast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-success-50 border-success-500 text-success-700',
  error: 'bg-error-50 border-error-500 text-error-700',
  info: 'bg-info-50 border-info-500 text-info-700',
  warning: 'bg-warning-50 border-warning-500 text-warning-700',
};

const iconStyles = {
  success: 'text-success-500',
  error: 'text-error-500',
  info: 'text-info-500',
  warning: 'text-warning-500',
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up ${styles[toast.type]}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconStyles[toast.type]}`} aria-hidden="true" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
