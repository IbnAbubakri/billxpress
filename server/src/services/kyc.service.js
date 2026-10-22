// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import axios from 'axios';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const dojahApi = axios.create({
  baseURL: env.DOJAH_BASE_URL,
  headers: {
    Authorization: env.DOJAH_SECRET_KEY,
    AppId: env.DOJAH_APP_ID,
    'Content-Type': 'application/json',
  },
});

export function isKycConfigured() {
  return Boolean(env.DOJAH_APP_ID && env.DOJAH_SECRET_KEY);
}

export async function verifyBVN(bvn, { firstName, lastName, dateOfBirth } = {}) {
  const params = { bvn };
  if (firstName) params.first_name = firstName;
  if (lastName) params.last_name = lastName;
  if (dateOfBirth) params.dob = dateOfBirth;

  try {
    const response = await dojahApi.get('/api/v1/kyc/bvn/full', { params });
    return response.data;
  } catch (error) {
    logger.error({ error: error.response?.data }, 'Dojah BVN verification failed');
    throw error;
  }
}
