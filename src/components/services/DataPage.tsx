// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Wifi, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { AIRTIME_NETWORKS } from "../../constants/networks";
import { useToast } from "../../hooks/useToast";
import ConfirmModal from "../ui/ConfirmModal";

import type { PageProps } from '../../types/page';

const DataPage: React.FC<PageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
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

  const networks = AIRTIME_NETWORKS;

  const dataPlans = {
    mtn: [
      { id: "1gb_30", name: "1GB", validity: "30 Days", price: 350 },
      { id: "2gb_30", name: "2GB", validity: "30 Days", price: 700 },
      { id: "5gb_30", name: "5GB", validity: "30 Days", price: 1500 },
      { id: "10gb_30", name: "10GB", validity: "30 Days", price: 3000 },
    ],
    glo: [
      { id: "1gb_30", name: "1GB", validity: "30 Days", price: 400 },
      { id: "2gb_30", name: "2GB", validity: "30 Days", price: 800 },
      { id: "5gb_30", name: "5GB", validity: "30 Days", price: 1600 },
      { id: "10gb_30", name: "10GB", validity: "30 Days", price: 3200 },
    ],
    airtel: [
      { id: "1gb_30", name: "1GB", validity: "30 Days", price: 380 },
      { id: "2gb_30", name: "2GB", validity: "30 Days", price: 750 },
      { id: "5gb_30", name: "5GB", validity: "30 Days", price: 1550 },
      { id: "10gb_30", name: "10GB", validity: "30 Days", price: 3100 },
    ],
    "9mobile": [
      { id: "1gb_30", name: "1GB", validity: "30 Days", price: 420 },
      { id: "2gb_30", name: "2GB", validity: "30 Days", price: 840 },
      { id: "5gb_30", name: "5GB", validity: "30 Days", price: 1700 },
      { id: "10gb_30", name: "10GB", validity: "30 Days", price: 3400 },
    ],
  };

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
        setSelectedPlan(""); // Reset plan when network changes
      }
    }

    const error = validatePhoneNumber(cleaned);
    setErrors((prev: { [key: string]: string | null }) => ({
      ...prev,
      phoneNumber: error,
    }));
  };

  const handleNetworkChange = (networkId: string) => {
    setSelectedNetwork(networkId);
    setSelectedPlan(""); // Reset plan when network changes
  };

  const handleSubmit = () => {
    const phoneError = validatePhoneNumber(phoneNumber);

    const newErrors: Record<string, string | null> = {};
    if (phoneError) newErrors.phoneNumber = phoneError;
    if (!selectedNetwork) newErrors.network = "Please select a network";
    if (!selectedPlan) newErrors.plan = "Please select a data plan";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPurchase = async () => {
    setIsPurchasing(true);
    await new Promise(r => setTimeout(r, 1500));
    setShowConfirmModal(false);
    setIsPurchasing(false);
    addToast('Purchase successful!', 'success');
    navigateTimerRef.current = setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  const selectedPlanDetails =
    selectedNetwork && selectedPlan
      ? dataPlans[selectedNetwork as keyof typeof dataPlans]?.find(
          (p) => p.id === selectedPlan
        )
      : null;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogoutClick}>
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
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-3">
              <Wifi className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Buy Data</h1>
              <p className="text-black dark:text-white">
                Purchase data bundles for your device
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {/* Phone Number Input */}
          <div className="mb-4">
            <label htmlFor="dataPhone" className="block text-sm font-medium text-black dark:text-white mb-2">
              Phone Number
            </label>
            <input
              id="dataPhone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="08012345678"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? 'dataPhone-error' : undefined}
            />
            {errors.phoneNumber && (
              <p id="dataPhone-error" role="alert" className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Network Selection */}
          <fieldset className="mb-4">
            <legend className="block text-sm font-medium text-black dark:text-white mb-2">
              Network
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleNetworkChange(network.id)}
                  className={`p-4 border-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center ${
                    selectedNetwork === network.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={network.icon}
                    alt={network.name}
                    loading="lazy"
                    className="w-8 h-8 object-contain mx-auto mb-2 rounded-lg shadow"
                  />
                  <p className="font-medium text-sm">{network.name}</p>
                </button>
              ))}
            </div>
            {errors.network && (
              <p role="alert" className="text-red-500 text-sm mt-1">{errors.network}</p>
            )}
          </fieldset>

          {/* Data Plan Selection */}
          {selectedNetwork && (
            <fieldset className="mb-4">
              <legend className="block text-sm font-medium text-black dark:text-white mb-2">
                Select Data Plan
              </legend>
              <div className="space-y-3">
                {dataPlans[selectedNetwork as keyof typeof dataPlans]?.map(
                  (plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full p-4 border-2 rounded-2xl transition-all cursor-pointer text-left ${
                        selectedPlan === plan.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-black dark:text-white">
                            {plan.validity}
                          </p>
                        </div>
                        <p className="font-bold text-base">₦{plan.price}</p>
                      </div>
                    </button>
                  )
                )}
              </div>
              {errors.plan && (
                <p role="alert" className="text-red-500 text-sm mt-1">{errors.plan}</p>
              )}
            </fieldset>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors cursor-pointer"
          >
            Continue
          </button>
        </div>

        <ConfirmModal
          show={showConfirmModal}
          title="Confirm Purchase"
          message="Please review your data purchase"
          confirmLabel="Confirm"
          isLoading={isPurchasing}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setShowConfirmModal(false)}
          icon={<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-green-600" aria-hidden="true" /></div>}
        >
          <div className="space-y-3">
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
              <span className="text-black dark:text-white">Data Plan</span>
              <span className="font-medium">
                {selectedPlanDetails?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Validity</span>
              <span className="font-medium">
                {selectedPlanDetails?.validity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Amount</span>
              <span className="font-medium">
                ₦{selectedPlanDetails?.price}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Charges</span>
              <span className="font-medium">₦0.00</span>
            </div>
            <hr className="dark:border-dark-700" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₦{selectedPlanDetails?.price}</span>
            </div>
          </div>
        </ConfirmModal>

        <ConfirmModal show={showLogoutModal} title="Confirm Logout" message="Are you sure you want to logout?" confirmLabel="Logout" onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />
      </div>
    </DashboardLayout>
  );
};

export default DataPage;
