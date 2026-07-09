import React, { useState } from 'react';
import type { User, ProfileStep, BasicInfo, BankDetails } from '../../types';
import { validateEmail, validateBVN, validateAccountNumber } from '../../utils/validation';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
    <svg className={`w-6 h-6 ${className || 'text-secondary'}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      {paths.split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  );
}

interface ProfileCompletionProps {
  user: User | null;
}

function ProfileCompletion({ user }: ProfileCompletionProps) {
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
          <h2 className="text-base md:text-xl font-medium text-secondary">Complete your profile setup</h2>
          <span className="text-xs md:text-sm text-black dark:text-white">Finish setting up your account to enjoy BillXpress fully</span>
        </div>
        <span className="text-sm font-bold text-secondary flex-shrink-0">{percent}% complete</span>
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
                <div className="font-semibold text-secondary">{step.label}</div>
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

      {activeStep === 'Mail' && <EmailVerifyModal onClose={() => setActiveStep(null)} />}
      {activeStep === 'Info' && <BasicInfoModal onClose={() => setActiveStep(null)} />}
      {activeStep === 'Fingerprint' && <BVNModal onClose={() => setActiveStep(null)} />}
      {activeStep === 'Banknote' && <BankDetailsModal onClose={() => setActiveStep(null)} />}
    </div>
  );
}

export default React.memo(ProfileCompletion);

function EmailVerifyModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const err = validateEmail(email);
    setError(err);
    if (!err) setSent(true);
  };

  return (
    <ModalWrapper title="Verify Email" onClose={onClose}>
      <p className="text-black dark:text-white mb-4 text-center">Enter your email address to verify.</p>
      <input id="verifyEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-4 py-2 border rounded-xl mb-2 ${error ? 'border-red-500' : 'border-gray-300'}`} placeholder="Email address" aria-invalid={!!error} aria-describedby={error ? 'verifyEmail-error' : undefined} />
      {error && <p id="verifyEmail-error" className="text-red-500 text-xs mb-2">{error}</p>}
      <div className="flex gap-3 mt-4">
        <button onClick={onClose} className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300">Cancel</button>
        <button onClick={handleSend} className="w-1/2 bg-secondary text-white py-3 rounded-2xl font-medium hover:bg-opacity-90">Send Verification</button>
      </div>
      {sent && <p className="text-green-600 text-center mt-4">Verification email sent!</p>}
    </ModalWrapper>
  );
}

function BasicInfoModal({ onClose }: { onClose: () => void }) {
  const [info, setInfo] = useState<BasicInfo>({ billingStreet: '', billingCity: '', billingState: '', billingCountry: '', homeStreet: '', homeCity: '', homeState: '', homeZip: '', avatar: null, avatarPreview: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => setInfo((p) => ({ ...p, [field]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!info.billingStreet) errs.billingStreet = 'Required';
    if (!info.billingCity) errs.billingCity = 'Required';
    if (!info.homeStreet) errs.homeStreet = 'Required';
    if (!info.homeZip) errs.homeZip = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length === 0) onClose();
  };

  return (
    <ModalWrapper title="Complete Your Basic Information" onClose={onClose}>
      <p className="text-black dark:text-white mb-4 text-center">Add your billing info and home address.</p>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['billingStreet', 'billingCity', 'billingState', 'billingCountry'] as const).map((f) => (
            <div key={f}>
              <label htmlFor={f} className="block text-sm font-medium text-black dark:text-white mb-1 capitalize">{f.replace('billing', 'Billing ')}</label>
              <input id={f} type="text" value={info[f]} onChange={(e) => handleChange(f, e.target.value)} className={`w-full px-4 py-2 border rounded-xl ${errors[f] ? 'border-red-500' : 'border-gray-300'}`} aria-invalid={!!errors[f]} aria-describedby={errors[f] ? `${f}-error` : undefined} />
              {errors[f] && <p id={`${f}-error`} className="text-red-500 text-xs mt-1">{errors[f]}</p>}
            </div>
          ))}
          {(['homeStreet', 'homeCity', 'homeState', 'homeZip'] as const).map((f) => (
            <div key={f}>
              <label htmlFor={f} className="block text-sm font-medium text-black dark:text-white mb-1 capitalize">{f.replace('home', 'Home ')}</label>
              <input id={f} type="text" value={info[f]} onChange={(e) => handleChange(f, e.target.value)} className={`w-full px-4 py-2 border rounded-xl ${errors[f] ? 'border-red-500' : 'border-gray-300'}`} aria-invalid={!!errors[f]} aria-describedby={errors[f] ? `${f}-error` : undefined} />
              {errors[f] && <p id={`${f}-error`} className="text-red-500 text-xs mt-1">{errors[f]}</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium">Cancel</button>
          <button type="submit" className="w-1/2 bg-secondary text-white py-3 rounded-2xl font-medium">Save</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function BVNModal({ onClose }: { onClose: () => void }) {
  const [bvn, setBvn] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    const err = validateBVN(bvn);
    setError(err);
    if (!err) onClose();
  };

  return (
    <ModalWrapper title="Link BVN" onClose={onClose}>
      <p className="text-black dark:text-white mb-4 text-center">Enter your BVN to link your account for withdrawals.</p>
      <input id="bvnField" type="text" value={bvn} onChange={(e) => setBvn(e.target.value)} className={`w-full px-4 py-2 border rounded-xl mb-2 ${error ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter BVN" maxLength={11} aria-invalid={!!error} aria-describedby={error ? 'bvnField-error' : undefined} />
      {error && <p id="bvnField-error" className="text-red-500 text-xs mb-2">{error}</p>}
      <div className="flex gap-3 mt-4">
        <button onClick={onClose} className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium">Cancel</button>
        <button onClick={handleVerify} className="w-1/2 bg-secondary text-white py-3 rounded-2xl font-medium">Verify BVN</button>
      </div>
    </ModalWrapper>
  );
}

function BankDetailsModal({ onClose }: { onClose: () => void }) {
  const [details, setDetails] = useState<BankDetails>({ accountNumber: '', bankName: '', accountName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (f: string, v: string) => setDetails((p) => ({ ...p, [f]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const acctErr = validateAccountNumber(details.accountNumber);
    if (acctErr) errs.accountNumber = acctErr;
    if (!details.bankName) errs.bankName = 'Required';
    if (!details.accountName) errs.accountName = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length === 0) onClose();
  };

  return (
    <ModalWrapper title="Add Bank Details" onClose={onClose}>
      <p className="text-black dark:text-white mb-4 text-center">Enter your bank account details.</p>
      <form onSubmit={handleSave} className="space-y-3">
        {(['accountNumber', 'bankName', 'accountName'] as const).map((f) => (
          <div key={f}>
            <label htmlFor={f} className="block text-sm font-medium text-black dark:text-white mb-1 capitalize">{f.replace(/([A-Z])/g, ' $1')}</label>
            <input id={f} type="text" value={details[f]} onChange={(e) => handleChange(f, e.target.value)} className={`w-full px-4 py-2 border rounded-xl ${errors[f] ? 'border-red-500' : 'border-gray-300'}`} maxLength={f === 'accountNumber' ? 10 : undefined} aria-invalid={!!errors[f]} aria-describedby={errors[f] ? `${f}-error` : undefined} />
            {errors[f] && <p id={`${f}-error`} className="text-red-500 text-xs mt-1">{errors[f]}</p>}
          </div>
        ))}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium">Cancel</button>
          <button type="submit" className="w-1/2 bg-secondary text-white py-3 rounded-2xl font-medium">Save</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function ModalWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const containerRef = useFocusTrap(true, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 dark:bg-dark-900/80" onClick={onClose}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-black dark:text-white mb-2 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
}
