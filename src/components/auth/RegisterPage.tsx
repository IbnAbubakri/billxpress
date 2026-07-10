import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Wallet, Mail, Lock, User, Phone, ArrowLeft, CheckCircle2, Smartphone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateName, validateEmail, validatePhone } from '../../utils/validation';

interface RegisterPageProps {
  onRegister: (data: { email: string; password: string; phone?: string; name?: string }) => Promise<void>;
}

type Step = 'phone' | 'otp' | 'kyc' | 'password';

const RegisterPage = ({ onRegister }: RegisterPageProps) => {
  const { handleCheckPhone, handleSendOtp, handleVerifyOtp } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpDebugCode, setOtpDebugCode] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const inputClass = (field: string) =>
    `w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-black dark:text-white bg-white dark:bg-dark-800 ${errors[field] ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`;

  const handlePhoneSubmit = async () => {
    setGeneralError('');
    const phoneErr = validatePhone(phone);
    if (phoneErr) { setErrors({ phone: phoneErr }); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const result = await handleCheckPhone(phone);
      if (result.exists) {
        setPhoneExists(true);
      } else {
        setPhoneExists(false);
        setOtpSent(false);
        setStep('otp');
        await sendOtpCode();
      }
    } catch (err: unknown) {
      setGeneralError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtpCode = async () => {
    setIsLoading(true);
    try {
      const result = await handleSendOtp(phone);
      setOtpSent(true);
      setOtpDebugCode(result.code || '');
      setGeneralError('');
    } catch (err: unknown) {
      setGeneralError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    setGeneralError('');
    const code = otpCode.join('');
    if (code.length !== 6) { setErrors({ otp: 'Please enter the 6-digit code' }); return; }
    setErrors({});
    setIsLoading(true);
    try {
      await handleVerifyOtp(phone, code);
      setStep('kyc');
    } catch (err: unknown) {
      setGeneralError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKycSubmit = async () => {
    setGeneralError('');
    const newErrors: Record<string, string> = {};
    const fnErr = validateName(firstName, 'First name');
    if (fnErr) newErrors.firstName = fnErr;
    const lnErr = validateName(lastName, 'Last name');
    if (lnErr) newErrors.lastName = lnErr;
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const newErrors: Record<string, string> = {};
    if (password.length < 12) newErrors.password = 'Password must be at least 12 characters';
    if (!/[A-Z]/.test(password)) newErrors.password = newErrors.password || 'Must contain an uppercase letter';
    if (!/[a-z]/.test(password)) newErrors.password = newErrors.password || 'Must contain a lowercase letter';
    if (!/\d/.test(password)) newErrors.password = newErrors.password || 'Must contain a number';
    if (!/[^A-Za-z0-9]/.test(password)) newErrors.password = newErrors.password || 'Must contain a special character';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await onRegister({ email, password, phone, name: `${firstName} ${lastName}` });
    } catch (err: unknown) {
      setGeneralError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp') setStep('phone');
    else if (step === 'kyc') setStep('otp');
    else if (step === 'password') setStep('kyc');
    setGeneralError('');
    setErrors({});
  };

  const steps = [
    { key: 'phone', label: 'Phone', icon: Phone },
    { key: 'otp', label: 'Verify', icon: Smartphone },
    { key: 'kyc', label: 'Details', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
  ];

  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-secondary dark:text-white">Create Account</h2>
            <p className="text-black dark:text-white mt-2">Join BillXpress today</p>
          </div>

          {step !== 'phone' && (
            <button onClick={goBack} className="flex items-center text-sm text-secondary dark:text-white mb-4 hover:underline" aria-label="Go back">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
          )}

          <div className="flex justify-center mb-6">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx === currentIdx;
              const isDone = idx < currentIdx;
              return (
                <div key={s.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'bg-secondary text-white ring-2 ring-secondary/30' :
                    'bg-gray-200 dark:bg-dark-700 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200 dark:bg-dark-700'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm mb-4">{generalError}</div>
          )}

          {step === 'phone' && (
            <div className="space-y-4">
              {phoneExists ? (
                <div className="text-center space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-6 rounded-2xl">
                    <p className="font-medium">Account Already Exists</p>
                    <p className="text-sm mt-1">This phone number is already registered. Please sign in instead.</p>
                  </div>
                  <Link to="/login" className="block w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium text-center hover:bg-opacity-90 transition-all">
                    Sign In
                  </Link>
                  <button onClick={() => { setPhoneExists(false); setPhone(''); }} className="text-sm text-secondary dark:text-white hover:underline">
                    Use a different phone number
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-black dark:text-white text-center">Start by entering your phone number</p>
                  <div>
                    <label htmlFor="regPhone" className="block text-sm font-medium text-black dark:text-white mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                      <input id="regPhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass('phone')} placeholder="08012345678" aria-invalid={!!errors.phone} />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                  <button onClick={handlePhoneSubmit} disabled={isLoading || !phone} className="w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Checking...
                      </div>
                    ) : 'Continue'}
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-black dark:text-white text-center">
                Enter the 6-digit code sent to <strong>{phone}</strong>
              </p>
              {otpSent && (
                <button onClick={sendOtpCode} disabled={isLoading} className="text-xs text-secondary dark:text-white hover:underline block mx-auto">
                  Resend code
                </button>
              )}
              {otpDebugCode && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl text-sm text-center">
                  Demo mode: Your OTP is <strong className="text-lg tracking-widest">{otpDebugCode}</strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-3 text-center">Verification Code</label>
                <div className="flex justify-center gap-2">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-12 h-14 text-center text-lg font-bold border rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors.otp ? 'border-red-300 bg-red-50' : 'border-gray-300 dark:border-dark-700'} dark:bg-dark-800 dark:text-white`}
                      aria-label={`Digit ${idx + 1}`}
                    />
                  ))}
                </div>
                {errors.otp && <p className="mt-2 text-sm text-red-600 text-center">{errors.otp}</p>}
              </div>
              <button onClick={handleOtpSubmit} disabled={isLoading || otpCode.join('').length !== 6} className="w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Verifying...
                  </div>
                ) : 'Verify'}
              </button>
            </div>
          )}

          {step === 'kyc' && (
            <div className="space-y-4">
              <p className="text-sm text-black dark:text-white text-center">Tell us about yourself</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-black dark:text-white mb-2">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass('firstName')} placeholder="First name" aria-invalid={!!errors.firstName} />
                  </div>
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-black dark:text-white mb-2">Last Name</label>
                  <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={`w-full px-4 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors.lastName ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`} placeholder="Last name" aria-invalid={!!errors.lastName} />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="regEmail" className="block text-sm font-medium text-black dark:text-white mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                  <input id="regEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass('email')} placeholder="Enter your email" aria-invalid={!!errors.email} />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              <button onClick={handleKycSubmit} disabled={!firstName || !lastName || !email} className="w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                Continue
              </button>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-sm text-black dark:text-white text-center">Create a strong password</p>
              <div>
                <label htmlFor="regPassword" className="block text-sm font-medium text-black dark:text-white mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                  <input id="regPassword" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-12 pr-12 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors.password ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`} placeholder="Min 12 chars with uppercase, lowercase, number & special" aria-invalid={!!errors.password} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:text-black">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black dark:text-white mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                  <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full pl-12 pr-12 py-4 border rounded-2xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-dark-700'}`} placeholder="Confirm your password" aria-invalid={!!errors.confirmPassword} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:text-black">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
              <button type="submit" disabled={isLoading || !password || !confirmPassword} className="w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Creating Account...
                  </div>
                ) : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-black dark:text-white">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary dark:text-white hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
