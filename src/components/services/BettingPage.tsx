// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Target, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import bet9jaIcon from "../../assets/icons/bet9ja.png";
import sportybetIcon from "../../assets/icons/sportybet.png";
import nairabetIcon from "../../assets/icons/nairabet.png";
import betkingIcon from "../../assets/icons/betking.svg";
import x1betIcon from "../../assets/icons/1xbet.png";
import betwayIcon from "../../assets/icons/betway.png";
import defaultIcon from "../../assets/icons/default.svg";
import ConfirmModal from "../ui/ConfirmModal";
import { useToast } from "../../hooks/useToast";

import type { PageProps } from '../../types/page';

const BettingPage: React.FC<PageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [userId, setUserId] = useState("");
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

  const bettingPlatforms = [
    { id: "bet9ja", name: "Bet9ja", icon: bet9jaIcon || defaultIcon, description: "Nigeria's number 1 betting site" },
    { id: "sportybet", name: "SportyBet", icon: sportybetIcon || defaultIcon, description: "Your winning partner" },
    { id: "nairabet", name: "NairaBet", icon: nairabetIcon || defaultIcon, description: "Bet with the best" },
    { id: "betking", name: "BetKing", icon: betkingIcon || defaultIcon, description: "King of betting" },
    { id: "1xbet", name: "1xBet", icon: x1betIcon || defaultIcon, description: "High odds, fast payouts" },
    { id: "betway", name: "Betway", icon: betwayIcon || defaultIcon, description: "Bet your way" },
  ];

  const validateUserId = (id: string) => {
    if (!id) return "User ID is required";
    if (id.length < 3) return "User ID must be at least 3 characters";
    return null;
  };

  const validateAmount = (amt: string) => {
    if (!amt) return "Amount is required";
    const numAmount = Number(amt);
    if (isNaN(numAmount) || numAmount < 100) return "Minimum amount is ₦100";
    if (numAmount > 100000) return "Maximum amount is ₦100,000";
    return null;
  };

  const handleUserIdChange = (value: string) => {
    setUserId(value);
    const error = validateUserId(value);
    setErrors((prev: Record<string, string | null>) => ({ ...prev, userId: error }));
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setAmount(cleaned);
    const error = validateAmount(cleaned);
    setErrors((prev: Record<string, string | null>) => ({ ...prev, amount: error }));
  };

  const handleSubmit = () => {
    const userIdError = validateUserId(userId);
    const amountError = validateAmount(amount);
    const newErrors: Record<string, string> = {};
    if (!selectedPlatform) newErrors.platform = "Please select a betting platform";
    if (userIdError) newErrors.userId = userIdError;
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

  const selectedPlatformData = bettingPlatforms.find((p) => p.id === selectedPlatform);
  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleConfirmLogout = () => { setShowLogoutModal(false); onLogout(); };
  const handleCancelLogout = () => setShowLogoutModal(false);

  return (
    <DashboardLayout user={user} onLogout={handleLogoutClick}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate("/dashboard")} aria-label="Go back" className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mr-3">
              <Target className="w-5 h-5 text-orange-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Betting Payments</h1>
              <p className="text-black dark:text-white">Fund your betting account instantly</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <fieldset className="mb-4">
            <legend className="block text-sm font-medium text-black dark:text-white mb-2">Betting Platform</legend>
            <div className="grid grid-cols-2 gap-3">
              {bettingPlatforms.map((platform) => (
                <button key={platform.id} onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-4 border-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center ${selectedPlatform === platform.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-dark-700 hover:border-gray-300"}`}>
                  <img src={platform.icon} loading="lazy" alt={platform.name} className="w-8 h-8 object-contain mx-auto mb-2 rounded-lg shadow" />
                  <p className="font-medium text-sm">{platform.name}</p>
                  <p className="text-xs text-black dark:text-white">{platform.description}</p>
                </button>
              ))}
            </div>
            {errors.platform && <p role="alert" className="text-red-500 text-sm mt-1">{errors.platform}</p>}
          </fieldset>

          <div className="mb-4">
            <label htmlFor="bettingUserId" className="block text-sm font-medium text-black dark:text-white mb-2">User ID / Account Number</label>
            <input id="bettingUserId" type="text" value={userId} onChange={(e) => handleUserIdChange(e.target.value)} placeholder="Enter your betting account ID"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${errors.userId ? "border-red-500" : "border-gray-300"}`}
              aria-invalid={!!errors.userId} aria-describedby={errors.userId ? 'bettingUserId-error' : undefined} />
            {errors.userId && <p id="bettingUserId-error" role="alert" className="text-red-500 text-sm mt-1">{errors.userId}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="bettingAmount" className="block text-sm font-medium text-black dark:text-white mb-2">Amount (₦100 - ₦100,000)</label>
            <input id="bettingAmount" type="text" value={amount} onChange={(e) => handleAmountChange(e.target.value)} placeholder="Enter amount to fund"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${errors.amount ? "border-red-500" : "border-gray-300"}`}
              aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'bettingAmount-error' : undefined} />
            {errors.amount && <p id="bettingAmount-error" role="alert" className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          <button onClick={handleSubmit} className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors cursor-pointer">Continue</button>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Important Notice:</h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• Ensure your account ID is correct</li>
              <li>• Funds are credited instantly</li>
              <li>• Minimum funding amount is ₦100</li>
              <li>• Contact support if you encounter any issues</li>
            </ul>
          </div>
        </div>

        <ConfirmModal
          show={showConfirmModal}
          title="Confirm Payment"
          message="Please review your betting account funding"
          confirmLabel="Confirm"
          isLoading={isPurchasing}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setShowConfirmModal(false)}
          icon={<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-green-600" aria-hidden="true" /></div>}
        >
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-black dark:text-white">Platform</span><span className="font-medium">{selectedPlatformData?.name}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-white">User ID</span><span className="font-medium">{userId}</span></div>
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

export default BettingPage;
