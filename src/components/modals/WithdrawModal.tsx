// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Lock, Loader2 } from 'lucide-react';
import type { User } from '../../types';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { withdrawFunds, getBanks, resolveAccountNumber } from '../../api/client';
import { useToast } from '../../hooks/useToast';

interface Errors {
  amount?: string | null;
  bank?: string | null;
  accountNumber?: string | null;
  transactionPin?: string | null;
}

interface Bank {
  name: string;
  code: string;
}

interface WithdrawModalProps {
  user: User | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const WithdrawModal = ({ user, onClose, onSuccess }: WithdrawModalProps) => {
  const containerRef = useFocusTrap(true, onClose);
  const { addToast } = useToast();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectedBank = banks.find((b) => b.code === bankCode) || null;
  const requiresPin = !!user?.hasTransactionPin;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { banks: list } = await getBanks();
        if (!cancelled) setBanks(list);
      } catch (err) {
        if (!cancelled) {
          setBanksError(err instanceof Error ? err.message : 'Could not load banks. Please try again.');
        }
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const resolveName = useCallback(async (accNum: string, code: string) => {
    setResolving(true);
    setResolveError(null);
    setAccountName('');
    try {
      const { accountName: name } = await resolveAccountNumber(accNum, code);
      setAccountName(name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not resolve account name.';
      setResolveError(msg);
      setAccountName('');
    } finally {
      setResolving(false);
    }
  }, []);

  const handleAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 10);
    setAccountNumber(cleaned);
    setAccountName('');
    setResolveError(null);
    setErrors((prev) => ({ ...prev, accountNumber: null }));
    if (cleaned.length === 10 && bankCode) {
      resolveName(cleaned, bankCode);
    }
  };

  const handleBankChange = (code: string) => {
    setBankCode(code);
    setErrors((prev) => ({ ...prev, bank: null }));
    setAccountName('');
    setResolveError(null);
    if (code && accountNumber.length === 10) {
      resolveName(accountNumber, code);
    }
  };

  const validateAmount = (amt: string) => {
    if (!amt) return 'Amount is required';
    const numAmount = Number(amt);
    if (isNaN(numAmount) || numAmount < 1000) return 'Minimum withdrawal is ₦1,000';
    if (numAmount > Number(user?.balance || 0)) return 'Insufficient balance';
    return null;
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setAmount(cleaned);
    setErrors((prev) => ({ ...prev, amount: validateAmount(cleaned) }));
  };

  const handleContinueToAmount = () => {
    const newErrors: Errors = {};
    if (accountNumber.length !== 10) newErrors.accountNumber = 'Account number must be 10 digits';
    if (!bankCode) newErrors.bank = 'Please select a bank';
    if (!newErrors.accountNumber && !newErrors.bank && !accountName) {
      newErrors.accountNumber = resolveError || 'Enter a valid account number and bank to continue';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) setStep(2);
  };

  const handleConfirmAmount = () => {
    const amountError = validateAmount(amount);
    if (amountError) {
      setErrors({ amount: amountError });
      return;
    }
    setErrors({});
    if (requiresPin) {
      setStep(3);
    } else {
      handleWithdraw();
    }
  };

  const handleWithdraw = async () => {
    if (requiresPin && transactionPin.length !== 6) {
      setErrors((prev) => ({ ...prev, transactionPin: 'PIN must be 6 digits' }));
      return;
    }
    setStep(4);
    try {
      await withdrawFunds(
        Number(amount),
        selectedBank?.name || '',
        accountNumber,
        accountName,
        requiresPin ? transactionPin : undefined,
      );
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.';
      addToast(msg, 'error');
      if (requiresPin) {
        setErrors({ transactionPin: msg });
        setTransactionPin('');
        setStep(3);
      } else {
        setErrors({ amount: msg });
        setStep(2);
      }
    }
  };

  const withdrawalFee = amount ? Math.max(50, Number(amount) * 0.01) : 0;
  const totalDeduction = Number(amount) + withdrawalFee;
  const canProceed = accountNumber.length === 10 && !!bankCode && !!accountName && !resolving;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-dark-900/80 flex items-center justify-center p-4 z-50">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-describedby={step >= 2 ? `withdraw-desc-${step}` : undefined}
        className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-bold text-black dark:text-white">Withdraw Money</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-[0.98]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-4">
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl">
              <p className="text-sm text-green-700">Available Balance</p>
              <p className="text-xl font-bold text-green-800">
                ₦{Number(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Account Number */}
            <div className="mb-4">
              <label htmlFor="withdrawAccountNumber" className="block text-sm font-medium text-black dark:text-white mb-2">
                Account Number
              </label>
              <input
                id="withdrawAccountNumber"
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="Enter 10-digit account number"
                className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-base dark:bg-dark-900 dark:text-neutral-100 ${
                  errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                }`}
                aria-invalid={!!errors.accountNumber}
                aria-describedby={errors.accountNumber ? 'withdrawAccountNumber-error' : undefined}
              />
              {errors.accountNumber && (
                <p id="withdrawAccountNumber-error" role="alert" className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
              )}
            </div>

            {/* Bank Selection */}
            <div className="mb-4">
              <label htmlFor="selectBank" className="block text-sm font-medium text-black dark:text-white mb-2">
                Bank
              </label>
              <select
                id="selectBank"
                value={bankCode}
                onChange={(e) => handleBankChange(e.target.value)}
                disabled={banksLoading || !!banksError}
                className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent dark:bg-dark-900 dark:text-neutral-100 disabled:opacity-60 ${
                  errors.bank ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                }`}
                aria-invalid={!!errors.bank}
                aria-describedby={errors.bank ? 'selectBank-error' : undefined}
              >
                <option value="">{banksLoading ? 'Loading banks…' : 'Choose your bank'}</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>{bank.name}</option>
                ))}
              </select>
              {banksError && (
                <p className="text-red-500 text-sm mt-1">{banksError}</p>
              )}
              {errors.bank && (
                <p id="selectBank-error" role="alert" className="text-red-500 text-sm mt-1">{errors.bank}</p>
              )}
            </div>

            {/* Resolved Account Name */}
            {(resolving || accountName || resolveError) && (
              <div className="mb-4">
                <span className="block text-sm font-medium text-black dark:text-white mb-2">Account Name</span>
                <div
                  className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl border ${
                    resolveError
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : 'border-green-300 bg-green-50 dark:bg-green-900/20'
                  }`}
                >
                  {resolving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" aria-hidden="true" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Verifying account…</span>
                    </>
                  ) : resolveError ? (
                    <span role="alert" className="text-sm text-red-600 dark:text-red-400">{resolveError}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                      <span className="font-medium text-green-800 dark:text-green-300">{accountName}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleContinueToAmount}
              disabled={!canProceed}
              className="w-full bg-primary text-white py-4 rounded-2xl font-medium hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-4">
            <div className="mb-4 p-4 bg-slate-50 dark:bg-dark-700/50 rounded-2xl">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-300">To</span>
                <span className="font-medium text-black dark:text-white">{accountName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Bank</span>
                <span className="font-medium text-black dark:text-white">{selectedBank?.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-600 dark:text-slate-300">Account No.</span>
                <span className="font-medium text-black dark:text-white tracking-wide">{accountNumber}</span>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="withdrawAmount" className="block text-sm font-medium text-black dark:text-white mb-2">
                Withdrawal Amount
              </label>
              <input
                id="withdrawAmount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount to withdraw"
                className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-base dark:bg-dark-900 dark:text-neutral-100 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                }`}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'withdrawAmount-error' : undefined}
              />
              {errors.amount && (
                <p id="withdrawAmount-error" role="alert" className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

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

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 dark:border-dark-600 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-dark-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirmAmount}
                disabled={!amount || !!validateAmount(amount)}
                className="flex-1 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white mb-2">Enter Transaction PIN</h3>
              <p id="withdraw-desc-3" className="text-sm text-black dark:text-white">
                Authorize this withdrawal of ₦{Number(amount).toLocaleString()} with your 6-digit PIN
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="withdrawPin" className="block text-sm font-medium text-black dark:text-white mb-2">
                Transaction PIN
              </label>
              <input
                id="withdrawPin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={transactionPin}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').substring(0, 6);
                  setTransactionPin(cleaned);
                  setErrors((prev) => ({ ...prev, transactionPin: null }));
                }}
                placeholder="Enter 6-digit PIN"
                className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-center tracking-widest text-base dark:bg-dark-900 dark:text-neutral-100 ${
                  errors.transactionPin ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                }`}
                aria-invalid={!!errors.transactionPin}
                aria-describedby={errors.transactionPin ? 'withdrawPin-error' : undefined}
              />
              {errors.transactionPin && (
                <p id="withdrawPin-error" role="alert" className="text-red-500 text-sm mt-1">{errors.transactionPin}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => { setErrors((prev) => ({ ...prev, transactionPin: null })); setStep(2); }}
                className="flex-1 py-3 border border-gray-300 dark:border-dark-600 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-dark-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Back
              </button>
              <button
                onClick={handleWithdraw}
                disabled={transactionPin.length !== 6}
                className="flex-1 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-black dark:text-white mb-2">Withdrawal Initiated!</h3>
            <p id="withdraw-desc-4" className="text-black dark:text-white mb-4">
              Your withdrawal of ₦{Number(amount).toLocaleString()} is being processed
            </p>
            <p className="text-sm text-black dark:text-white mb-4">
              Funds will be credited to {accountName} within 24 hours
            </p>
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-2xl font-medium hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;
