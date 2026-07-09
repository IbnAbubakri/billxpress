import React from "react";
import { Mail } from "lucide-react";

interface EmailVerificationModalProps {
  open: boolean;
  emailSent: boolean;
  onClose: () => void;
  onSend: () => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  open,
  emailSent,
  onClose,
  onSend,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4">
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
            onClick={onSend}
            className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
          >
            Send Verification Email
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
