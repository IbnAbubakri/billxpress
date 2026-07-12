import React, { useState } from 'react';
import { UserPlus, Mail, Info, Fingerprint, Banknote, Check, ChevronRight, X } from 'lucide-react';
import type { User, ProfileStep, BasicInfo, BankDetails, ProfileUpdateData } from '../../types';
import { validateBVN, validateAccountNumber } from '../../utils/validation';
import { trackEvent } from '../../utils/analytics';
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

function ProfileCompletion({ user, onUpdateProfile }: ProfileCompletionProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem('profileCompletionDismissed');
      if (!stored) return false;
      return Date.now() - Number(stored) < 86400000;
    }
    catch { return false; }
  });

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

  if (dismissed || steps.every(s => s.completed)) return null;

  return (
    <div className="mb-6 w-full bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4 relative">
      <button
        onClick={handleDismiss}
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
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div className="bg-secondary h-2 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <button className="text-xs text-black dark:text-white hover:underline" onClick={() => setCollapsed((p) => !p)}>
          {collapsed ? 'Show more' : 'Show less'}
        </button>
        <button onClick={handleDismiss} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          Skip for now
        </button>
      </div>
      {!collapsed && (
        <ul className="space-y-3">
          {steps.map((step, idx) => (
            <li
              key={idx}
              role={step.completed ? 'listitem' : 'button'}
              tabIndex={step.completed ? undefined : 0}
              onKeyDown={step.completed ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') setActiveStep(step.icon); }}
              className={`flex items-center gap-4 p-3 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm ${!step.completed ? 'cursor-pointer hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700' : 'opacity-60'}`}
              onClick={() => { if (!step.completed) setActiveStep(step.icon); }}
            >
              <div className="bg-gray-100 dark:bg-dark-700 rounded-xl p-2">
                <StepIcon icon={step.icon} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-secondary dark:text-white">{step.label}</div>
                <div className="text-sm text-black dark:text-white">{step.description}</div>
              </div>
              <div className={step.completed ? 'text-green-500' : 'text-gray-300'}>
                {step.completed ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CallbackModals activeStep={activeStep} onClose={() => setActiveStep(null)} onUpdateProfile={onUpdateProfile} />
    </div>
  );
}

export default ProfileCompletion;

function CallbackModals({ activeStep, onClose, onUpdateProfile }: { activeStep: string | null; onClose: () => void; onUpdateProfile?: (data: ProfileUpdateData) => Promise<User> }) {
  if (activeStep === 'Mail') return <MailStep onClose={onClose} />;
  if (activeStep === 'Info') return <InfoStep onClose={onClose} onUpdateProfile={onUpdateProfile} />;
  if (activeStep === 'Fingerprint') return <FingerprintStep onClose={onClose} onUpdateProfile={onUpdateProfile} />;
  if (activeStep === 'Banknote') return <BanknoteStep onClose={onClose} onUpdateProfile={onUpdateProfile} />;
  return null;
}

function MailStep({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    trackEvent('email_verified');
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
        };
        if (info.avatarPreview) payload.avatar = info.avatarPreview;
        await onUpdateProfile(payload);
        trackEvent('profile_step_completed', { step: 'basic_info' });
        onClose();
      } catch { /* error handled by mutation */ }
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
      } catch { /* error handled by mutation */ }
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
      } catch { /* error handled by mutation */ }
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
    />
  );
}
