// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";

interface BVNModalProps {
  open: boolean;
  bvn: string;
  error: string;
  onClose: () => void;
  onBVNChange: (value: string) => void;
  onVerify: () => void;
}

const BVNModal = ({
  open,
  bvn,
  error,
  onClose,
  onBVNChange,
  onVerify,
}: BVNModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 50);
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-dark-900/80" role="dialog" aria-modal="true" aria-label="Link your BVN">
      <div ref={modalRef} tabIndex={-1} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4 outline-none">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-black dark:text-white mb-2">
            Link Your BVN
          </h2>
          <p className="text-black dark:text-white mb-4">
            Enter your BVN to verify your identity.
          </p>
        </div>
        <div className="mb-4">
          <input
            id="bvnInput"
            type="text"
            value={bvn}
            onChange={(e) =>
              onBVNChange(e.target.value.replace(/\D/g, "").substring(0, 11))
            }
            placeholder="Enter 11-digit BVN"
            className={`w-full px-4 py-3 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white ${
              error ? "border-red-500" : "border-gray-300 dark:border-dark-700"
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? 'bvnInput-error' : undefined}
          />
          {error && (
            <p id="bvnInput-error" role="alert" className="text-red-500 text-xs mt-1">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-1/2 bg-gray-200 dark:bg-dark-700 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onVerify}
            className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
          >
            Verify BVN
          </button>
        </div>
      </div>
    </div>
  );
};

export default BVNModal;
