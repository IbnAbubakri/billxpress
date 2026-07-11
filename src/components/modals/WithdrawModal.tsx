import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Banknote, Check } from 'lucide-react';
import type { User } from '../../types';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface Errors {
  amount?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
}

interface WithdrawModalProps {
  user: User | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const WithdrawModal = ({ user, onClose, onSuccess }: WithdrawModalProps) => {
  const containerRef = useFocusTrap(true, onClose);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const banks = [
    'Access Bank', 'Citibank', 'Diamond Bank', 'Ecobank Nigeria', 'Fidelity Bank',
    'First Bank of Nigeria', 'First City Monument Bank', 'Guaranty Trust Bank',
    'Heritage Bank', 'Keystone Bank', 'Polaris Bank', 'Providus Bank',
    'Stanbic IBTC Bank', 'Standard Chartered Bank', 'Sterling Bank',
    'Union Bank of Nigeria', 'United Bank For Africa', 'Unity Bank',
    'Wema Bank', 'Zenith Bank'
  ];

  const validateAmount = (amt: string) => {
    if (!amt) return 'Amount is required';
    const numAmount = Number(amt);
    if (isNaN(numAmount) || numAmount < 1000) return 'Minimum withdrawal is ₦1,000';
    if (numAmount > user.balance) return 'Insufficient balance';
    return null;
  };

  const validateAccountNumber = (accNum: string) => {
    if (!accNum) return 'Account number is required';
    if (accNum.length !== 10) return 'Account number must be 10 digits';
    return null;
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setAmount(cleaned);
    
    const error = validateAmount(cleaned);
    setErrors(prev => ({ ...prev, amount: error }));
  };

  const handleAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 10);
    setAccountNumber(cleaned);
    
    // Simulate account name lookup
    if (cleaned.length === 10) {
      setTimeout(() => {
        setAccountName(user?.name || 'Account Holder');
      }, 1000);
    } else {
      setAccountName('');
    }
    
    const error = validateAccountNumber(cleaned);
    setErrors(prev => ({ ...prev, accountNumber: error }));
  };

  const handleContinue = () => {
    const amountError = validateAmount(amount);
    const accountError = validateAccountNumber(accountNumber);
    
    const newErrors: Errors = {};
    if (amountError) newErrors.amount = amountError;
    if (!bankName) newErrors.bankName = 'Please select a bank';
    if (accountError) newErrors.accountNumber = accountError;
    if (!accountName) newErrors.accountName = 'Account name not found';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  const handleWithdraw = async () => {
    setStep(3);
    try {
      await axios.post('/api/wallet/withdraw', {
        amount: Number(amount),
        bank: bankName,
        accountNumber,
        accountName,
      }, { withCredentials: true });
      onSuccess?.();
    } catch {
      // ignore
    }
    closeTimerRef.current = setTimeout(() => onClose(), 2000);
  };

  const withdrawalFee = amount ? Math.max(50, Number(amount) * 0.01) : 0;
  const totalDeduction = Number(amount) + withdrawalFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-dark-900/80 flex items-center justify-center p-4 z-50">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-bold text-black dark:text-white">Withdraw Money</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-4">
            {/* Available Balance */}
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl">
              <p className="text-sm text-green-700">Available Balance</p>
              <p className="text-xl font-bold text-green-800">₦{user.balance.toLocaleString()}</p>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label htmlFor="withdrawAmount" className="block text-sm font-medium text-black dark:text-white mb-2">
                Withdrawal Amount
              </label>
              <input
                id="withdrawAmount"
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount to withdraw"
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base dark:bg-dark-900 dark:text-neutral-100 ${
                   errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-dark-600 dark:bg-dark-900 dark:text-neutral-100'
                 }`}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'withdrawAmount-error' : undefined}
              />
              {errors.amount && (
                <p id="withdrawAmount-error" className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Bank Selection */}
            <div className="mb-4">
              <label htmlFor="selectBank" className="block text-sm font-medium text-black dark:text-white mb-2">
                Select Bank
              </label>
              <select
                id="selectBank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-900 dark:text-neutral-100 ${
                   errors.bankName ? 'border-red-500' : 'border-gray-300 dark:border-dark-600 dark:bg-dark-900 dark:text-neutral-100'
                 }`}
                aria-invalid={!!errors.bankName}
                aria-describedby={errors.bankName ? 'selectBank-error' : undefined}
              >
                <option value="">Choose your bank</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              {errors.bankName && (
                <p id="selectBank-error" className="text-red-500 text-sm mt-1">{errors.bankName}</p>
              )}
            </div>

            {/* Account Number */}
            <div className="mb-4">
              <label htmlFor="withdrawAccountNumber" className="block text-sm font-medium text-black dark:text-white mb-2">
                Account Number
              </label>
              <input
                id="withdrawAccountNumber"
                type="text"
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="Enter 10-digit account number"
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-900 dark:text-neutral-100 ${
                   errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-dark-600 dark:bg-dark-900 dark:text-neutral-100'
                 }`}
                aria-invalid={!!errors.accountNumber}
                aria-describedby={errors.accountNumber ? 'withdrawAccountNumber-error' : undefined}
              />
              {accountName && (
                <p className="text-green-600 text-sm mt-1">Account Name: {accountName}</p>
              )}
              {errors.accountNumber && (
                <p id="withdrawAccountNumber-error" className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
              )}
            </div>

            {/* Fee Information */}
            {amount && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                <div className="flex justify-between text-sm mb-1">
                  <span>Withdrawal Amount:</span>
                  <span>₦{Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Processing Fee:</span>
                  <span>₦{withdrawalFee.toLocaleString()}</span>
                </div>
                <hr className="my-2 dark:border-dark-700" />
                <div className="flex justify-between font-medium">
                  <span>Total Deduction:</span>
                  <span>₦{totalDeduction.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-8 h-8 text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white mb-2">Confirm Withdrawal</h3>
              <p className="text-black dark:text-white">Review your withdrawal details</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Amount</span>
                <span className="font-medium">₦{Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Bank</span>
                <span className="font-medium">{bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Account Number</span>
                <span className="font-medium">{accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Account Name</span>
                <span className="font-medium">{accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Processing Fee</span>
                <span className="font-medium">₦{withdrawalFee.toLocaleString()}</span>
              </div>
              <hr className="dark:border-dark-700" />
              <div className="flex justify-between font-bold">
                <span>Total Deduction</span>
                <span>₦{totalDeduction.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 dark:border-dark-600 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-black dark:text-white mb-2">Withdrawal Initiated!</h3>
            <p className="text-black dark:text-white mb-4">
              Your withdrawal of ₦{Number(amount).toLocaleString()} is being processed
            </p>
            <p className="text-sm text-black dark:text-white mb-4">
              Funds will be credited to your account within 24 hours
            </p>
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;