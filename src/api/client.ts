// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const walletApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let csrfTokenPromise: Promise<string> | null = null;

function getCSRFToken(): Promise<string> {
  if (csrfTokenPromise) return csrfTokenPromise;
  csrfTokenPromise = new Promise<string>((resolve, reject) => {
    api.get('/csrf-token')
      .then(res => {
        csrfTokenPromise = null;
        resolve(res.data.csrfToken);
      })
      .catch(err => {
        csrfTokenPromise = null;
        reject(err);
      });
  });
  return csrfTokenPromise;
}

async function ensureCSRF() {
  const token = await getCSRFToken();
  return token;
}

async function refreshSession() {
  const csrf = await getCSRFToken();
  await api.post('/refresh', {}, { headers: { 'x-csrf-token': csrf } });
}

interface RetryableRequest {
  _retry?: boolean;
  url?: string;
  headers: Record<string, string>;
}

function createRetryInterceptor(instance: typeof api) {
  return async (error: unknown) => {
    const err = error as {
      config?: RetryableRequest;
      response?: { status?: number };
    };
    const originalRequest = err.config;
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      csrfTokenPromise = null;
    }
    const EXCLUDED_URLS = ['/refresh', '/csrf-token', '/me', '/login', '/admin-login', '/register', '/forgot-password', '/reset-password'];
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !EXCLUDED_URLS.some(url => originalRequest.url?.includes(url))
    ) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        const token = await getCSRFToken();
        originalRequest.headers['x-csrf-token'] = token;
        return instance(originalRequest as unknown as Parameters<typeof instance>[0]);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  };
}

api.interceptors.response.use((response) => response, createRetryInterceptor(api));
walletApi.interceptors.response.use((response) => response, createRetryInterceptor(walletApi));

export async function login(login: string, password: string, totpCode?: string) {
  const csrf = await ensureCSRF();
  const body: Record<string, string> = { login, password };
  if (totpCode) body.totpCode = totpCode;
  const { data } = await api.post('/login', body, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function adminLogin(login: string, password: string, totpCode?: string) {
  const csrf = await ensureCSRF();
  const body: Record<string, string> = { login, password };
  if (totpCode) body.totpCode = totpCode;
  const { data } = await api.post('/admin-login', body, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function register(email: string, password: string, extra?: { phone?: string; name?: string }) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/register', { email, password, ...extra }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function logout() {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/logout', {}, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/me');
  return data;
}

export async function forgotPassword(email: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/forgot-password', { email }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/reset-password', { token, password }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function updateProfile(profileData: import('../types').ProfileUpdateData) {
  const csrf = await ensureCSRF();
  const { data } = await api.put('/profile', profileData, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.put('/password', { currentPassword, newPassword }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function setTransactionPin(pin: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.put('/transaction-pin', { pin }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function sendVerificationEmail(email?: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/send-verification', { email }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function verifyEmail(token: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/verify-email', { token }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function checkPhone(phone: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/check-phone', { phone }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { ok: boolean };
}

export async function checkEmail(email: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/check-email', { email }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { ok: boolean };
}

export async function sendOtp(phone: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/send-otp', { phone }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { message: string; expiresIn: number; code?: string };
}

export async function verifyOtp(phone: string, code: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/verify-otp', { phone, code }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { verified: boolean };
}

export async function generateMfaSecret() {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/mfa/generate', {}, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { secret: string; uri: string };
}

export async function verifyMfaSetup(token: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/mfa/verify', { token }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { success: boolean; backupCodes: string[] };
}

export async function disableMfa(password: string, totpCode?: string) {
  const csrf = await ensureCSRF();
  const body: Record<string, string> = { password };
  if (totpCode) body.totpCode = totpCode;
  const { data } = await api.post('/mfa/disable', body, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function deleteAccount(password: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.delete('/account', {
    data: { password },
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function getTransactions(params?: { page?: number; limit?: number }) {
  const csrf = await ensureCSRF();
  const { data } = await walletApi.get('/transactions', { params, headers: { 'x-csrf-token': csrf } });
  return data;
}

export async function fundWallet(amount: number, method?: string) {
  const csrf = await ensureCSRF();
  const { data } = await walletApi.post('/wallet/fund', { amount, method }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function initializeWalletFunding(amount: number, method?: string) {
  const csrf = await ensureCSRF();
  const { data } = await walletApi.post('/wallet/fund/initialize', { amount, method }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { authorization_url: string; reference: string };
}

export async function verifyWalletFunding(reference: string) {
  const { data } = await walletApi.get('/wallet/fund/verify', {
    params: { reference },
  });
  return data as { status: string; message: string; balance?: number; amountFunded?: number };
}

export async function withdrawFunds(amount: number, bank: string, accountNumber: string, accountName: string, transactionPin?: string) {
  const csrf = await ensureCSRF();
  const { data } = await walletApi.post('/wallet/withdraw', { amount, bank, accountNumber, accountName, transactionPin }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export default api;
