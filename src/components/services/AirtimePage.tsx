import React, { useState } from "react";
import { ArrowLeft, Smartphone, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { AIRTIME_NETWORKS } from "../../constants/networks";

import type { PageProps } from '../../types/page';

interface AirtimePageProps extends PageProps {}

const AirtimePage: React.FC<AirtimePageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const networks = AIRTIME_NETWORKS;

  const quickAmounts = ["100", "200", "500", "1000", "2000", "5000"];

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return "Phone number is required";
    if (phone.length !== 11) return "Phone number must be 11 digits";
    if (!phone.startsWith("0")) return "Phone number must start with 0";

    const prefix = phone.substring(0, 4);
    const network = networks.find((n) => n.prefixes.includes(prefix));
    if (!network) return "Invalid network prefix";

    if (selectedNetwork && network.id !== selectedNetwork) {
      return `This number belongs to ${network.name}, but you selected ${
        networks.find((n) => n.id === selectedNetwork)?.name
      }`;
    }

    return null;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").substring(0, 11);
    setPhoneNumber(cleaned);

    if (cleaned.length >= 4) {
      const prefix = cleaned.substring(0, 4);
      const detectedNetwork = networks.find((n) => n.prefixes.includes(prefix));
      if (detectedNetwork && !selectedNetwork) {
        setSelectedNetwork(detectedNetwork.id);
      }
    }

    const error = validatePhoneNumber(cleaned);
    setErrors((prev: typeof errors) => ({ ...prev, phoneNumber: error }));
  };

  const handleSubmit = () => {
    const phoneError = validatePhoneNumber(phoneNumber);
    const amount = customAmount || selectedAmount;

    const newErrors: Record<string, string | null> = {};
    if (phoneError) newErrors.phoneNumber = phoneError;
    if (!selectedNetwork) newErrors.network = "Please select a network";
    if (!amount) newErrors.amount = "Please select or enter an amount";
    if (amount && (isNaN(Number(amount)) || Number(amount) < 50)) {
      newErrors.amount = "Amount must be at least ₦50";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPurchase = () => {
    // Simulate purchase
    setShowConfirmModal(false);
    // Show success message and redirect
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="p-4">
        <div className="flex items-center mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              aria-label="Go back"
              className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <Smartphone className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Buy Airtime</h1>
              <p className="text-black dark:text-white">
                Top up your phone or someone else's
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {/* Phone Number Input */}
          <div className="mb-4">
            <label htmlFor="airtimePhone" className="block text-sm font-medium text-black dark:text-white mb-2">
              Phone Number
            </label>
            <input
              id="airtimePhone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="08012345678"
              className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? 'airtimePhone-error' : undefined}
            />
            {errors.phoneNumber && (
              <p id="airtimePhone-error" className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Network Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Network
            </label>
            <div className="grid grid-cols-2 gap-3">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network.id)}
                  className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center ${
                    selectedNetwork === network.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={network.icon}
                    alt={network.name}
                    className="w-8 h-8 object-contain mx-auto mb-2 rounded-lg shadow"
                  />
                  <p className="font-medium text-sm">{network.name}</p>
                </button>
              ))}
            </div>
            {errors.network && (
              <p className="text-red-500 text-sm mt-1">{errors.network}</p>
            )}
          </div>

          {/* Quick Amount Selection */}
          <div className="mb-4">
            <label htmlFor="airtimeCustomAmount" className="block text-sm font-medium text-black dark:text-white mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`py-3 px-4 border-2 rounded-2xl font-medium transition-all ${
                    selectedAmount === amount
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                  }`}
                >
                  ₦{amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <input
              id="airtimeCustomAmount"
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount("");
              }}
              placeholder="Enter custom amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? 'airtimeCustomAmount-error' : undefined}
            />
            {errors.amount && (
              <p id="airtimeCustomAmount-error" className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
          >
            Continue
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-dark-900/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-4 w-full max-w-sm">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                  Confirm Purchase
                </h3>
                <p className="text-black dark:text-white">
                  Please review your airtime purchase
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Network</span>
                  <span className="font-medium">
                    {networks.find((n) => n.id === selectedNetwork)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Phone Number</span>
                  <span className="font-medium">{phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Amount</span>
                  <span className="font-medium">
                    ₦{customAmount || selectedAmount}
                  </span>
                </div>
              </div>
              <button
                onClick={handleConfirmPurchase}
                className="w-full bg-green-600 text-white py-3 rounded-2xl font-medium hover:bg-green-700 transition-colors"
              >
                Confirm & Buy
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AirtimePage;
