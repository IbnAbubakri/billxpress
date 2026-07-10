import axios from 'axios';

const api = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let csrfTokenPromise: Promise<string> | null = null;

function getCSRFToken(): Promise<string> {
  if (csrfTokenPromise) return csrfTokenPromise;
  csrfTokenPromise = new Promise(async (resolve, reject) => {
    try {
      const res = await api.get('/csrf-token');
      csrfTokenPromise = null;
      resolve(res.data.csrfToken);
    } catch (err) {
      csrfTokenPromise = null;
      reject(err);
    }
  });
  return csrfTokenPromise;
}

async function ensureCSRF() {
  const token = await getCSRFToken();
  return token;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/refresh') &&
      !originalRequest.url?.includes('/csrf-token')
    ) {
      originalRequest._retry = true;
      try {
        const csrf = await getCSRFToken();
        await api.post('/refresh', {}, { headers: { 'x-csrf-token': csrf } });
        const token = await getCSRFToken();
        originalRequest.headers['x-csrf-token'] = token;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/login', { email, password }, {
    headers: { 'x-csrf-token': csrf },
  });
  return data;
}

export async function register(email: string, password: string) {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/register', { email, password }, {
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

export async function sendVerificationEmail() {
  const csrf = await ensureCSRF();
  const { data } = await api.post('/send-verification', {}, {
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

export default api;
