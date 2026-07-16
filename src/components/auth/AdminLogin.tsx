// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import Seo from '../ui/Seo';
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, EyeOff, Fingerprint } from "lucide-react";
import { Logo } from "../ui/Logo";
import { adminLogin, getMe } from "../../api/client";
import { useNavigate } from "react-router-dom";

const AUTH_STORAGE_KEY = 'billxpress_auth';

function saveStoredAuth(user: Record<string, unknown>, isAdmin: boolean) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      userId: user.id, email: user.email, role: isAdmin ? 'admin' : 'user',
      name: user.name || '', isAdmin, timestamp: Date.now(),
    }));
  } catch { /* noop */ }
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState<{ email: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await adminLogin(formData.email, formData.password);
      if (result.mfaRequired) {
        setMfaChallenge({ email: result.tempEmail });
        setIsLoading(false);
        return;
      }
      const { user } = await getMe();
      if (user) {
        saveStoredAuth(user, true);
        queryClient.setQueryData(['auth', 'me'], { user, isAdmin: true, isAuthenticated: true });
      }
      navigate('/admin');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode) return;
    setIsLoading(true);
    setError("");
    try {
      await adminLogin(formData.email, formData.password, mfaCode);
      const { user } = await getMe();
      if (user) {
        saveStoredAuth(user, true);
        queryClient.setQueryData(['auth', 'me'], { user, isAdmin: true, isAuthenticated: true });
      }
      navigate('/admin');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || "Invalid verification code");
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-dark-900">
      <Seo title="Admin Login" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeIn' }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <div className="flex justify-center mb-4">
            <Logo iconOnly />
          </div>
          <h1 className="text-3xl font-ginto font-bold text-black dark:text-white mb-2">
            BillXpress
          </h1>
          <p className="text-black dark:text-white text-base">
            Secure access to your VTU dashboard
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6"
        >
          {mfaChallenge ? (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-900/50 text-error-700 dark:text-error-300 px-4 py-3 rounded-2xl text-sm"
                >
                  {error}
                </motion.div>
              )}
              <div className="text-center mb-4">
                <p className="text-sm text-black dark:text-white">Enter the 6-digit code from your authenticator app</p>
              </div>
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-black dark:text-white mb-2">Authentication Code</label>
                <input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full premium-input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  aria-label="Enter your 6-digit authentication code"
                />
              </div>
              <motion.button
                type="submit"
                disabled={isLoading || mfaCode.length < 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full premium-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Verify Code</span>
                )}
              </motion.button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-900/50 text-error-700 dark:text-error-300 px-4 py-3 rounded-2xl text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-black dark:text-white mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="premium-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-black dark:text-white mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="premium-input pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full premium-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" aria-hidden="true" />
                  <span>Continue</span>
                </>
              )}
            </motion.button>
          </form>
          )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-xs text-black dark:text-white"
        >
          Protected by enterprise-grade security
        </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
