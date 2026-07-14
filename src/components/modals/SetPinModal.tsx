// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState, useEffect } from "react";
import { Lock, X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface SetPinModalProps {
  onSetPin: (pin: string) => void;
  onClose: () => void;
}

const SetPinModal = ({ onSetPin, onClose }: SetPinModalProps) => {
  const containerRef = useFocusTrap(true, onClose);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState("");
  const [isPinSet, setIsPinSet] = useState(false);

  useEffect(() => {
    setIsPinSet(sessionStorage.getItem("isPinSet") === "true");
  }, []);

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value;
    if (isConfirm) setConfirmPin(newPin);
    else setPin(newPin);
    if (value && index < 3) {
      document.getElementById(`${isConfirm ? "confirm-pin-" : "pin-"}${index + 1}`)?.focus();
    }
    setErrors("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
    if (e.key === "Backspace" && !(e.currentTarget as HTMLInputElement).value && index > 0) {
      document.getElementById(`${isConfirm ? "confirm-pin-" : "pin-"}${index - 1}`)?.focus();
    }
    if (e.key === "Enter") {
      if (!isConfirm && pin.join("").length === 4 && step === 1) handleContinue();
      else if (isConfirm && confirmPin.join("").length === 4 && step === 2) handleConfirm();
    }
  };

  const handleContinue = () => {
    if (pin.join("").length !== 4) { setErrors("Please enter a 4-digit PIN"); return; }
    setStep(2);
    setErrors("");
    setTimeout(() => document.getElementById("confirm-pin-0")?.focus(), 100);
  };

  const handleConfirm = async () => {
    const pinString = pin.join("");
    const confirmPinString = confirmPin.join("");
    if (confirmPinString.length !== 4) { setErrors("Please enter your 4-digit PIN"); return; }
    if (pinString !== confirmPinString) {
      setErrors("PINs do not match. Please try again.");
      setConfirmPin(["", "", "", ""]);
      setTimeout(() => document.getElementById("confirm-pin-0")?.focus(), 100);
      return;
    }
    try {
      await onSetPin(pinString);
      sessionStorage.setItem("isPinSet", "true");
    } catch {
      setErrors("Failed to set PIN. Please try again.");
    }
  };

  const renderPinInputs = (pinArray: string[], prefix: string, isConfirm = false) => (
    <div className="flex justify-center space-x-3 mb-4">
      {pinArray.map((digit, index) => (
        <input
          key={index}
          id={`${prefix}-${index}`}
          type="password"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinChange(index, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(index, e, isConfirm)}
          className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-300 dark:border-dark-600 rounded-xl focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-opacity-20 transition-all dark:bg-dark-900 dark:text-neutral-100"
        />
      ))}
    </div>
  );

  if (isPinSet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-dark-900/80 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-secondary dark:text-white">
            {step === 1 ? "Set Transaction PIN" : "Confirm PIN"}
          </h2>
          <button onClick={onClose} aria-label="Close modal" className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-secondary dark:text-white" aria-hidden="true" />
          </div>
          <p className="text-black dark:text-white">
            {step === 1 ? "Create a 4-digit PIN to secure your transactions" : "Re-enter your PIN to confirm"}
          </p>
        </div>

        {step === 1 ? (
          <>
            {renderPinInputs(pin, "pin")}
            {errors && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-4">
                {errors}
              </div>
            )}
            <button
              onClick={handleContinue}
              disabled={pin.join("").length !== 4}
              className="w-full bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            {renderPinInputs(confirmPin, "confirm-pin", true)}
            {errors && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-4">
                {errors}
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => { setStep(1); setConfirmPin(["", "", "", ""]); setErrors(""); }}
                className="flex-1 bg-gray-100 dark:bg-dark-700 text-black dark:text-white py-4 px-4 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-dark-600 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmPin.join("").length !== 4}
                className="flex-1 bg-secondary text-white py-4 px-4 rounded-2xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Confirm PIN
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-black dark:text-white">Keep your PIN secure and don't share it with anyone</p>
        </div>
      </div>
    </div>
  );
};

export default SetPinModal;
