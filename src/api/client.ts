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

function createRetryInterceptor(instance: typeof api) {
  return async (error: any) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      csrfTokenPromise = null;
    }
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/refresh') &&
      !originalRequest.url?.includes('/csrf-token') &&
      !originalRequest.url?.includes('/me')
    ) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        const token = await getCSRFToken();
        originalRequest.headers['x-csrf-token'] = token;
        return instance(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  };
}

api.interceptors.response.use((response) => response, createRetryInterceptor(api));
walletApi.interceptors.response.use((response) => response, createRetryInterceptor(walletApi));

export async function login(login: string, password: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/login', { login, password }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function adminLogin(login: string, password: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/admin-login', { login, password }, {
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
  return data as { exists: boolean; hasEmail?: boolean };
}

export async function checkEmail(email: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/check-email', { email }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data as { exists: boolean };
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

export async function disableMfa() {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/mfa/disable', {}, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function deleteAccount() {
  const csrf = await ensureCSRF();
  const { data } = await api.delete('/account', {
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

export async function withdrawFunds(amount: number, bank: string, accountNumber: string, accountName: string, transactionPin?: string) {
  const csrf = await ensureCSRF();
  const { data } = await walletApi.post('/wallet/withdraw', { amount, bank, accountNumber, accountName, transactionPin }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export default api;
