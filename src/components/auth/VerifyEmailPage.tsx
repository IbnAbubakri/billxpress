// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../../api/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Logo } from '../ui/Logo';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.error || 'Verification failed. The link may be expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-slate-500 animate-spin mb-4" aria-hidden="true" />
            <p className="text-black dark:text-white">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">Email Verified</h2>
            <p className="text-black dark:text-white mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">Verification Failed</h2>
            <p className="text-black dark:text-white mb-6">{message}</p>
            <Link
              to="/login"
              className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
