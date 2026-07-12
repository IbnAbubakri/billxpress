import { useState, useEffect, useRef } from "react";
import { ArrowLeft, RefreshCw, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { AIRTIME_NETWORKS } from "../../constants/networks";
import defaultIcon from "../../assets/icons/default.svg";
import ConfirmModal from "../ui/ConfirmModal";
import { useToast } from "../../hooks/useToast";
import type { Network } from "../../constants/networks";

import type { PageProps } from '../../types/page';

const AirtimeToCashPage = ({ user, onLogout }: PageProps) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
    };
  }, []);

  const networks: Network[] = AIRTIME_NETWORKS;

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return "Phone number is required";
    if (phone.length !== 11) return "Phone number must be 11 digits";
    if (!phone.startsWith("0")) return "Phone number must start with 0";
    const prefix = phone.substring(0, 4);
    const network = networks.find((n) => n.prefixes.includes(prefix));
    if (!network) return "Invalid network prefix";
    if (selectedNetwork && network.id !== selectedNetwork) {
      return `This number belongs to ${network.name}, but you selected ${networks.find((n) => n.id === selectedNetwork)?.name}`;
    }
    return null;
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleConfirmLogout = () => { setShowLogoutModal(false); onLogout(); };
  const handleCancelLogout = () => setShowLogoutModal(false);

  const validateAmount = (amt: string) => {
    if (!amt) return "Amount is required";
    const numAmount = Number(amt);
    if (isNaN(numAmount) || numAmount < 100) return "Minimum amount is ₦100";
    if (numAmount > 50000) return "Maximum amount is ₦50,000";
    return null;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").substring(0, 11);
    setPhoneNumber(cleaned);
    if (cleaned.length >= 4) {
      const prefix = cleaned.substring(0, 4);
      const detectedNetwork = networks.find((n) => n.prefixes.includes(prefix));
      if (detectedNetwork && !selectedNetwork) setSelectedNetwork(detectedNetwork.id);
    }
    const error = validatePhoneNumber(cleaned);
    setErrors((prev) => ({ ...prev, phoneNumber: error }));
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setAmount(cleaned);
    const error = validateAmount(cleaned);
    setErrors((prev) => ({ ...prev, amount: error }));
  };

  const handleSubmit = () => {
    const phoneError = validatePhoneNumber(phoneNumber);
    const amountError = validateAmount(amount);
    const newErrors: Record<string, string> = {};
    if (phoneError) newErrors.phoneNumber = phoneError;
    if (!selectedNetwork) newErrors.network = "Please select a network";
    if (amountError) newErrors.amount = amountError;
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) setShowConfirmModal(true);
  };

  const handleConfirmPurchase = () => {
    setShowConfirmModal(false);
    addToast('Purchase successful!', 'success');
    navigateTimerRef.current = setTimeout(() => navigate("/dashboard"), 1000);
  };

  const selectedNetworkData = networks.find((n) => n.id === selectedNetwork);
  const creditedAmount = selectedNetworkData && amount ? Math.floor(Number(amount) * (selectedNetworkData.cashRate ?? 0)) : 0;

  return (
    <DashboardLayout user={user} onLogout={handleLogoutClick}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate("/dashboard")} aria-label="Go back" className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-3">
              <RefreshCw className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Airtime to Cash</h1>
              <p className="text-black dark:text-white">Convert your airtime to cash instantly</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <label htmlFor="airtimeToCashPhone" className="block text-sm font-medium text-black dark:text-white mb-2">Phone Number</label>
            <input id="airtimeToCashPhone" type="tel" value={phoneNumber} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="08012345678"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${errors.phoneNumber ? "border-red-500" : "border-gray-300"}`}
              aria-invalid={!!errors.phoneNumber} aria-describedby={errors.phoneNumber ? 'airtimeToCashPhone-error' : undefined} />
            {errors.phoneNumber && <p id="airtimeToCashPhone-error" className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">Network</label>
            <div className="grid grid-cols-2 gap-3">
              {networks.map((network) => (
                <button key={network.id} onClick={() => setSelectedNetwork(network.id)}
                  className={`p-4 border-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center ${selectedNetwork === network.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-dark-700 hover:border-gray-300"}`}>
                  <img src={network.icon || defaultIcon} loading="lazy" alt={network.name} className="w-8 h-8 object-contain mx-auto mb-2 rounded-lg shadow" />
                  <p className="font-medium text-sm">{network.name}</p>
                  <p className="text-xs text-black dark:text-white">{(network.cashRate * 100).toFixed(0)}% rate</p>
                </button>
              ))}
            </div>
            {errors.network && <p className="text-red-500 text-sm mt-1">{errors.network}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="airtimeToCashAmount" className="block text-sm font-medium text-black dark:text-white mb-2">Airtime Amount (₦100 - ₦50,000)</label>
            <input id="airtimeToCashAmount" type="text" value={amount} onChange={(e) => handleAmountChange(e.target.value)} placeholder="Enter airtime amount"
              className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent ${errors.amount ? "border-red-500" : "border-gray-300"}`}
              aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'airtimeToCashAmount-error' : undefined} />
            {errors.amount && <p id="airtimeToCashAmount-error" className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          {selectedNetworkData && amount && !errors.amount && (
            <div className="mb-4 p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-black dark:text-white">You will receive:</p>
                  <p className="text-xl font-bold text-green-600">₦{creditedAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-black dark:text-white">Rate:</p>
                  <p className="font-medium">{(selectedNetworkData.cashRate * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors cursor-pointer">Continue</button>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Enter your phone number and airtime amount</li>
              <li>• We'll send you instructions via SMS</li>
              <li>• Transfer the airtime as instructed</li>
              <li>• Cash will be credited to your wallet instantly</li>
            </ul>
          </div>
        </div>

        <ConfirmModal
          show={showConfirmModal}
          title="Confirm Conversion"
          message="Please review your airtime to cash conversion"
          confirmLabel="Confirm"
          onConfirm={handleConfirmPurchase}
          onCancel={() => setShowConfirmModal(false)}
          icon={<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-green-600" aria-hidden="true" /></div>}
        >
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-black dark:text-white">Network</span><span className="font-medium">{selectedNetworkData?.name}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-white">Phone Number</span><span className="font-medium">{phoneNumber}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-white">Airtime Amount</span><span className="font-medium">₦{Number(amount).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-white">Conversion Rate</span><span className="font-medium">{(selectedNetworkData?.cashRate ?? 0) * 100}%</span></div>
            <hr className="dark:border-dark-700" />
            <div className="flex justify-between font-bold text-green-600"><span>You'll Receive</span><span>₦{creditedAmount.toLocaleString()}</span></div>
          </div>
        </ConfirmModal>

        <ConfirmModal
          show={showLogoutModal}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign Out"
          confirmVariant="danger"
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      </div>
    </DashboardLayout>
  );
};

export default AirtimeToCashPage;
