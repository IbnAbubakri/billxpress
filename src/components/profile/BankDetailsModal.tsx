import React from "react";
import { User } from "lucide-react";

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
}

const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  open,
  details,
  errors,
  onClose,
  onChange,
  onSave,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-black dark:text-white mb-2">
            Add Bank Details
          </h2>
          <p className="text-black dark:text-white mb-4">
            Provide your bank account information to receive payments.
          </p>
        </div>
        <form className="space-y-3">
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
              className={`w-full px-4 py-2 border rounded-xl ${
                errors.accountNumber ? "border-red-500" : "border-gray-300"
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
            <input
              id="bankName"
              type="text"
              value={details.bankName}
              onChange={(e) => onChange("bankName", e.target.value)}
              className={`w-full px-4 py-2 border rounded-xl ${
                errors.bankName ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.bankName}
              aria-describedby={errors.bankName ? 'bankName-error' : undefined}
            />
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
              className={`w-full px-4 py-2 border rounded-xl ${
                errors.accountName ? "border-red-500" : "border-gray-300"
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
              className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300 transition-colors"
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
