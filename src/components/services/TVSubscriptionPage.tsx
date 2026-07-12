import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Tv, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import dstvIcon from "../../assets/icons/dstv.png";
import gotvIcon from "../../assets/icons/gotv.png";
import startimesIcon from "../../assets/icons/startimes.png";
import ConfirmModal from "../ui/ConfirmModal";
import { useToast } from "../../hooks/useToast";

import type { PageProps } from '../../types/page';

const TVSubscriptionPage: React.FC<PageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState("");
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
    };
  }, []);

  const providers = [
    { id: "dstv", name: "DStv", icon: dstvIcon },
    { id: "gotv", name: "GOtv", icon: gotvIcon },
    { id: "startimes", name: "StarTimes", icon: startimesIcon },
  ];

  const packages = {
    dstv: [
      { id: "padi", name: "DStv Padi", price: 2500, duration: "1 Month" },
      { id: "yanga", name: "DStv Yanga", price: 3500, duration: "1 Month" },
      { id: "confam", name: "DStv Confam", price: 6200, duration: "1 Month" },
      {
        id: "compact",
        name: "DStv Compact",
        price: 10500,
        duration: "1 Month",
      },
      {
        id: "premium",
        name: "DStv Premium",
        price: 24500,
        duration: "1 Month",
      },
    ],
    gotv: [
      { id: "smallie", name: "GOtv Smallie", price: 1100, duration: "1 Month" },
      { id: "jinja", name: "GOtv Jinja", price: 2250, duration: "1 Month" },
      { id: "jolli", name: "GOtv Jolli", price: 3300, duration: "1 Month" },
      { id: "max", name: "GOtv Max", price: 4850, duration: "1 Month" },
    ],
    startimes: [
      { id: "nova", name: "Nova", price: 1200, duration: "1 Month" },
      { id: "basic", name: "Basic", price: 2200, duration: "1 Month" },
      { id: "smart", name: "Smart", price: 3000, duration: "1 Month" },
      { id: "classic", name: "Classic", price: 4200, duration: "1 Month" },
      { id: "super", name: "Super", price: 6500, duration: "1 Month" },
    ],
  };

  const validateSmartCardNumber = (number: string) => {
    if (!number) return "Smart card number is required";
    if (number.length < 10)
      return "Smart card number must be at least 10 digits";
    return null;
  };

  const handleSmartCardChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setSmartCardNumber(cleaned);

    const error = validateSmartCardNumber(cleaned);
    setErrors((prev: Record<string, string | null>) => ({ ...prev, smartCardNumber: error }));
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setSelectedPackage("");
  };

  const handleSubmit = () => {
    const smartCardError = validateSmartCardNumber(smartCardNumber);

    const newErrors: Record<string, string | null> = {};
    if (!selectedProvider) newErrors.provider = "Please select a TV provider";
    if (smartCardError) newErrors.smartCardNumber = smartCardError;
    if (!selectedPackage) newErrors.package = "Please select a package";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPurchase = () => {
    setShowConfirmModal(false);
    addToast('Purchase successful!', 'success');
    navigateTimerRef.current = setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  const selectedPackageDetails =
    selectedProvider && selectedPackage
      ? packages[selectedProvider as keyof typeof packages]?.find(
          (p) => p.id === selectedPackage
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
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-3">
              <Tv className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">
                TV Subscription
              </h1>
              <p className="text-black dark:text-white">Renew your cable TV subscription</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              TV Provider
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`p-4 border-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center ${
                    selectedProvider === provider.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={provider.icon}
                    alt={provider.name}
                    loading="lazy"
                    className="w-8 h-8 object-contain mx-auto mb-2 rounded-lg shadow"
                  />
                  <p className="font-medium text-sm">{provider.name}</p>
                </button>
              ))}
            </div>
            {errors.provider && (
              <p className="text-red-500 text-sm mt-1">{errors.provider}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="smartCardNumber" className="block text-sm font-medium text-black dark:text-white mb-2">
              Smart Card / IUC Number
            </label>
            <input
              id="smartCardNumber"
              type="text"
              value={smartCardNumber}
              onChange={(e) => handleSmartCardChange(e.target.value)}
              placeholder="Enter your smart card number"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${
                errors.smartCardNumber ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.smartCardNumber}
              aria-describedby={errors.smartCardNumber ? 'smartCardNumber-error' : undefined}
            />
            {errors.smartCardNumber && (
              <p id="smartCardNumber-error" className="text-red-500 text-sm mt-1">
                {errors.smartCardNumber}
              </p>
            )}
          </div>

          {selectedProvider && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Select Package
              </label>
              <div className="space-y-3">
                {packages[selectedProvider as keyof typeof packages]?.map(
                  (pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`w-full p-4 border-2 rounded-2xl transition-all cursor-pointer text-left ${
                        selectedPackage === pkg.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-sm text-black dark:text-white">
                            {pkg.duration}
                          </p>
                        </div>
                        <p className="font-bold text-base">
                          ₦{pkg.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  )
                )}
              </div>
              {errors.package && (
                <p className="text-red-500 text-sm mt-1">{errors.package}</p>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors cursor-pointer"
          >
            Continue
          </button>
        </div>

        <ConfirmModal
          show={showConfirmModal}
          title="Confirm Subscription"
          message="Please review your TV subscription"
          confirmLabel="Confirm"
          onConfirm={handleConfirmPurchase}
          onCancel={() => setShowConfirmModal(false)}
          icon={
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Provider</span>
              <span className="font-medium">
                {providers.find((p) => p.id === selectedProvider)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Smart Card</span>
              <span className="font-medium">{smartCardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Package</span>
              <span className="font-medium">
                {selectedPackageDetails?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Duration</span>
              <span className="font-medium">
                {selectedPackageDetails?.duration}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Amount</span>
              <span className="font-medium">
                ₦{selectedPackageDetails?.price.toLocaleString()}
              </span>
            </div>
            <hr className="dark:border-dark-700" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₦{selectedPackageDetails?.price.toLocaleString()}</span>
            </div>
          </div>
        </ConfirmModal>

        <ConfirmModal
          show={showLogoutModal}
          title="Confirm Logout"
          message="Are you sure you want to logout?"
          confirmLabel="Logout"
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      </div>
    </DashboardLayout>
  );
};

export default TVSubscriptionPage;
