import React, { useState } from "react";
import { ArrowLeft, GraduationCap, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import waecIcon from "../../assets/icons/waec.svg";
import jambIcon from "../../assets/icons/jamb.png";
import necoIcon from "../../assets/icons/neco.png";
import nabtebIcon from "../../assets/icons/nabteb.png";
import defaultIcon from "../../assets/icons/default.svg";

import type { PageProps } from '../../types/page';

interface EducationPageProps extends PageProps {}

const EducationPage: React.FC<EducationPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState("");
  const [examNumber, setExamNumber] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const educationServices = [
    {
      id: "waec",
      name: "WAEC",
      icon: waecIcon || defaultIcon,
      description: "West African Examinations Council",
    },
    {
      id: "jamb",
      name: "JAMB",
      icon: jambIcon || defaultIcon,
      description: "Joint Admissions and Matriculation Board",
    },
    {
      id: "neco",
      name: "NECO",
      icon: necoIcon || defaultIcon,
      description: "National Examinations Council",
    },
    {
      id: "nabteb",
      name: "NABTEB",
      icon: nabtebIcon || defaultIcon,
      description: "National Business and Technical Examinations Board",
    },
  ];

  const packages = {
    waec: [
      {
        id: "registration",
        name: "WAEC Registration",
        price: 15000,
        description: "Full registration for WAEC examination",
      },
      {
        id: "result_checker",
        name: "Result Checker",
        price: 1000,
        description: "Check your WAEC results online",
      },
    ],
    jamb: [
      {
        id: "registration",
        name: "JAMB Registration",
        price: 4700,
        description: "UTME registration form",
      },
      {
        id: "result_checker",
        name: "Result Checker",
        price: 1000,
        description: "Check your JAMB results online",
      },
      {
        id: "change_course",
        name: "Change of Course/Institution",
        price: 2500,
        description: "Change your course or institution",
      },
    ],
    neco: [
      {
        id: "registration",
        name: "NECO Registration",
        price: 13500,
        description: "Full registration for NECO examination",
      },
      {
        id: "result_checker",
        name: "Result Checker",
        price: 1000,
        description: "Check your NECO results online",
      },
    ],
    nabteb: [
      {
        id: "registration",
        name: "NABTEB Registration",
        price: 12000,
        description: "Full registration for NABTEB examination",
      },
      {
        id: "result_checker",
        name: "Result Checker",
        price: 1000,
        description: "Check your NABTEB results online",
      },
    ],
  };

  const validateExamNumber = (number: string) => {
    if (!number) return "Exam/Registration number is required";
    if (number.length < 8) return "Exam number must be at least 8 characters";
    return null;
  };

  const handleExamNumberChange = (value: string) => {
    setExamNumber(value.toUpperCase());

    const error = validateExamNumber(value);
    setErrors((prev: any) => ({ ...prev, examNumber: error }));
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedPackage(""); // Reset package when service changes
  };

  const handleSubmit = () => {
    const examError = validateExamNumber(examNumber);

    const newErrors: any = {};
    if (!selectedService)
      newErrors.service = "Please select an education service";
    if (examError) newErrors.examNumber = examError;
    if (!selectedPackage) newErrors.package = "Please select a package";

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

  const selectedPackageDetails =
    selectedService && selectedPackage
      ? packages[selectedService as keyof typeof packages]?.find(
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
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
              <GraduationCap className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">
                Education Payments
              </h1>
              <p className="text-black dark:text-white">
                Pay for examination fees and services
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {/* Education Service Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Education Service
            </label>
            <div className="grid grid-cols-2 gap-3">
              {educationServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceChange(service.id)}
                  className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center ${
                    selectedService === service.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={service.icon}
                    alt={service.name}
                    className="w-8 h-8 object-contain mx-auto mb-2 rounded-lg shadow"
                  />
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs text-black dark:text-white">{service.description}</p>
                </button>
              ))}
            </div>
            {errors.service && (
              <p className="text-red-500 text-sm mt-1">{errors.service}</p>
            )}
          </div>

          {/* Exam Number Input */}
          <div className="mb-4">
            <label htmlFor="examNumber" className="block text-sm font-medium text-black dark:text-white mb-2">
              Exam/Registration Number
            </label>
            <input
              id="examNumber"
              type="text"
              value={examNumber}
              onChange={(e) => handleExamNumberChange(e.target.value)}
              placeholder="Enter your exam number"
              className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.examNumber ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.examNumber}
              aria-describedby={errors.examNumber ? 'examNumber-error' : undefined}
            />
            {errors.examNumber && (
              <p id="examNumber-error" className="text-red-500 text-sm mt-1">{errors.examNumber}</p>
            )}
          </div>

          {/* Package Selection */}
          {selectedService && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Select Service
              </label>
              <div className="space-y-3">
                {packages[selectedService as keyof typeof packages]?.map(
                  (pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`w-full p-4 border-2 rounded-2xl transition-all text-left ${
                        selectedPackage === pkg.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 dark:border-dark-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-sm text-black dark:text-white mt-1">
                            {pkg.description}
                          </p>
                        </div>
                        <p className="font-bold text-base ml-4">
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

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-secondary text-white py-4 rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
          >
            Continue
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && selectedPackageDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-dark-900/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-4 w-full max-w-sm">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                  Confirm Payment
                </h3>
                <p className="text-black dark:text-white">
                  Please review your education payment
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Service</span>
                  <span className="font-medium">
                    {
                      educationServices.find((s) => s.id === selectedService)
                        ?.name
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Exam Number</span>
                  <span className="font-medium">{examNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Package</span>
                  <span className="font-medium">
                    {selectedPackageDetails.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Amount</span>
                  <span className="font-medium">
                    ₦{selectedPackageDetails.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black dark:text-white">Charges</span>
                  <span className="font-medium">₦0.00</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₦{selectedPackageDetails.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <h2 className="text-lg font-bold text-black dark:text-white mb-4 text-center">
                Confirm Logout
              </h2>
              <p className="text-black dark:text-white mb-4 text-center">
                Are you sure you want to logout?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EducationPage;
