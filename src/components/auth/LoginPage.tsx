import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone, Lock, Send } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { sendVerificationEmail } from '../../api/client';
import { validateEmail } from '../../utils/validation';
import { getErrorMessage } from '../../utils/errors';

interface LoginPageProps {
  onLogin: (login: string, password: string) => Promise<void>;
}

function isValidEmail(v: string) {
  return !validateEmail(v);
}

function isValidPhone(v: string) {
  const cleaned = v.replace(/[\s\-()]/g, '');
  return cleaned.length >= 10 && /^[\d+]+$/.test(cleaned);
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const isPhone = isValidPhone(formData.login);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      if (field === 'login') {
        if (!value) next.login = 'Email or phone is required';
        else if (!isValidEmail(value) && !isValidPhone(value)) next.login = 'Enter a valid email or phone number';
        else delete next.login;
      }
      if (field === 'password') {
        if (!value) next.password = 'Password is required'; else delete next.password;
      }
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const newErrors: Record<string, string> = {};
    if (!formData.login) newErrors.login = 'Email or phone is required';
    else if (!isValidEmail(formData.login) && !isValidPhone(formData.login)) newErrors.login = 'Enter a valid email or phone number';
    if (!formData.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await onLogin(formData.login, formData.password);
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Logo iconOnly />
            </div>
            <h2 className="text-xl font-bold text-secondary dark:text-white">Welcome Back</h2>
            <p className="text-black dark:text-white mt-2">Sign in to your BillXpress account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{generalError}</div>
            )}
            {generalError.toLowerCase().includes('verify your email') && !verificationSent && (
              <button
                onClick={async () => {
                  setResendingVerification(true);
                  try {
                    await sendVerificationEmail(formData.login);
                    setVerificationSent(true);
                  } catch { /* ignore */ }
                  setResendingVerification(false);
                }}
                disabled={resendingVerification}
                className="flex items-center justify-center w-full text-sm text-secondary dark:text-white hover:underline font-medium mt-2"
              >
                <Send className="w-4 h-4 mr-1" aria-hidden="true" />
                {resendingVerification ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
            {verificationSent && (
              <p role="status" className="text-sm text-green-600 text-center mt-2">Verification email sent. Check your inbox.</p>
            )}

            <div>
              <label htmlFor="login" className="block text-sm font-medium text-black dark:text-white mb-2">Email or Phone Number</label>
              <div className="relative">
                {isPhone ? (
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                )}
                <input
                  id="login"
                  type="text"
                  value={formData.login}
                  onChange={(e) => handleChange('login', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-transparent transition-all text-black dark:text-white bg-white dark:bg-dark-800 ${errors.login ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`}
                  placeholder="Enter your email or phone number"
                  aria-invalid={!!errors.login}
                  aria-describedby={errors.login ? 'login-error' : undefined}
                />
              </div>
              {errors.login && <p id="login-error" className="mt-1 text-sm text-red-600">{errors.login}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black dark:text-white mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 border rounded-2xl focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-transparent transition-all text-black dark:text-white bg-white dark:bg-dark-800 ${errors.password ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`}
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:text-black dark:text-white dark:hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link to="/reset-password" className="text-sm text-secondary dark:text-white hover:underline font-medium">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Signing In...
                </div>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-black dark:text-white">
              Don't have an account?{' '}
              <Link to="/register" className="text-secondary dark:text-white hover:underline font-medium">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
