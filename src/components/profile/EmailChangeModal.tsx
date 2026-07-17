import { useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface EmailChangeModalProps {
  open: boolean;
  onClose: () => void;
  onUpdateProfile?: (data: Record<string, string>) => Promise<void>;
  setFormDataEmail: (email: string) => void;
}

const EmailChangeModal: React.FC<EmailChangeModalProps> = ({ open, onClose, onUpdateProfile, setFormDataEmail }) => {
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');
  const [emailChangeSent, setEmailChangeSent] = useState(false);
  const ref = useFocusTrap(open, () => { onClose(); setNewEmail(''); setEmailChangeError(''); });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-label="Change email address">
      <div ref={ref} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold text-black dark:text-white mb-4">Change Email Address</h2>
        {!emailChangeSent ? (
          <>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address"
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl mb-3 text-black dark:text-white bg-white dark:bg-dark-800"
            />
            {emailChangeError && <p role="alert" className="text-red-500 text-sm mb-3">{emailChangeError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { onClose(); setNewEmail(''); setEmailChangeError(''); }}
                className="w-1/2 bg-gray-200 text-black py-3 rounded-2xl hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={async () => {
                if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                  setEmailChangeError('Enter a valid email address.'); return;
                }
                setEmailChangeError('');
                try {
                  await onUpdateProfile?.({ email: newEmail });
                  setEmailChangeSent(true);
                  setFormDataEmail(newEmail);
                } catch (err: unknown) {
                  setEmailChangeError(err instanceof Error ? err.message : 'Failed to update email.');
                }
              }} className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl hover:bg-blue-700 transition-colors">Save</button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-green-600 mb-4">Email updated. Verification email sent to your new address.</p>
            <button onClick={() => { onClose(); setEmailChangeSent(false); setNewEmail(''); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailChangeModal;
