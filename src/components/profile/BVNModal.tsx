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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4">
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
            className={`w-full px-4 py-3 border rounded-2xl ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? 'bvnInput-error' : undefined}
          />
          {error && (
            <p id="bvnInput-error" className="text-red-500 text-xs mt-1">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300 transition-colors"
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
