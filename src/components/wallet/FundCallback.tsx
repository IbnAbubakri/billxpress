import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { verifyWalletFunding } from '../../api/client';

export default function FundCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [amountFunded, setAmountFunded] = useState<number | null>(null);
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      setStatus('error');
      setServerMessage('No payment reference found');
      return;
    }

    verifyWalletFunding(reference)
      .then((result) => {
        if (result.status === 'completed') {
          setStatus('success');
          setAmountFunded(result.amountFunded ?? null);
          setServerMessage(result.message);
        } else {
          setStatus('error');
          setServerMessage(`Status: ${result.status}`);
        }
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        setTimeout(() => navigate('/wallet'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setServerMessage(err?.response?.data?.error || err.message || 'Verification failed');
      });
  }, [searchParams, navigate, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying Payment</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we confirm your transaction...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">Your wallet has been funded. Redirecting...</p>
            {amountFunded !== null && amountFunded > 0 && (
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                ₦{amountFunded.toLocaleString()} has been verified
              </p>
            )}
            <p className="text-xs text-gray-400 mt-3">{serverMessage}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h2>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{serverMessage}</p>
            <button
              onClick={() => navigate('/wallet')}
              className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
            >
              Back to Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
