import { useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface AccountDeletionModalProps {
  open: boolean;
  onClose: () => void;
  handleDeleteAccount: (password: string) => Promise<void>;
  onLogout: () => void;
}

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ open, onClose, handleDeleteAccount, onLogout }) => {
  const [deletionConfirmText, setDeletionConfirmText] = useState('');
  const [deletionPassword, setDeletionPassword] = useState('');
  const ref = useFocusTrap(open, () => { onClose(); setDeletionConfirmText(''); setDeletionPassword(''); });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-label="Delete account">
      <div ref={ref} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold text-red-600 mb-2">Delete Account</h2>
        <p className="text-sm text-black dark:text-white mb-4">This action is permanent. All your data will be deleted. Enter your password and type <strong>DELETE</strong> to confirm.</p>
        <input type="password" value={deletionPassword} onChange={(e) => setDeletionPassword(e.target.value)} placeholder="Enter your password"
          className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl mb-3 text-black dark:text-white bg-white dark:bg-dark-800"
        />
        <input type="text" value={deletionConfirmText} onChange={(e) => setDeletionConfirmText(e.target.value)} placeholder="Type DELETE"
          className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl mb-3 text-black dark:text-white bg-white dark:bg-dark-800"
        />
        <div className="flex gap-3">
          <button onClick={() => { onClose(); setDeletionConfirmText(''); setDeletionPassword(''); }}
            className="w-1/2 bg-gray-200 text-black py-3 rounded-2xl hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={async () => {
            if (deletionConfirmText !== 'DELETE' || !deletionPassword) return;
            try {
              await handleDeleteAccount(deletionPassword);
              onLogout();
            } catch { console.warn('[ProfilePage] Account deletion failed'); }
          }} className="w-1/2 bg-red-600 text-white py-3 rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={deletionConfirmText !== 'DELETE' || !deletionPassword}>Delete My Account</button>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletionModal;
