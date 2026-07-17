import { Lock } from 'lucide-react';

interface SecurityTabProps {
  formData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    transactionPin: string;
  };
  errors: Record<string, string | null>;
  handleInputChange: (field: string, value: string) => void;
  handlePasswordChange: () => void;
  handlePinChange: () => void;
  setShowAccountDeletionModal: (v: boolean) => void;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  formData, errors, handleInputChange,
  handlePasswordChange, handlePinChange, setShowAccountDeletionModal,
}) => (
  <div>
    <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Security Settings</h2>

    <div className="mb-6">
      <h3 className="text-base font-medium text-black dark:text-white mb-4">Change Password</h3>
      <div className="space-y-3">
        {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-black dark:text-white mb-2">
              {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
            </label>
            <input
              id={field}
              type="password"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 text-black dark:text-white bg-white dark:bg-dark-800 ${
                errors[field] ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
              }`}
              aria-invalid={!!errors[field]}
              aria-describedby={errors[field] ? `${field}-error` : undefined}
            />
            {errors[field] && (
              <p id={`${field}-error`} role="alert" className="text-red-500 text-sm mt-1">{errors[field]}</p>
            )}
          </div>
        ))}
        <button onClick={handlePasswordChange} className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors">
          Update Password
        </button>
      </div>
    </div>

    <div>
      <h3 className="text-base font-medium text-black dark:text-white mb-4">Change Transaction PIN</h3>
      <div className="space-y-3">
        <div>
          <label htmlFor="transactionPin" className="block text-sm font-medium text-black dark:text-white mb-2">New Transaction PIN</label>
          <input
            id="transactionPin" type="password" maxLength={4}
            value={formData.transactionPin}
            onChange={(e) => handleInputChange('transactionPin', e.target.value.replace(/\D/g, '').substring(0, 4))}
            placeholder="Enter 4-digit PIN"
            className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 text-black dark:text-white bg-white dark:bg-dark-800 ${
              errors.transactionPin ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
            }`}
            aria-invalid={!!errors.transactionPin}
            aria-describedby={errors.transactionPin ? 'transactionPin-error' : undefined}
          />
          {errors.transactionPin && (
            <p id="transactionPin-error" role="alert" className="text-red-500 text-sm mt-1">{errors.transactionPin}</p>
          )}
        </div>
        <button onClick={handlePinChange} className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors">
          Update PIN
        </button>
      </div>
    </div>

    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
      <h3 className="text-base font-medium text-red-600 mb-2">Danger Zone</h3>
      <p className="text-sm text-black dark:text-white mb-4">Permanently delete your account and all associated data.</p>
      <button onClick={() => setShowAccountDeletionModal(true)}
        className="px-6 py-3 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-colors">
        Delete Account
      </button>
    </div>
  </div>
);

export default SecurityTab;
