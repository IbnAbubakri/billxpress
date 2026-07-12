import { useEffect, useRef } from "react";
import { User as UserIcon } from "lucide-react";
import type { BasicInfo } from '../../types';

interface BasicInfoModalProps {
  open: boolean;
  info: BasicInfo;
  errors: Record<string, string>;
  onClose: () => void;
  onChange: (field: string, value: string | File | null) => void;
  onSave: () => void;
  generalError?: string;
}

const BasicInfoModal = ({
  open,
  info,
  errors,
  onClose,
  onChange,
  onSave,
  generalError,
}: BasicInfoModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 50);
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80" role="dialog" aria-modal="true" aria-label="Complete your basic information">
      <div ref={modalRef} tabIndex={-1} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-lg w-full mx-4 outline-none">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-black dark:text-white mb-2">
            Complete Your Basic Information
          </h2>
          <p className="text-black dark:text-white mb-4">
            Add your billing info, home address, and upload an avatar to
            complete your profile.
          </p>
        </div>
        <form className="space-y-3">
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
              {generalError}
            </div>
          )}
          <div className="flex flex-col items-center mb-4">
            <label htmlFor="avatar" className="block text-sm font-medium text-black dark:text-white mb-2">
              Avatar
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onChange("avatar", e.target.files[0]);
                }
              }}
              className="mb-2"
            />
            {info.avatarPreview && (
              <img
                src={info.avatarPreview}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover border"
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="billingStreet" className="block text-sm font-medium text-black dark:text-white mb-1">
                Billing Street
              </label>
              <input
                id="billingStreet"
                type="text"
                value={info.billingStreet}
                onChange={(e) => onChange("billingStreet", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl text-black dark:text-white bg-white dark:bg-dark-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.billingStreet ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.billingStreet}
                aria-describedby={errors.billingStreet ? 'billingStreet-error' : undefined}
              />
              {errors.billingStreet && (
                <p id="billingStreet-error" className="text-red-500 text-xs mt-1">
                  {errors.billingStreet}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="billingCity" className="block text-sm font-medium text-black dark:text-white mb-1">
                Billing City
              </label>
              <input
                id="billingCity"
                type="text"
                value={info.billingCity}
                onChange={(e) => onChange("billingCity", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.billingCity ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.billingCity}
                aria-describedby={errors.billingCity ? 'billingCity-error' : undefined}
              />
              {errors.billingCity && (
                <p id="billingCity-error" className="text-red-500 text-xs mt-1">
                  {errors.billingCity}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="billingState" className="block text-sm font-medium text-black dark:text-white mb-1">
                Billing State
              </label>
              <input
                id="billingState"
                type="text"
                value={info.billingState}
                onChange={(e) => onChange("billingState", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.billingState ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.billingState}
                aria-describedby={errors.billingState ? 'billingState-error' : undefined}
              />
              {errors.billingState && (
                <p id="billingState-error" className="text-red-500 text-xs mt-1">
                  {errors.billingState}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="billingCountry" className="block text-sm font-medium text-black dark:text-white mb-1">
                Billing Country
              </label>
              <input
                id="billingCountry"
                type="text"
                value={info.billingCountry}
                onChange={(e) => onChange("billingCountry", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.billingCountry ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.billingCountry}
                aria-describedby={errors.billingCountry ? 'billingCountry-error' : undefined}
              />
              {errors.billingCountry && (
                <p id="billingCountry-error" className="text-red-500 text-xs mt-1">
                  {errors.billingCountry}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="homeStreet" className="block text-sm font-medium text-black dark:text-white mb-1">
                Home Street
              </label>
              <input
                id="homeStreet"
                type="text"
                value={info.homeStreet}
                onChange={(e) => onChange("homeStreet", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.homeStreet ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.homeStreet}
                aria-describedby={errors.homeStreet ? 'homeStreet-error' : undefined}
              />
              {errors.homeStreet && (
                <p id="homeStreet-error" className="text-red-500 text-xs mt-1">
                  {errors.homeStreet}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="homeCity" className="block text-sm font-medium text-black dark:text-white mb-1">
                Home City
              </label>
              <input
                id="homeCity"
                type="text"
                value={info.homeCity}
                onChange={(e) => onChange("homeCity", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.homeCity ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.homeCity}
                aria-describedby={errors.homeCity ? 'homeCity-error' : undefined}
              />
              {errors.homeCity && (
                <p id="homeCity-error" className="text-red-500 text-xs mt-1">
                  {errors.homeCity}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="homeState" className="block text-sm font-medium text-black dark:text-white mb-1">
                Home State
              </label>
              <input
                id="homeState"
                type="text"
                value={info.homeState}
                onChange={(e) => onChange("homeState", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.homeState ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.homeState}
                aria-describedby={errors.homeState ? 'homeState-error' : undefined}
              />
              {errors.homeState && (
                <p id="homeState-error" className="text-red-500 text-xs mt-1">
                  {errors.homeState}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="homeZip" className="block text-sm font-medium text-black dark:text-white mb-1">
                Home Zip/Postal Code
              </label>
              <input
                id="homeZip"
                type="text"
                value={info.homeZip}
                onChange={(e) => onChange("homeZip", e.target.value)}
                className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-dark-800 text-black dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                  errors.homeZip ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                }`}
                aria-invalid={!!errors.homeZip}
                aria-describedby={errors.homeZip ? 'homeZip-error' : undefined}
              />
              {errors.homeZip && (
                <p id="homeZip-error" className="text-red-500 text-xs mt-1">
                  {errors.homeZip}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BasicInfoModal;
