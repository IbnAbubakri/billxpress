import React, { useState } from "react";
import { ArrowLeft, User, Lock, Check, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

import type { PageProps } from '../../types/page';
import EmailVerificationModal from "./EmailVerificationModal";
import BVNModal from "./BVNModal";
import BankDetailsModal from "./BankDetailsModal";
import BasicInfoModal from "./BasicInfoModal";

interface ProfilePageProps extends PageProps {}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onUpdateProfile }) => {
  const fullName = (user?.name || '').split(' ');
  const defaultFirstName = fullName[0] || '';
  const defaultLastName = fullName.slice(1).join(' ') || '';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [showBVNModal, setShowBVNModal] = useState(false);
  const [bvn, setBVN] = useState(user?.bvn || "");
  const [bvnError, setBVNError] = useState("");

  const [showBankModal, setShowBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: user?.accountNumber || "",
    bankName: user?.bankName || "",
    accountName: user?.accountName || "",
  });
  const [bankErrors, setBankErrors] = useState<any>({});

  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    billingStreet: user?.billingStreet || "",
    billingCity: user?.billingCity || "",
    billingState: user?.billingState || "",
    billingCountry: user?.billingCountry || "",
    homeStreet: user?.homeStreet || "",
    homeCity: user?.homeCity || "",
    homeState: user?.homeState || "",
    homeZip: user?.homeZip || "",
    avatar: null as File | null,
    avatarPreview: "",
  });
  const [basicInfoErrors, setBasicInfoErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    firstName: defaultFirstName,
    lastName: defaultLastName,
    email: user?.email || "",
    phone: (user?.phone || "").replace(/^\+234/, "0"),
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    transactionPin: "",
  });
  const [errors, setErrors] = useState<any>({});

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const profileCompletion = (() => {
    let filled = 0;
    const total = 8;
    if (user?.name) filled++;
    if (user?.phone) filled++;
    if (user?.accountNumber) filled++;
    if (user?.bvn) filled++;
    if (user?.billingStreet) filled++;
    if (user?.homeStreet) filled++;
    if (user?.emailVerified) filled++;
    if (user?.hasTransactionPin) filled++;
    return Math.round((filled / total) * 100);
  })();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Record<string, string | null>) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    return phone.length === 11 && phone.startsWith("0");
  };

  const handleProfileUpdate = async () => {
    const newErrors: any = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!validateEmail(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!validatePhone(formData.phone))
      newErrors.phone = "Please enter a valid phone number";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        const phone = formData.phone.startsWith("0")
          ? "+234" + formData.phone.slice(1)
          : formData.phone;
        if (onUpdateProfile) {
          await onUpdateProfile({ name, phone });
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch {
        setErrors({ phone: "Failed to update profile. Try again." });
      }
    }
  };

  const handlePasswordChange = () => {
    const newErrors: any = {};

    if (!formData.currentPassword)
      newErrors.currentPassword = "Current password is required";
    if (!formData.newPassword)
      newErrors.newPassword = "New password is required";
    if (formData.newPassword.length < 6)
      newErrors.newPassword = "Password must be at least 6 characters";
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShowSuccess(true);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handlePinChange = () => {
    const newErrors: any = {};

    if (!formData.transactionPin)
      newErrors.transactionPin = "Transaction PIN is required";
    if (formData.transactionPin.length !== 4)
      newErrors.transactionPin = "PIN must be 4 digits";
    if (!/^\d+$/.test(formData.transactionPin))
      newErrors.transactionPin = "PIN must contain only numbers";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShowSuccess(true);
      setFormData((prev) => ({ ...prev, transactionPin: "" }));
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailSent(false);
    }, 2000);
  };

  const handleBVNVerify = async () => {
    if (!bvn || bvn.length !== 11 || !/^\d+$/.test(bvn)) {
      setBVNError("Please enter a valid 11-digit BVN");
      return;
    }
    setBVNError("");
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({ bvn });
      }
      setShowBVNModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setBVNError("Failed to save BVN. Try again.");
    }
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
    if (bankErrors[field]) {
      setBankErrors((prev: Record<string, string | null>) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleBankDetailsSave = async () => {
    const errors: any = {};
    if (
      !bankDetails.accountNumber.trim() ||
      bankDetails.accountNumber.length !== 10 ||
      !/^\d+$/.test(bankDetails.accountNumber)
    )
      errors.accountNumber = "Valid 10-digit account number required";
    if (!bankDetails.bankName.trim()) errors.bankName = "Bank name required";
    if (!bankDetails.accountName.trim())
      errors.accountName = "Account name required";
    setBankErrors(errors);
    if (Object.keys(errors).length === 0) {
      try {
        if (onUpdateProfile) {
          await onUpdateProfile({
            accountNumber: bankDetails.accountNumber,
            bankName: bankDetails.bankName,
            accountName: bankDetails.accountName,
          });
        }
        setShowBankModal(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch {
        setBankErrors({ accountName: "Failed to save. Try again." });
      }
    }
  };

  const handleBasicInfoChange = (field: string, value: string | File | null) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
    if (basicInfoErrors[field]) {
      setBasicInfoErrors((prev: Record<string, string | null>) => ({
        ...prev,
        [field]: null,
      }));
    }
    if (field === "avatar" && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBasicInfo((prev) => ({
          ...prev,
          avatarPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(value);
    }
  };

  const handleBasicInfoSave = async () => {
    const errors: any = {};
    if (!basicInfo.billingStreet.trim())
      errors.billingStreet = "Billing street required";
    if (!basicInfo.billingCity.trim())
      errors.billingCity = "Billing city required";
    if (!basicInfo.billingState.trim())
      errors.billingState = "Billing state required";
    if (!basicInfo.billingCountry.trim())
      errors.billingCountry = "Billing country required";
    if (!basicInfo.homeStreet.trim())
      errors.homeStreet = "Home street required";
    if (!basicInfo.homeCity.trim()) errors.homeCity = "Home city required";
    if (!basicInfo.homeState.trim()) errors.homeState = "Home state required";
    if (!basicInfo.homeZip.trim()) errors.homeZip = "Home zip required";
    setBasicInfoErrors(errors);
    if (Object.keys(errors).length === 0) {
      try {
        if (onUpdateProfile) {
          await onUpdateProfile({
            billingStreet: basicInfo.billingStreet,
            billingCity: basicInfo.billingCity,
            billingState: basicInfo.billingState,
            billingCountry: basicInfo.billingCountry,
            homeStreet: basicInfo.homeStreet,
            homeCity: basicInfo.homeCity,
            homeState: basicInfo.homeState,
            homeZip: basicInfo.homeZip,
          });
        }
        setShowBasicInfoModal(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch {
        setBasicInfoErrors({ homeStreet: "Failed to save. Try again." });
      }
    }
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
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">
              Profile Settings
            </h1>
            <p className="text-black dark:text-white">
              Manage your account information and security
            </p>
          </div>
        </div>

        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" aria-hidden="true" />
            <p className="text-green-800">Changes saved successfully!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm">
              {/* Profile Completion */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-black dark:text-white">
                    Profile Completion
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {profileCompletion}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 relative">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3" style={{ pointerEvents: "auto" }}>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    style={{ cursor: "pointer" }}
                    className="w-full sm:w-auto px-3 py-2 sm:py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    Verify Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBasicInfoModal(true)}
                    style={{ cursor: "pointer" }}
                    className="w-full sm:w-auto px-3 py-2 sm:py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    Add Basic Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBVNModal(true)}
                    style={{ cursor: "pointer" }}
                    className="w-full sm:w-auto px-3 py-2 sm:py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    Link BVN
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBankModal(true)}
                    style={{ cursor: "pointer" }}
                    className="w-full sm:w-auto px-3 py-2 sm:py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    Add Bank Details
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2 mb-4">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                    activeTab === "profile"
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-black dark:text-white hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700"
                  }`}
                >
                  <User className="w-4 h-4 inline mr-3" aria-hidden="true" />
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                    activeTab === "security"
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-black dark:text-white hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700"
                  }`}
                >
                  <Lock className="w-4 h-4 inline mr-3" aria-hidden="true" />
                  Security Settings
                </button>
              </nav>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm">
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                    Profile Information
                  </h2>

                  {/* Profile Picture */}
                  <div className="flex items-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-6">
                      {formData.firstName.charAt(0)}
                      {formData.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-black dark:text-white">
                        {formData.firstName} {formData.lastName}
                      </h3>
                      <p className="text-black dark:text-white mb-2">{formData.email}</p>
                      <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                        <Camera className="w-4 h-4 mr-1" aria-hidden="true" />
                        Change Photo
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="profileFirstName" className="block text-sm font-medium text-black dark:text-white mb-2">
                        First Name
                      </label>
                      <input
                        id="profileFirstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.firstName ? "border-red-500" : "border-gray-300"
                        }`}
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? 'profileFirstName-error' : undefined}
                      />
                      {errors.firstName && (
                        <p id="profileFirstName-error" className="text-red-500 text-sm mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="profileLastName" className="block text-sm font-medium text-black dark:text-white mb-2">
                        Last Name
                      </label>
                      <input
                        id="profileLastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? 'profileLastName-error' : undefined}
                      />
                      {errors.lastName && (
                        <p id="profileLastName-error" className="text-red-500 text-sm mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="profileEmail" className="block text-sm font-medium text-black dark:text-white mb-2">
                        Email Address
                      </label>
                      <input
                        id="profileEmail"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'profileEmail-error' : undefined}
                      />
                      {errors.email && (
                        <p id="profileEmail-error" className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="profilePhone" className="block text-sm font-medium text-black dark:text-white mb-2">
                        Phone Number
                      </label>
                      <input
                        id="profilePhone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").substring(0, 11))}
                        className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'profilePhone-error' : undefined}
                      />
                      {errors.phone && (
                        <p id="profilePhone-error" className="text-red-500 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleProfileUpdate}
                    className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Update Profile
                  </button>
                </div>
              )}

              {activeTab === "security" && (
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                    Security Settings
                  </h2>

                  {/* Change Password */}
                  <div className="mb-6">
                    <h3 className="text-base font-medium text-black dark:text-white mb-4">
                      Change Password
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-black dark:text-white mb-2">
                          Current Password
                        </label>
                        <input
                          id="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                          className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.currentPassword ? "border-red-500" : "border-gray-300"
                          }`}
                          aria-invalid={!!errors.currentPassword}
                          aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
                        />
                        {errors.currentPassword && (
                          <p id="currentPassword-error" className="text-red-500 text-sm mt-1">
                            {errors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-black dark:text-white mb-2">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange("newPassword", e.target.value)}
                          className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.newPassword ? "border-red-500" : "border-gray-300"
                          }`}
                          aria-invalid={!!errors.newPassword}
                          aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
                        />
                        {errors.newPassword && (
                          <p id="newPassword-error" className="text-red-500 text-sm mt-1">
                            {errors.newPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="profileConfirmPassword" className="block text-sm font-medium text-black dark:text-white mb-2">
                          Confirm New Password
                        </label>
                        <input
                          id="profileConfirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.confirmPassword ? "border-red-500" : "border-gray-300"
                          }`}
                          aria-invalid={!!errors.confirmPassword}
                          aria-describedby={errors.confirmPassword ? 'profileConfirmPassword-error' : undefined}
                        />
                        {errors.confirmPassword && (
                          <p id="profileConfirmPassword-error" className="text-red-500 text-sm mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handlePasswordChange}
                        className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Change Transaction PIN */}
                  <div>
                    <h3 className="text-base font-medium text-black dark:text-white mb-4">
                      Change Transaction PIN
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="transactionPin" className="block text-sm font-medium text-black dark:text-white mb-2">
                          New Transaction PIN
                        </label>
                        <input
                          id="transactionPin"
                          type="password"
                          maxLength={4}
                          value={formData.transactionPin}
                          onChange={(e) =>
                            handleInputChange("transactionPin", e.target.value.replace(/\D/g, "").substring(0, 4))
                          }
                          placeholder="Enter 4-digit PIN"
                          className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.transactionPin ? "border-red-500" : "border-gray-300"
                          }`}
                          aria-invalid={!!errors.transactionPin}
                          aria-describedby={errors.transactionPin ? 'transactionPin-error' : undefined}
                        />
                        {errors.transactionPin && (
                          <p id="transactionPin-error" className="text-red-500 text-sm mt-1">
                            {errors.transactionPin}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handlePinChange}
                        className="px-6 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
                      >
                        Update PIN
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EmailVerificationModal
        open={showEmailModal}
        emailSent={emailSent}
        onClose={() => setShowEmailModal(false)}
        onSend={handleSendEmail}
      />

      <BVNModal
        open={showBVNModal}
        bvn={bvn}
        error={bvnError}
        onClose={() => setShowBVNModal(false)}
        onBVNChange={setBVN}
        onVerify={handleBVNVerify}
      />

      <BankDetailsModal
        open={showBankModal}
        details={bankDetails}
        errors={bankErrors}
        onClose={() => setShowBankModal(false)}
        onChange={handleBankDetailsChange}
        onSave={handleBankDetailsSave}
      />

      <BasicInfoModal
        open={showBasicInfoModal}
        info={basicInfo}
        errors={basicInfoErrors}
        onClose={() => setShowBasicInfoModal(false)}
        onChange={handleBasicInfoChange}
        onSave={handleBasicInfoSave}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
          <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-600" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-black dark:text-white mb-2">
                Confirm Logout
              </h2>
              <p className="text-black dark:text-white mb-4">
                Are you sure you want to logout?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-1/2 bg-gray-200 text-black dark:text-white py-3 rounded-2xl font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="w-1/2 bg-red-600 text-white py-3 rounded-2xl font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;
