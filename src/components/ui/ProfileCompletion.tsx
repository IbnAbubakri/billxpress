// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState } from 'react';
import { UserPlus, Mail, Info, Fingerprint, Banknote, Check, ChevronRight, X, Loader2 } from 'lucide-react';
import type { User, ProfileStep, BasicInfo, BankDetails, ProfileUpdateData } from '../../types';
import { validateBVN, validateAccountNumber } from '../../utils/validation';
import { trackEvent } from '../../utils/analytics';
import { useAuth } from '../../hooks/useAuth';
import EmailVerificationModal from '../profile/EmailVerificationModal';
import BVNModal from '../profile/BVNModal';
import BankDetailsModal from '../profile/BankDetailsModal';
import BasicInfoModal from '../profile/BasicInfoModal';

const STEPS: ProfileStep[] = [
  { label: 'Create account', description: 'Create BillXpress account', icon: 'UserPlus', completed: true },
  { label: 'Verify email', description: 'Verify your email address', icon: 'Mail', completed: false },
  { label: 'Add basic information', description: 'Add your address information', icon: 'Info', completed: false },
  { label: 'Link BVN', description: 'Link BVN to be able to withdraw', icon: 'Fingerprint', completed: false },
  { label: 'Add bank details', description: 'Save your bank details', icon: 'Banknote', completed: false },
];

const ICON_MAP: Record<string, React.ElementType> = { UserPlus, Mail, Info, Fingerprint, Banknote };

function StepIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon];
  if (!Icon) return null;
  return <Icon className={`w-6 h-6 ${className || 'text-secondary dark:text-white'}`} />;
}

interface ProfileCompletionProps {
  user: User | null;
  onUpdateProfile?: (data: ProfileUpdateData) => Promise<User>;
}

function ProfileCompletionSkeleton() {
  return (
    <div className="mb-6 w-full bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 relative animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-3" />
      <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3 mb-2">
          <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/2 mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileCompletion({ user, onUpdateProfile }: ProfileCompletionProps) {
  const { handleSendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const ts = localStorage.getItem('profileCompletionDismissed');
      if (!ts) return false;
      return Date.now() - Number(ts) < 86400000;
    }
    catch { return false; }
  });
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  const steps = STEPS.map((s) => ({
    ...s,
    completed: s.icon === 'UserPlus' ? true
      : s.icon === 'Mail' ? !!user?.emailVerified
      : s.icon === 'Info' ? !!(user?.billingStreet && user?.billingCity && user?.homeStreet && user?.homeCity)
      : s.icon === 'Fingerprint' ? !!user?.bvn
      : s.icon === 'Banknote' ? !!(user?.accountNumber && user?.bankName && user?.name && user?.phone)
      : s.completed,
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const percent = Math.round((completedCount / steps.length) * 100);
  const [collapsed, setCollapsed] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('profileCompletionDismissed', String(Date.now())); } catch { /* noop */ }
  };

  if (!user) return <ProfileCompletionSkeleton />;
  if (dismissed || steps.every(s => s.completed)) return null;

  return (
    <div className="mb-6 w-full bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 relative">
      <button
        onClick={() => setShowDismissConfirm(true)}
        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Dismiss profile completion"
        title="Skip for now"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-medium text-secondary dark:text-white">Complete your profile setup</h2>
          <span className="text-xs md:text-sm text-black dark:text-white">Finish setting up your account to enjoy BillXpress fully</span>
        </div>
        <span className="text-sm font-bold text-secondary dark:text-white flex-shrink-0">{percent}% complete</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 mb-4" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Profile ${percent}% complete`}>
        <div className="bg-secondary h-2 rounded-full transition-all duration-300 dark:bg-secondary" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <button className="text-xs text-black dark:text-white hover:underline" onClick={() => setCollapsed((p) => !p)}>
          {collapsed ? 'Show more' : 'Show less'}
        </button>
        <button onClick={() => setShowDismissConfirm(true)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          Skip for now
        </button>
      </div>
      {!collapsed && (
        <ul className="space-y-3">
          {steps.map((step, idx) => (
            <li key={idx}>
              {step.completed ? (
                <div className="flex items-center gap-4 p-3 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm opacity-60">
                  <div className="bg-gray-100 dark:bg-dark-700 rounded-xl p-2">
                    <StepIcon icon={step.icon} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-secondary dark:text-white">{step.label}</div>
                    <div className="text-sm text-black dark:text-white">{step.description}</div>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <button
                  onClick={() => setActiveStep(step.icon)}
                  className="flex items-center gap-4 p-3 w-full text-left bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm cursor-pointer hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700"
                >
                  <div className="bg-gray-100 dark:bg-dark-700 rounded-xl p-2">
                    <StepIcon icon={step.icon} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-secondary dark:text-white">{step.label}</div>
                    <div className="text-sm text-black dark:text-white">{step.description}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {activeStep && (
        <CallbackModals activeStep={activeStep} onClose={() => setActiveStep(null)} onUpdateProfile={onUpdateProfile} handleSendVerification={handleSendVerification} />
      )}

      {showDismissConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-label="Skip profile setup?">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl">
            <p className="text-sm text-black dark:text-white mb-4">Are you sure you want to skip profile setup? You can complete it later.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDismissConfirm(false)} className="w-1/2 bg-gray-200 dark:bg-dark-700 text-black dark:text-white py-2 rounded-xl font-medium hover:bg-gray-300 transition-colors text-sm">Cancel</button>
              <button onClick={handleDismiss} className="w-1/2 bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm">Skip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileCompletion;

function CallbackModals({ activeStep, onClose, onUpdateProfile, handleSendVerification }: { activeStep: string | null; onClose: () => void; onUpdateProfile?: (data: ProfileUpdateData) => Promise<User>; handleSendVerification: () => Promise<void> }) {
  if (activeStep === 'Mail') return <MailStep onClose={onClose} handleSendVerification={handleSendVerification} />;
  if (activeStep === 'Info') return <InfoStep onClose={onClose} onUpdateProfile={onUpdateProfile} />;
  if (activeStep === 'Fingerprint') return <FingerprintStep onClose={onClose} onUpdateProfile={onUpdateProfile} />;
  if (activeStep === 'Banknote') return <BanknoteStep onClose={onClose} onUpdateProfile={onUpdateProfile} />;
  return null;
}

function MailStep({ onClose, handleSendVerification }: { onClose: () => void; handleSendVerification: () => Promise<void> }) {
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    await handleSendVerification();
    setSent(true);
    trackEvent('resend_verification');
  };

  return (
    <EmailVerificationModal
      open={true}
      emailSent={sent}
      onClose={onClose}
      onSend={handleSend}
    />
  );
}

function InfoStep({ onClose, onUpdateProfile }: { onClose: () => void; onUpdateProfile?: (data: ProfileUpdateData) => Promise<User> }) {
  const [info, setInfo] = useState<BasicInfo>({ billingStreet: '', billingCity: '', billingState: '', billingCountry: '', homeStreet: '', homeCity: '', homeState: '', homeZip: '', avatar: null, avatarPreview: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const handleChange = (field: string, value: string | File | null) => {
    if (field === 'avatar' && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo((p) => ({ ...p, avatarPreview: reader.result as string }));
      };
      reader.readAsDataURL(value);
      setInfo((p) => ({ ...p, avatar: value }));
      return;
    }
    setInfo((p) => ({ ...p, [field]: value }));
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!info.billingStreet) errs.billingStreet = 'Required';
    if (!info.billingCity) errs.billingCity = 'Required';
    if (!info.homeStreet) errs.homeStreet = 'Required';
    if (!info.homeZip) errs.homeZip = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length === 0 && onUpdateProfile) {
      try {
        const payload: ProfileUpdateData = {
          billingStreet: info.billingStreet,
          billingCity: info.billingCity,
          billingState: info.billingState,
          billingCountry: info.billingCountry,
          homeStreet: info.homeStreet,
          homeCity: info.homeCity,
          homeState: info.homeState,
          homeZip: info.homeZip,
          avatar: info.avatarPreview,
        };
        await onUpdateProfile(payload);
        trackEvent('profile_step_completed', { step: 'basic_info' });
        onClose();
      } catch (err: unknown) {
        setGeneralError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to save. Please try again.');
      }
    }
  };

  return (
    <BasicInfoModal
      open={true}
      info={info}
      errors={errors}
      onClose={onClose}
      onChange={handleChange}
      onSave={handleSave}
      generalError={generalError}
    />
  );
}

function FingerprintStep({ onClose, onUpdateProfile }: { onClose: () => void; onUpdateProfile?: (data: ProfileUpdateData) => Promise<User> }) {
  const [bvn, setBvn] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    const err = validateBVN(bvn);
    setError(err);
    if (!err && onUpdateProfile) {
      try {
        await onUpdateProfile({ bvn });
        trackEvent('profile_step_completed', { step: 'bvn' });
        onClose();
      } catch (err: unknown) {
        setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to verify BVN. Please try again.');
      }
    }
  };

  return (
    <BVNModal
      open={true}
      bvn={bvn}
      error={error}
      onClose={onClose}
      onBVNChange={setBvn}
      onVerify={handleVerify}
    />
  );
}

function BanknoteStep({ onClose, onUpdateProfile }: { onClose: () => void; onUpdateProfile?: (data: ProfileUpdateData) => Promise<User> }) {
  const [details, setDetails] = useState<BankDetails>({ accountNumber: '', bankName: '', accountName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const handleChange = (f: string, v: string) => setDetails((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    const acctErr = validateAccountNumber(details.accountNumber);
    if (acctErr) errs.accountNumber = acctErr;
    if (!details.bankName) errs.bankName = 'Required';
    if (!details.accountName) errs.accountName = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length === 0 && onUpdateProfile) {
      try {
        await onUpdateProfile({
          accountNumber: details.accountNumber,
          bankName: details.bankName,
          accountName: details.accountName,
        });
        trackEvent('profile_step_completed', { step: 'bank_details' });
        onClose();
      } catch (err: unknown) {
        setGeneralError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to save bank details. Please try again.');
      }
    }
  };

  return (
    <BankDetailsModal
      open={true}
      details={details}
      errors={errors}
      onClose={onClose}
      onChange={handleChange}
      onSave={handleSave}
      generalError={generalError}
    />
  );
}
