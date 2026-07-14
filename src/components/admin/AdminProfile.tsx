// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Camera
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const AdminProfile: React.FC = () => {
  const { user, handleUpdateProfile, handleChangePassword, handleGenerateMfaSecret, handleVerifyMfaSetup, handleDisableMfa, handleDeleteAccount } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [deletionConfirmText, setDeletionConfirmText] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaUri, setMfaUri] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaStep, setMfaStep] = useState<'initial' | 'setup' | 'verify' | 'done'>('initial');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminData, setAdminData] = useState({
    id: 1,
    name: user?.name || 'Admin',
    email: user?.email || 'admin@billxpress.com',
    phone: user?.phone || '+234 800 000 0000',
    role: 'Super Admin',
    created_at: '2024-01-01',
    last_login: new Date().toISOString(),
    permissions: ['users', 'transactions', 'pricing', 'analytics', 'settings']
  });

  const [editForm, setEditForm] = useState({
    name: adminData.name,
    email: adminData.email,
    phone: adminData.phone
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    transaction_alerts: true,
    security_alerts: true,
    weekly_reports: true
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await handleUpdateProfile({ name: editForm.name, phone: editForm.phone });
      setAdminData(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
    } catch { /* error handled by mutation */ }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordError('');
    setSaving(true);
    try {
      await handleChangePassword(passwordForm.current_password, passwordForm.new_password);
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    }
    setSaving(false);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-ginto font-bold text-black dark:text-white">Admin Profile</h1>
          <p className="text-black dark:text-white mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-ginto font-semibold text-black dark:text-white">Basic Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-4 py-2 bg-success-600 text-white rounded-xl hover:bg-success-700 transition-colors"
                  >
                    <Save className="w-4 h-4" aria-hidden="true" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 px-4 py-2 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                  <User className="w-10 h-10 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-black dark:text-white">{adminData.name}</h4>
                  <p className="text-black dark:text-white">{adminData.role}</p>
                  {user?.avatar && (
                    <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover mb-2" />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        try {
                          await handleUpdateProfile({ avatar: reader.result as string });
                        } catch { /* error handled by mutation */ }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700 mt-1"
                  >
                    <Camera className="w-4 h-4 mr-1" aria-hidden="true" />
                    Change Photo
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-name" className="block text-sm font-medium text-black dark:text-white mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      id="admin-name"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="premium-input"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                      <User className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                      <span className="text-black dark:text-white">{adminData.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-black dark:text-white mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      id="admin-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="premium-input"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                      <Mail className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                      <span className="text-black dark:text-white">{adminData.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="admin-phone" className="block text-sm font-medium text-black dark:text-white mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      id="admin-phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="premium-input"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                      <Phone className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                      <span className="text-black dark:text-white">{adminData.phone}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="admin-role" className="block text-sm font-medium text-black dark:text-white mb-2">
                    Role
                  </label>
                  <div id="admin-role" className="flex items-center space-x-2 p-3 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                    <Shield className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                    <span className="text-black dark:text-white">{adminData.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 p-4"
          >
            <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">Security Settings</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-black dark:text-white">Password</p>
                    <p className="text-sm text-black dark:text-white">Last changed 30 days ago</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors"
                >
                  Change Password
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-black dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-black dark:text-white">Add an extra layer of security</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!user?.mfaEnabled) {
                      try {
                        const result = await handleGenerateMfaSecret();
                        setMfaSecret(result.secret);
                        setMfaUri(result.uri);
                        setMfaStep('setup');
                      } catch { setMfaError('Failed to generate secret.'); }
                    }
                    setShowMFAModal(true);
                  }}
                  className="px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors"
                >
                  {user?.mfaEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notification Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 p-4"
          >
            <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">Notification Preferences</h2>
            
            <div className="space-y-3">
              {[
                { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'sms_notifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                { key: 'transaction_alerts', label: 'Transaction Alerts', description: 'Get notified of new transactions' },
                { key: 'security_alerts', label: 'Security Alerts', description: 'Important security notifications' },
                { key: 'weekly_reports', label: 'Weekly Reports', description: 'Receive weekly performance reports' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-dark-800 rounded-xl">
                  <div>
                    <p className="font-medium text-black dark:text-white">{item.label}</p>
                    <p className="text-sm text-black dark:text-white">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-700 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Account Summary */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 p-4"
          >
            <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">Account Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-dark-700">
                <span className="text-black dark:text-white">Admin ID</span>
                <span className="font-medium text-black dark:text-white">#{adminData.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-dark-700">
                <span className="text-black dark:text-white">Account Created</span>
                <span className="font-medium text-black dark:text-white">
                  {new Date(adminData.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-dark-700">
                <span className="text-black dark:text-white">Last Login</span>
                <span className="font-medium text-black dark:text-white">
                  {new Date(adminData.last_login).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-black dark:text-white">Status</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-success-100 dark:bg-success-900/30 text-success-700 rounded-full">
                  Active
                </span>
              </div>
            </div>
          </motion.div>

          {/* Permissions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 p-4"
          >
            <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">Permissions</h2>
            
            <div className="space-y-2">
              {adminData.permissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-2 p-2 bg-neutral-50 dark:bg-dark-800 rounded-lg">
                  <Shield className="w-4 h-4 text-success-500" aria-hidden="true" />
                  <span className="text-sm text-black dark:text-white capitalize">{permission.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 p-4"
          >
            <h2 className="text-base font-ginto font-semibold text-black dark:text-white mb-4">Account Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => setShowAccountDeletionModal(true)}
                className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showAccountDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-dark-900/80">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeIn' }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-ginto font-semibold text-red-600 mb-2">Delete Account</h2>
            <p className="text-sm text-black dark:text-white mb-4">This action is permanent. All your data will be deleted. Type <strong>DELETE</strong> to confirm.</p>
            <input type="text" value={deletionConfirmText} onChange={(e) => setDeletionConfirmText(e.target.value)} placeholder="Type DELETE"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-3" />
            <div className="flex gap-3">
              <button onClick={() => { setShowAccountDeletionModal(false); setDeletionConfirmText(''); }}
                className="w-1/2 bg-gray-200 text-black py-3 rounded-xl hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={async () => {
                if (deletionConfirmText !== 'DELETE') return;
                try {
                  await handleDeleteAccount();
                  window.location.href = '/';
                } catch { /* ignore */ }
              }} className="w-1/2 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deletionConfirmText !== 'DELETE'}>Delete My Account</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MFA Modal */}
      {showMFAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-dark-900/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeIn' }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            {user?.mfaEnabled && mfaStep === 'initial' ? (
              <div className="text-center">
                <Key className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-lg font-ginto font-semibold text-black dark:text-white mb-2">Two-Factor Authentication</h2>
                <p className="text-black dark:text-white mb-4">2FA is currently enabled on your account.</p>
                <button onClick={async () => {
                  try {
                    await handleDisableMfa();
                    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
                    setShowMFAModal(false);
                  } catch { setMfaError('Failed to disable 2FA.'); }
                }} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 mb-2 w-full">Disable 2FA</button>
                <button onClick={() => setShowMFAModal(false)} className="premium-button w-full">Close</button>
                {mfaError && <p role="alert" className="text-red-500 text-sm mt-2">{mfaError}</p>}
              </div>
            ) : mfaStep === 'setup' || mfaStep === 'initial' ? (
              <div className="text-center">
                <Key className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-lg font-ginto font-semibold text-black dark:text-white mb-2">Set Up Two-Factor Authentication</h2>
                <p className="text-black dark:text-white mb-4">Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.).</p>
                {mfaUri && (
                  <div className="bg-white p-4 rounded-xl inline-block mb-4">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaUri)}`} alt="MFA QR Code" className="w-48 h-48 mx-auto" />
                  </div>
                )}
                <p className="text-xs text-black dark:text-white mb-4 break-all">Or enter this key manually: <code className="font-mono bg-neutral-100 dark:bg-dark-700 px-2 py-1 rounded">{mfaSecret}</code></p>
                <input type="text" value={mfaToken} onChange={(e) => setMfaToken(e.target.value)} placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-3 text-center text-lg tracking-widest"
                />
                {mfaError && <p role="alert" className="text-red-500 text-sm mb-3">{mfaError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setShowMFAModal(false); setMfaStep('initial'); setMfaToken(''); setMfaError(''); }}
                    className="w-1/2 bg-gray-200 text-black py-3 rounded-xl hover:bg-gray-300 transition-colors">Cancel</button>
                  <button onClick={async () => {
                    if (!mfaToken || mfaToken.length < 6) { setMfaError('Enter a valid 6-digit code.'); return; }
                    setMfaError('');
                    try {
                      const result = await handleVerifyMfaSetup(mfaToken);
                      setMfaBackupCodes(result.backupCodes);
                      setMfaStep('done');
                      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
                    } catch (err: unknown) {
                      setMfaError(err instanceof Error ? err.message : 'Verification failed.');
                    }
                  }} className="w-1/2 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors">Verify</button>
                </div>
              </div>
            ) : mfaStep === 'done' ? (
              <div className="text-center">
                <Key className="w-12 h-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-lg font-ginto font-semibold text-black dark:text-white mb-2">2FA Enabled Successfully</h2>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Save these backup codes:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {mfaBackupCodes.map((code, i) => (
                      <code key={i} className="font-mono text-sm bg-white dark:bg-dark-700 px-2 py-1 rounded text-black dark:text-white">{code}</code>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">Each code can only be used once. Store them safely.</p>
                </div>
                <button onClick={() => { setShowMFAModal(false); setMfaStep('initial'); setMfaToken(''); setMfaBackupCodes([]); }}
                  className="premium-button w-full">Done</button>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-dark-900/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeIn' }}
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-ginto font-semibold text-black dark:text-white">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  aria-label="Close modal"
                  className="p-2 text-black dark:text-white hover:text-black dark:hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label htmlFor="admin-current-password" className="block text-sm font-medium text-black dark:text-white mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="admin-current-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                    className="premium-input pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white hover:text-black dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="admin-new-password" className="block text-sm font-medium text-black dark:text-white mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                    className="premium-input pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white hover:text-black dark:hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="admin-confirm-password" className="block text-sm font-medium text-black dark:text-white mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                    className="premium-input pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white hover:text-black dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <p role="alert" className="text-red-500 text-sm">{passwordError}</p>
              )}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="flex-1 premium-button disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-6 py-3 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-dark-700 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;