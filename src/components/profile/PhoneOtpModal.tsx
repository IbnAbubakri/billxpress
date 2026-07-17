import { useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface PhoneOtpModalProps {
  open: boolean;
  pendingPhone: string;
  firstName: string;
  lastName: string;
  onClose: () => void;
  onUpdateProfile?: (data: Record<string, string>) => Promise<void>;
  onSuccess: () => void;
}

const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({ open, pendingPhone, firstName, lastName, onClose, onUpdateProfile, onSuccess }) => {
  const [otpCode, setOtpCode] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const ref = useFocusTrap(open, () => { onClose(); setOtpCode(''); setPhoneOtpError(''); });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-label="Verify phone number">
      <div ref={ref} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold text-black dark:text-white mb-2">Verify Phone Number</h2>
        <p className="text-sm text-black dark:text-white mb-4">Enter the OTP sent to {pendingPhone}</p>
        <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))} placeholder="6-digit OTP"
          className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl mb-3 text-center text-lg tracking-widest text-black dark:text-white bg-white dark:bg-dark-800"
        />
        {phoneOtpError && <p role="alert" className="text-red-500 text-sm mb-3">{phoneOtpError}</p>}
        <div className="flex gap-3">
          <button onClick={() => { onClose(); setOtpCode(''); setPhoneOtpError(''); }}
            className="w-1/2 bg-gray-200 text-black py-3 rounded-2xl hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={async () => {
            if (!otpCode || otpCode.length < 6) { setPhoneOtpError('Enter the 6-digit code.'); return; }
            setPhoneOtpError('');
            try {
              const { verifyOtp } = await import('../../api/client');
              await verifyOtp(pendingPhone, otpCode);
              const name = `${firstName.trim()} ${lastName.trim()}`;
              if (onUpdateProfile) {
                await onUpdateProfile({ name, phone: pendingPhone });
              }
              onClose();
              setOtpCode('');
              onSuccess();
            } catch {
              setPhoneOtpError('Invalid or expired OTP.');
            }
          }} className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl hover:bg-blue-700 transition-colors">Verify</button>
        </div>
      </div>
    </div>
  );
};

export default PhoneOtpModal;
