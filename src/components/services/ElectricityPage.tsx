// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import Seo from '../ui/Seo';

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Zap, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import ekoIcon from "../../assets/icons/eko.png";
import ikejaIcon from "../../assets/icons/Ikeja-Electric.png";
import abujaIcon from "../../assets/icons/aedc.png";
import kanoIcon from "../../assets/icons/kedco.png";
import portharcourtIcon from "../../assets/icons/yedc.png";
import ibadanIcon from "../../assets/icons/default.svg";
import defaultIcon from "../../assets/icons/default.svg";
import ConfirmModal from "../ui/ConfirmModal";
import { useToast } from "../../hooks/useToast";

import type { PageProps } from '../../types/page';

const ElectricityPage: React.FC<PageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedDisco, setSelectedDisco] = useState("");
  const [meterType, setMeterType] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
    };
  }, []);

  const discos = [
    { id: "eko", name: "Eko Electric", icon: ekoIcon || defaultIcon },
    { id: "ikeja", name: "Ikeja Electric", icon: ikejaIcon || defaultIcon },
    { id: "abuja", name: "Abuja Electric", icon: abujaIcon || defaultIcon },
    { id: "kano", name: "Kano Electric", icon: kanoIcon || defaultIcon },
    {
      id: "portharcourt",
      name: "Port Harcourt Electric",
      icon: portharcourtIcon || defaultIcon,
    },
    { id: "ibadan", name: "Ibadan Electric", icon: ibadanIcon || defaultIcon },
  ];

  const meterTypes = [
    { id: "prepaid", name: "Prepaid", description: "Pay before use" },
    { id: "postpaid", name: "Postpaid", description: "Pay after use" },
  ];

  const validateMeterNumber = (number: string) => {
    if (!number) return "Meter number is required";
    if (number.length < 10) return "Meter number must be at least 10 digits";
    return null;
  };

  const validateAmount = (amt: string) => {
    if (!amt) return "Amount is required";
    const numAmount = Number(amt);
    if (isNaN(numAmount) || numAmount < 500) return "Minimum amount is ₦500";
    if (numAmount > 100000) return "Maximum amount is ₦100,000";
    return null;
  };

  const handleMeterNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setMeterNumber(cleaned);
    const error = validateMeterNumber(cleaned);
    setErrors((prev: Record<string, string | null>) => ({
      ...prev,
      meterNumber: error,
    }));
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setAmount(cleaned);
    const error = validateAmount(cleaned);
    setErrors((prev: Record<string, string | null>) => ({
      ...prev,
      amount: error,
    }));
  };

  const handleSubmit = () => {
    const meterError = validateMeterNumber(meterNumber);
    const amountError = validateAmount(amount);
    const newErrors: Record<string, string> = {};
    if (!selectedDisco) newErrors.disco = "Please select a distribution company";
    if (!meterType) newErrors.meterType = "Please select meter type";
    if (meterError) newErrors.meterNumber = meterError;
    if (amountError) newErrors.amount = amountError;
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    setIsPurchasing(true);
    await new Promise(r => setTimeout(r, 1500));
    setShowConfirmModal(false);
    setIsPurchasing(false);
    addToast('Purchase successful!', 'success');
    navigateTimerRef.current = setTimeout(() => navigate("/dashboard"), 1000);
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleConfirmLogout = () => { setShowLogoutModal(false); onLogout(); };
  const handleCancelLogout = () => setShowLogoutModal(false);

  return (
    <DashboardLayout user={user} onLogout={handleLogoutClick}>
      <Seo title="Pay Electricity" />
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Go back"
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mr-3">
              <Zap className="w-5 h-5 text-yellow-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Electricity Bills</h1>
              <p className="text-black dark:text-white">Pay your electricity bills instantly</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <fieldset className="mb-4">
            <legend className="block text-sm font-medium text-black dark:text-white mb-2">Distribution Company</legend>
            <div className="grid grid-cols-2 gap-3">
              {discos.map((disco) => (
                <button
                  key={disco.id}
                  onClick={() => setSelectedDisco(disco.id)}
                  className={`p-4 border-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center ${selectedDisco === disco.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-dark-700 hover:border-gray-300"}`}
                >
                  <img src={disco.icon || defaultIcon} loading="lazy" alt={disco.name} className="w-8 h-8 object-contain mx-auto mb-2 rounded-lg shadow" />
                  <p className="font-medium text-sm">{disco.name}</p>
                </button>
              ))}
            </div>
            {errors.disco && <p role="alert" className="text-red-500 text-sm mt-1">{errors.disco}</p>}
          </fieldset>

          <fieldset className="mb-4">
            <legend className="block text-sm font-medium text-black dark:text-white mb-2">Meter Type</legend>
            <div className="grid grid-cols-2 gap-3">
              {meterTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMeterType(type.id)}
                  className={`p-4 border-2 rounded-2xl transition-all cursor-pointer text-left ${meterType === type.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-dark-700 hover:border-gray-300"}`}
                >
                  <p className="font-medium">{type.name}</p>
                  <p className="text-sm text-black dark:text-white">{type.description}</p>
                </button>
              ))}
            </div>
            {errors.meterType && <p role="alert" className="text-red-500 text-sm mt-1">{errors.meterType}</p>}
          </fieldset>

          <div className="mb-4">
            <label htmlFor="meterNumber" className="block text-sm font-medium text-black dark:text-white mb-2">Meter Number</label>
            <input id="meterNumber" type="text" value={meterNumber} onChange={(e) => handleMeterNumberChange(e.target.value)} placeholder="Enter your meter number"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${errors.meterNumber ? "border-red-500" : "border-gray-300"}`}
              aria-invalid={!!errors.meterNumber} aria-describedby={errors.meterNumber ? 'meterNumber-error' : undefined} />
            {errors.meterNumber && <p id="meterNumber-error" role="alert" className="text-red-500 text-sm mt-1">{errors.meterNumber}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="electricityAmount" className="block text-sm font-medium text-black dark:text-white mb-2">Amount (₦500 - ₦100,000)</label>
            <input id="electricityAmount" type="text" value={amount} onChange={(e) => handleAmountChange(e.target.value)} placeholder="Enter amount"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${errors.amount ? "border-red-500" : "border-gray-300"}`}
              aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'electricityAmount-error' : undefined} />
            {errors.amount && <p id="electricityAmount-error" role="alert" className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          <button onClick={handleSubmit} className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors cursor-pointer">Continue</button>
        </div>

        <ConfirmModal
          show={showConfirmModal}
          title="Confirm Payment"
          message="Please review your electricity bill payment"
          confirmLabel="Confirm"
          isLoading={isPurchasing}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setShowConfirmModal(false)}
          icon={<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-green-600" aria-hidden="true" /></div>}
        >
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-black dark:text-white">Distribution Company</span><span className="font-medium">{discos.find((d) => d.id === selectedDisco)?.name}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-white">Meter Type</span><span className="font-medium capitalize">{meterType}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-white">Meter Number</span><span className="font-medium">{meterNumber}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-white">Amount</span><span className="font-medium">₦{Number(amount).toLocaleString()}</span></div>
            <hr className="dark:border-dark-700" />
            <div className="flex justify-between font-bold"><span>Total</span><span>₦{Number(amount).toLocaleString()}</span></div>
          </div>
        </ConfirmModal>

        <ConfirmModal show={showLogoutModal} title="Confirm Logout" message="Are you sure you want to logout?" confirmLabel="Logout" onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />
      </div>
    </DashboardLayout>
  );
};

export default ElectricityPage;
