// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import Seo from '../ui/Seo';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Wallet, Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { validateEmail, validatePassword } from '../../utils/validation';
import { forgotPassword, resetPassword } from '../../api/client';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (value: string) => {
    setEmail(value);
    const err = validateEmail(value);
    setError(err);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setError(err); return; }
    setIsLoading(true);
    setGeneralError('');
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err: unknown) {
      setGeneralError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    const pwErr = validatePassword(newPassword);
    if (pwErr) { setPasswordError(pwErr); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setIsLoading(true);
    try {
      await resetPassword(resetToken!, newPassword);
      setIsSuccess(true);
    } catch (err: unknown) {
      setPasswordError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetToken) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-secondary dark:text-white">Set New Password</h2>
              <p className="text-black dark:text-white mt-2">Enter your new password</p>
            </div>
            <form onSubmit={handleNewPassword} className="space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{passwordError}</div>
              )}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-black dark:text-white mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-dark-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-transparent transition-all"
                    placeholder="Min 12 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-black dark:text-white mb-2">Confirm Password</label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-dark-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-transparent transition-all"
                  placeholder="Confirm new password"
                />
              </div>
              <button type="submit" disabled={isLoading || !newPassword || !confirmPassword} className="w-full bg-primary text-white py-4 px-4 rounded-2xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-secondary dark:text-white mb-4">Check Your Email</h2>
            <p className="text-black dark:text-white mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-black dark:text-white mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <Link to="/login" className="inline-flex items-center text-secondary dark:text-white hover:underline font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 flex items-center justify-center px-4">
      <Seo title="Reset Password" />
      <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-secondary dark:text-white">Reset Password</h2>
            <p className="text-black dark:text-white mt-2">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleSendReset} className="space-y-4">
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{generalError}</div>
            )}
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-black dark:text-white mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                <input
                  id="resetEmail"
                  type="email"
                  value={email}
                  onChange={(e) => handleChange(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-transparent transition-all ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`}
                  placeholder="Enter your email"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'resetEmail-error' : undefined}
                />
              </div>
              {error && <p id="resetEmail-error" role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 px-4 rounded-2xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Sending Reset Link...
                </div>
              ) : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center text-secondary dark:text-white hover:underline font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
