import React, { useState } from 'react';
import type { User, ProfileStep, BasicInfo, BankDetails, ProfileUpdateData } from '../../types';
import { validateBVN, validateAccountNumber } from '../../utils/validation';
import EmailVerificationModal from '../profile/EmailVerificationModal';
import BVNModal from '../profile/BVNModal';
import BankDetailsModal from '../profile/BankDetailsModal';
import BasicInfoModal from '../profile/BasicInfoModal';

const STEPS: ProfileStep[] = [
  { label: 'Create account', description: 'Create BillXpress account', icon: 'UserPlus', completed: true },
  { label: 'Verify email', description: 'Verify your email address', icon: 'Mail', completed: false },
  { label: 'Add basic information', description: 'Start paying your bills', icon: 'Info', completed: false },
  { label: 'Link BVN', description: 'Link BVN to be able to withdraw', icon: 'Fingerprint', completed: false },
  { label: 'Add bank details', description: 'Save your bank details', icon: 'Banknote', completed: false },
];

function StepIcon({ icon, className }: { icon: string; className?: string }) {
  const svgPaths: Record<string, string> = {
    UserPlus: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M20 8v6 M23 11h-6',
    Mail: 'M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2 M3 7l9 6 9-6',
    Info: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01',
    Fingerprint: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    Banknote: 'M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  };

  const paths = svgPaths[icon];
  if (!paths) return null;

  return (
    <svg className={`w-6 h-6 ${className || 'text-secondary dark:text-white'}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      {paths.split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  );
}

interface ProfileCompletionProps {
  user: User | null;
  onUpdateProfile?: (data: ProfileUpdateData) => Promise<User>;
}

function ProfileCompletion({ user, onUpdateProfile }: ProfileCompletionProps) {
  const steps = STEPS.map((s) => ({
    ...s,
    completed: s.icon === 'UserPlus' ? true
      : s.icon === 'Mail' ? !!user?.emailVerified
      : s.icon === 'Info' ? !!(user?.billingStreet && user?.billingCity)
      : s.icon === 'Fingerprint' ? !!user?.bvn
      : s.icon === 'Banknote' ? !!(user?.accountNumber && user?.bankName)
      : s.completed,
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const percent = Math.round((completedCount / steps.length) * 100);
  const [collapsed, setCollapsed] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  return (
    <div className="mb-6 w-full bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-4">
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
      <button className="text-xs text-black dark:text-white hover:underline mb-4" onClick={() => setCollapsed((p) => !p)}>
        {collapsed ? 'Show more' : 'Show less'}
      </button>
      {!collapsed && (
        <ul className="space-y-3">
          {steps.map((step, idx) => (
            <li
              key={idx}
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
