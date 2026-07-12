import { useEffect, useRef } from "react";
import { Building2 } from "lucide-react";

interface BankDetails {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

interface BankDetailsModalProps {
  open: boolean;
  details: BankDetails;
  errors: Record<string, string>;
  onClose: () => void;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  generalError?: string;
}

const NIGERIAN_BANKS = [
  'Access Bank', 'Access Diamond Bank', 'Citi Bank', 'Ecobank',
  'Fidelity Bank', 'First Bank', 'First City Monument Bank (FCMB)',
  'Globus Bank', 'GTBank', 'Heritage Bank', 'Keystone Bank',
  'Kuda Bank', 'Moniepoint', 'OPay', 'PalmPay',
  'Parallex Bank', 'Polaris Bank', 'Providus Bank', 'Stanbic IBTC',
  'Standard Chartered', 'Sterling Bank', 'SunTrust Bank',
  'Taj Bank', 'Union Bank', 'United Bank for Africa (UBA)',
  'Unity Bank', 'Wema Bank', 'Zenith Bank',
];

const BankDetailsModal = ({
  open,
  details,
  errors,
  onClose,
  onChange,
  onSave,
  generalError,
}: BankDetailsModalProps) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80" role="dialog" aria-modal="true" aria-label="Add bank details">
      <div ref={modalRef} tabIndex={-1} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4 outline-none">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-black dark:text-white mb-2">
            Add Bank Details
          </h2>
          <p className="text-black dark:text-white mb-4">
            Provide your bank account information to receive payments.
          </p>
        </div>
        <form className="space-y-3">
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
              {generalError}
            </div>
          )}
          <div>
            <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-black dark:text-white mb-1">
              Account Number
            </label>
            <input
              id="bankAccountNumber"
              type="text"
              value={details.accountNumber}
              onChange={(e) =>
                onChange(
                  "accountNumber",
                  e.target.value.replace(/\D/g, "").substring(0, 10)
                )
              }
                className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-dark-800 text-black dark:text-white ${
                  errors.accountNumber ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
              aria-invalid={!!errors.accountNumber}
              aria-describedby={errors.accountNumber ? 'bankAccountNumber-error' : undefined}
            />
            {errors.accountNumber && (
              <p id="bankAccountNumber-error" className="text-red-500 text-xs mt-1">
                {errors.accountNumber}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-black dark:text-white mb-1">
              Bank Name
            </label>
            <select
              id="bankName"
              value={details.bankName}
              onChange={(e) => onChange("bankName", e.target.value)}
              className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-dark-800 text-black dark:text-white ${
                errors.bankName ? "border-red-500" : "border-gray-300 dark:border-dark-700"
              }`}
              aria-invalid={!!errors.bankName}
              aria-describedby={errors.bankName ? 'bankName-error' : undefined}
            >
              <option value="">Select your bank</option>
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            {errors.bankName && (
              <p id="bankName-error" className="text-red-500 text-xs mt-1">
                {errors.bankName}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="bankAccountName" className="block text-sm font-medium text-black dark:text-white mb-1">
              Account Name
            </label>
            <input
              id="bankAccountName"
              type="text"
              value={details.accountName}
              onChange={(e) => onChange("accountName", e.target.value)}
                className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-dark-800 text-black dark:text-white ${
                  errors.accountName ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
              aria-invalid={!!errors.accountName}
              aria-describedby={errors.accountName ? 'bankAccountName-error' : undefined}
            />
            {errors.accountName && (
              <p id="bankAccountName-error" className="text-red-500 text-xs mt-1">
                {errors.accountName}
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-gray-200 dark:bg-dark-700 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
            >
              Save Bank Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDetailsModal;
