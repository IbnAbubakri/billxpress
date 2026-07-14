// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useRef, useState } from "react";
import { ArrowLeft, User, Lock, Check, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import LogoutModal from "../ui/LogoutModal";
import { useAuth } from "../../hooks/useAuth";
import { useFocusTrap } from "../../hooks/useFocusTrap";

import type { PageProps } from '../../types/page';
import EmailVerificationModal from "./EmailVerificationModal";
import BVNModal from "./BVNModal";
import BankDetailsModal from "./BankDetailsModal";
import BasicInfoModal from "./BasicInfoModal";

const ProfilePage: React.FC<PageProps> = ({ user, onLogout, onUpdateProfile }) => {
  const { handleChangePassword, handleSetTransactionPin } = useAuth();
  const fullName = (user?.name || '').split(' ');
  const defaultFirstName = fullName[0] || '';
  const defaultLastName = fullName.slice(1).join(' ') || '';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const photoInputRef = useRef<HTMLInputElement>(null);
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
  const [bankErrors, setBankErrors] = useState<Record<string, string | null>>({});

  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');
  const [emailChangeSent, setEmailChangeSent] = useState(false);

  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState('');

  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [deletionConfirmText, setDeletionConfirmText] = useState('');

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
  const [basicInfoErrors, setBasicInfoErrors] = useState<Record<string, string | null>>({});

  const emailChangeRef = useFocusTrap(showEmailChangeModal, () => {
    setShowEmailChangeModal(false);
    setNewEmail('');
    setEmailChangeError('');
  });
  const phoneOtpRef = useFocusTrap(showPhoneOtpModal, () => {
    setShowPhoneOtpModal(false);
    setOtpCode('');
    setPhoneOtpError('');
  });
  const accountDeletionRef = useFocusTrap(showAccountDeletionModal, () => {
    setShowAccountDeletionModal(false);
    setDeletionConfirmText('');
  });

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
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const profileCompletion = (() => {
    const fields: (keyof typeof user)[] = ['name', 'phone', 'accountNumber', 'bankName', 'bvn', 'billingStreet', 'billingCity', 'homeStreet', 'homeCity'];
    const filled = fields.filter(f => user?.[f]).length;
    return Math.round((filled / fields.length) * 100);
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
    const newErrors: Record<string, string | null> = {};
    
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!validateEmail(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!validatePhone(formData.phone))
      newErrors.phone = "Please enter a valid phone number";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const normalizedPhone = formData.phone.startsWith("0")
        ? "+234" + formData.phone.slice(1)
        : formData.phone;

      const currentPhone = (user?.phone || '').replace(/^\+234/, "0");
      if (formData.phone !== currentPhone && formData.phone.length >= 10) {
        setPendingPhone(normalizedPhone);
        try {
          const { sendOtp } = await import('../../api/client');
          await sendOtp(normalizedPhone);
          setShowPhoneOtpModal(true);
        } catch {
          setErrors({ phone: "Failed to send OTP. Try again." });
        }
        return;
      }

      if (onUpdateProfile) {
        try {
          await onUpdateProfile({ name, phone: normalizedPhone });
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } catch {
          setErrors({ phone: "Failed to update profile. Try again." });
        }
      }
    }
  };

  const handlePasswordChange = async () => {
    const newErrors: Record<string, string | null> = {};

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
      try {
        await handleChangePassword(formData.currentPassword, formData.newPassword);
        setShowSuccess(true);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to change password.';
        setErrors({ currentPassword: msg });
      }
    }
  };

  const handlePinChange = async () => {
    const newErrors: Record<string, string | null> = {};

    if (!formData.transactionPin)
      newErrors.transactionPin = "Transaction PIN is required";
    if (formData.transactionPin.length !== 4)
      newErrors.transactionPin = "PIN must be 4 digits";
    if (!/^\d+$/.test(formData.transactionPin))
      newErrors.transactionPin = "PIN must contain only numbers";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await handleSetTransactionPin(formData.transactionPin);
        setShowSuccess(true);
        setFormData((prev) => ({ ...prev, transactionPin: "" }));
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to set PIN.';
        setErrors({ transactionPin: msg });
      }
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
    const errors: Record<string, string | null> = {};
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
    const errors: Record<string, string | null> = {};
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
          const payload: Record<string, string> = {
            billingStreet: basicInfo.billingStreet,
            billingCity: basicInfo.billingCity,
            billingState: basicInfo.billingState,
            billingCountry: basicInfo.billingCountry,
            homeStreet: basicInfo.homeStreet,
            homeCity: basicInfo.homeCity,
            homeState: basicInfo.homeState,
            homeZip: basicInfo.homeZip,
          };
          if (basicInfo.avatarPreview) payload.avatar = basicInfo.avatarPreview;
          await onUpdateProfile(payload);
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
          <div id="main-content" className="lg:col-span-3">
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm">
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                    Profile Information
                  </h2>

                  {/* Profile Picture */}
                  <div className="flex items-center mb-6">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover mr-6" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-6">
                        {formData.firstName.charAt(0)}
                        {formData.lastName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-black dark:text-white">
                        {formData.firstName} {formData.lastName}
                      </h3>
                      <p className="text-black dark:text-white mb-2">{formData.email}</p>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !onUpdateProfile) return;
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              await onUpdateProfile({ avatar: reader.result as string });
                            } catch { /* error handled upstream */ }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
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
                        className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-black dark:text-white bg-white dark:bg-dark-800 ${
                          errors.firstName ? "border-red-500" : "border-gray-300 dark:border-dark-700"
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
                        className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-black dark:text-white bg-white dark:bg-dark-800 ${
                          errors.lastName ? "border-red-500" : "border-gray-300 dark:border-dark-700"
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
                      <div className="flex gap-2">
                        <input
                          id="profileEmail"
                          type="email"
                          value={formData.email}
                          readOnly
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl bg-gray-50 dark:bg-dark-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                        <button
                          onClick={() => setShowEmailChangeModal(true)}
                          className="px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm hover:bg-blue-700 transition-colors flex-shrink-0 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email change requires verification.</p>
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
                        className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-black dark:text-white bg-white dark:bg-dark-800 ${
                          errors.phone ? "border-red-500" : "border-gray-300 dark:border-dark-700"
                        }`}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'profilePhone-error' : undefined}
                      />
                      {errors.phone && (
                        <p id="profilePhone-error" className="text-red-500 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Phone change requires OTP verification.</p>
                    </div>
                  </div>

                  {/* KYC Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="profileDOB" className="block text-sm font-medium text-black dark:text-white mb-2">Date of Birth</label>
                      <input id="profileDOB" type="date" value={user?.dateOfBirth || ''}
                        onChange={async (e) => { if (onUpdateProfile) await onUpdateProfile({ dateOfBirth: e.target.value }); }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 text-black dark:text-white bg-white dark:bg-dark-800"
                      />
                    </div>
                    <div>
                      <label htmlFor="profileGender" className="block text-sm font-medium text-black dark:text-white mb-2">Gender</label>
                      <select id="profileGender" value={user?.gender || ''}
                        onChange={async (e) => { if (onUpdateProfile) await onUpdateProfile({ gender: e.target.value }); }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 text-black dark:text-white bg-white dark:bg-dark-800"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="profileNIN" className="block text-sm font-medium text-black dark:text-white mb-2">NIN (National ID)</label>
                      <input id="profileNIN" type="text" value={user?.nin || ''}
                        onChange={async (e) => { if (onUpdateProfile) await onUpdateProfile({ nin: e.target.value }); }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 text-black dark:text-white bg-white dark:bg-dark-800"
                      />
                    </div>
                    <div>
                      <label htmlFor="profileEmployStatus" className="block text-sm font-medium text-black dark:text-white mb-2">Employment Status</label>
                      <select id="profileEmployStatus" value={user?.employmentStatus || ''}
                        onChange={async (e) => { if (onUpdateProfile) await onUpdateProfile({ employmentStatus: e.target.value }); }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 text-black dark:text-white bg-white dark:bg-dark-800"
                      >
                        <option value="">Select status</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="student">Student</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="profileIncome" className="block text-sm font-medium text-black dark:text-white mb-2">Annual Income</label>
                      <select id="profileIncome" value={user?.annualIncome || ''}
                        onChange={async (e) => { if (onUpdateProfile) await onUpdateProfile({ annualIncome: e.target.value }); }
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 text-black dark:text-white bg-white dark:bg-dark-800"
                      >
                        <option value="">Select range</option>
                        <option value="0-1M">₦0 - ₦1,000,000</option>
                        <option value="1M-5M">₦1,000,000 - ₦5,000,000</option>
                        <option value="5M-10M">₦5,000,000 - ₦10,000,000</option>
                        <option value="10M+">₦10,000,000+</option>
                      </select>
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
                          className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-black dark:text-white bg-white dark:bg-dark-800 ${
                            errors.currentPassword ? "border-red-500" : "border-gray-300 dark:border-dark-700"
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
                          className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-black dark:text-white bg-white dark:bg-dark-800 ${
                            errors.newPassword ? "border-red-500" : "border-gray-300 dark:border-dark-700"
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
                          className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-black dark:text-white bg-white dark:bg-dark-800 ${
                            errors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-dark-700"
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
                          className={`w-full px-4 py-3 border rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-black dark:text-white bg-white dark:bg-dark-800 ${
                            errors.transactionPin ? "border-red-500" : "border-gray-300 dark:border-dark-700"
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

      {/* Email Change Modal */}
      {showEmailChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Change email address">
          <div ref={emailChangeRef} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-black dark:text-white mb-4">Change Email Address</h2>
            {!emailChangeSent ? (
              <>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl mb-3 text-black dark:text-white bg-white dark:bg-dark-800"
                />
                {emailChangeError && <p className="text-red-500 text-sm mb-3">{emailChangeError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setShowEmailChangeModal(false); setNewEmail(''); setEmailChangeError(''); }}
                    className="w-1/2 bg-gray-200 text-black py-3 rounded-2xl hover:bg-gray-300 transition-colors">Cancel</button>
                  <button onClick={async () => {
                    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                      setEmailChangeError('Enter a valid email address.'); return;
                    }
                    setEmailChangeError('');
                    try {
                      await onUpdateProfile?.({ email: newEmail });
                      setEmailChangeSent(true);
                      setFormData(p => ({ ...p, email: newEmail }));
                    } catch (err: unknown) {
                      setEmailChangeError(err instanceof Error ? err.message : 'Failed to update email.');
                    }
                  }} className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl hover:bg-blue-700 transition-colors">Save</button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-green-600 mb-4">Email updated. Verification email sent to your new address.</p>
                <button onClick={() => { setShowEmailChangeModal(false); setEmailChangeSent(false); setNewEmail(''); }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phone OTP Verification Modal */}
      {showPhoneOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Verify phone number">
          <div ref={phoneOtpRef} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-black dark:text-white mb-2">Verify Phone Number</h2>
            <p className="text-sm text-black dark:text-white mb-4">Enter the OTP sent to {pendingPhone}</p>
            <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))} placeholder="6-digit OTP"
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl mb-3 text-center text-lg tracking-widest text-black dark:text-white bg-white dark:bg-dark-800"
            />
            {phoneOtpError && <p className="text-red-500 text-sm mb-3">{phoneOtpError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowPhoneOtpModal(false); setOtpCode(''); setPhoneOtpError(''); }}
                className="w-1/2 bg-gray-200 text-black py-3 rounded-2xl hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={async () => {
                if (!otpCode || otpCode.length < 6) { setPhoneOtpError('Enter the 6-digit code.'); return; }
                setPhoneOtpError('');
                try {
                  const { verifyOtp } = await import('../../api/client');
                  await verifyOtp(pendingPhone, otpCode);
                  const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
                  if (onUpdateProfile) {
                    await onUpdateProfile({ name, phone: pendingPhone });
                  }
                  setShowPhoneOtpModal(false);
                  setOtpCode('');
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                } catch {
                  setPhoneOtpError('Invalid or expired OTP.');
                }
              }} className="w-1/2 bg-blue-600 text-white py-3 rounded-2xl hover:bg-blue-700 transition-colors">Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {showAccountDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Delete account">
          <div ref={accountDeletionRef} className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-red-600 mb-2">Delete Account</h2>
            <p className="text-sm text-black dark:text-white mb-4">This action is permanent. All your data will be deleted. Type <strong>DELETE</strong> to confirm.</p>
            <input type="text" value={deletionConfirmText} onChange={(e) => setDeletionConfirmText(e.target.value)} placeholder="Type DELETE"
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-700 rounded-2xl mb-3 text-black dark:text-white bg-white dark:bg-dark-800"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowAccountDeletionModal(false); setDeletionConfirmText(''); }}
                className="w-1/2 bg-gray-200 text-black py-3 rounded-2xl hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={async () => {
                if (deletionConfirmText !== 'DELETE') return;
                try {
                  const { handleDeleteAccount } = await import('../../hooks/useAuth').then(m => ({ handleDeleteAccount: m.useAuth().handleDeleteAccount }));
                  await handleDeleteAccount();
                  onLogout();
                } catch { /* ignore */ }
              }} className="w-1/2 bg-red-600 text-white py-3 rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deletionConfirmText !== 'DELETE'}>Delete My Account</button>
            </div>
          </div>
        </div>
      )}

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

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;
