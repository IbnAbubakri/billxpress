// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { initializeWalletFunding } from '../../api/client';

interface FundWalletModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const FundWalletModal: React.FC<FundWalletModalProps> = ({ onClose, onSuccess }) => {
  const containerRef = useFocusTrap(true, onClose);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const paymentMethods = [
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Pay with your bank card',
      icon: CreditCard,
      color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer from your bank account',
      icon: Banknote,
      color: 'bg-green-100 dark:bg-green-900/50 text-green-600'
    },
    {
      id: 'ussd',
      name: 'USSD',
      description: 'Pay using your phone',
      icon: Smartphone,
      color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600'
    }
  ];

  const quickAmounts = ['1000', '2000', '5000', '10000', '20000', '50000'];

  const validateAmount = (amt: string) => {
    if (!amt) return 'Amount is required';
    const numAmount = Number(amt);
    if (isNaN(numAmount) || numAmount < 100) return 'Minimum amount is ₦100';
    if (numAmount > 500000) return 'Maximum amount is ₦500,000';
    return null;
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setAmount(cleaned);
    
    const error = validateAmount(cleaned);
    setErrors(prev => ({ ...prev, amount: error }));
  };

  const handleContinue = () => {
    const amountError = validateAmount(amount);
    
    const newErrors: Record<string, string | null> = {};
    if (amountError) newErrors.amount = amountError;
    if (!selectedMethod) newErrors.method = 'Please select a payment method';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  const handlePayment = async () => {
    setStep(3);
    try {
      const result = await initializeWalletFunding(Number(amount));
      window.location.href = result.authorization_url;
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setErrors({ payment: 'Failed to initialize payment. Please try again.' });
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-dark-900/80 flex items-center justify-center p-4 z-50">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-bold text-black dark:text-white">Fund Wallet</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-4">
            {/* Amount Input */}
            <div className="mb-4">
              <label htmlFor="fundAmount" className="block text-sm font-medium text-black dark:text-white mb-2">
                Enter Amount
              </label>
              <input
                id="fundAmount"
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount to fund"
                className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-base dark:bg-dark-900 dark:text-neutral-100 ${
                   errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-dark-600 dark:bg-dark-900 dark:text-neutral-100'
                 }`}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'fundAmount-error' : undefined}
              />
              {errors.amount && (
                <p id="fundAmount-error" className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className={`py-2 px-2 md:px-4 border-2 rounded-xl font-medium text-sm md:text-sm transition-all ${
                      amount === quickAmount
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                        : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:border-dark-600'
                    }`}
                  >
                    ₦{Number(quickAmount).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Payment Method
              </label>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-4 border-2 rounded-2xl transition-all text-left ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${method.color}`}>
                          <IconComponent className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">{method.name}</p>
                          <p className="text-sm text-black dark:text-white">{method.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.method && (
                <p className="text-red-500 text-sm mt-1">{errors.method}</p>
              )}
            </div>

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
                <CreditCard className="w-8 h-8 text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white mb-2">Confirm Payment</h3>
              <p className="text-black dark:text-white">Review your funding details</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Amount</span>
                <span className="font-medium">₦{Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Payment Method</span>
                <span className="font-medium">
                  {paymentMethods.find(m => m.id === selectedMethod)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Processing Fee</span>
                <span className="font-medium">₦0.00</span>
              </div>
              <hr className="dark:border-dark-700" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₦{Number(amount).toLocaleString()}</span>
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
                onClick={handlePayment}
                className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
              >
                Pay Now
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <h3 className="text-base font-bold text-black dark:text-white mb-2">Redirecting to Payment...</h3>
            <p className="text-black dark:text-white">
              You'll be redirected to Paystack's secure checkout page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundWalletModal;