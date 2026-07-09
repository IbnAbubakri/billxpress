import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Wallet, Mail, Lock, User, Phone } from 'lucide-react';
import { validateName, validateEmail, validatePhone } from '../../utils/validation';

interface RegisterPageProps {
  onRegister: (email: string, password: string) => Promise<void>;
}

const RegisterPage = ({ onRegister }: RegisterPageProps) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateField = useCallback((field: string, value: string, allData: typeof formData) => {
    const errs: Record<string, string> = {};
    if (field === 'firstName') errs.firstName = validateName(value, 'First name');
    if (field === 'lastName') errs.lastName = validateName(value, 'Last name');
    if (field === 'email') errs.email = validateEmail(value);
    if (field === 'phone') errs.phone = value ? '' : 'Phone number is required';
    if (field === 'password') {
      if (value.length < 12) errs.password = 'Password must be at least 12 characters';
      if (!/[A-Z]/.test(value)) errs.password = errs.password || 'Password must contain at least one uppercase letter';
      if (!/[a-z]/.test(value)) errs.password = errs.password || 'Password must contain at least one lowercase letter';
      if (!/\d/.test(value)) errs.password = errs.password || 'Password must contain at least one number';
      if (!/[^A-Za-z0-9]/.test(value)) errs.password = errs.password || 'Password must contain at least one special character';
      if (allData.confirmPassword && value !== allData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (field === 'confirmPassword') {
      if (!value) errs.confirmPassword = 'Please confirm your password';
      else if (value !== allData.password) errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  }, []);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        const fieldErrors = validateField(field, value, next);
        Object.entries(fieldErrors).forEach(([k, v]) => { if (v) newErrors[k] = v; else delete newErrors[k]; });
        return newErrors;
      });
      return next;
    });
  }, [validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (formData.email) { const e = validateEmail(formData.email); if (e) newErrors.email = e; } else newErrors.email = 'Email is required';
    if (formData.password.length < 12) newErrors.password = 'Password must be at least 12 characters';
    if (!/[A-Z]/.test(formData.password)) newErrors.password = newErrors.password || 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(formData.password)) newErrors.password = newErrors.password || 'Password must contain a lowercase letter';
    if (!/\d/.test(formData.password)) newErrors.password = newErrors.password || 'Password must contain a number';
    if (!/[^A-Za-z0-9]/.test(formData.password)) newErrors.password = newErrors.password || 'Password must contain a special character';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await onRegister(formData.email, formData.password);
    } catch (err: any) {
      setGeneralError(err?.response?.data?.error || err?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = useMemo(() =>
    formData.firstName && formData.lastName && formData.email && formData.phone && formData.password && formData.confirmPassword && Object.keys(errors).length === 0,
    [formData, errors],
  );

  const inputClass = (field: string) =>
    `w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors[field] ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`;

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-secondary">Create Account</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Join BillXpress today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{generalError}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" aria-hidden="true" />
                  <input id="firstName" type="text" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className={inputClass('firstName')} placeholder="First name" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'firstName-error' : undefined} />
                </div>
                {errors.firstName && <p id="firstName-error" className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                <input id="lastName" type="text" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className={`w-full px-4 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors.lastName ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`} placeholder="Last name" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'lastName-error' : undefined} />
                {errors.lastName && <p id="lastName-error" className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" aria-hidden="true" />
                <input id="registerEmail" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass('email')} placeholder="Enter your email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'registerEmail-error' : undefined} />
              </div>
              {errors.email && <p id="registerEmail-error" className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" aria-hidden="true" />
                <input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass('phone')} placeholder="08012345678" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} />
              </div>
              {errors.phone && <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" aria-hidden="true" />
                <input id="registerPassword" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleChange('password', e.target.value)} className={`w-full pl-12 pr-12 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors.password ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`} placeholder="Create a strong password (min 12 chars)" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'registerPassword-error' : undefined} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="registerPassword-error" className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" aria-hidden="true" />
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className={`w-full pl-12 pr-12 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`} placeholder="Confirm your password" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.confirmPassword && <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Creating Account...
                </div>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
