import { useEffect, useRef, useState } from "react";
import { Mail, Loader2 } from "lucide-react";

interface EmailVerificationModalProps {
  open: boolean;
  emailSent: boolean;
  onClose: () => void;
  onSend: () => Promise<void>;
}

const EmailVerificationModal = ({
  open,
  emailSent,
  onClose,
  onSend,
}: EmailVerificationModalProps) => {
  const [sending, setSending] = useState(false);
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

  const handleSend = async () => {
    setSending(true);
    try { await onSend(); } finally { setSending(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80" role="dialog" aria-modal="true" aria-label="Verify your email">
      <div ref={modalRef} tabIndex={-1} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4 outline-none">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-black dark:text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-black dark:text-white mb-4">
            We'll send a verification link to your email address.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            {sending ? 'Sending...' : 'Send Verification Email'}
          </button>
        </div>
        {emailSent && (
          <p className="text-green-600 text-center mt-4">
            Verification email sent!
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationModal;
