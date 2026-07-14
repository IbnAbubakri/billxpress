// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function initializeTransaction({ email, amount, reference, callbackUrl, channels, metadata = {} }) {
  try {
    const body = {
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl,
      currency: 'NGN',
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: 'Wallet Funding',
            variable_name: 'wallet_funding',
            value: 'true',
          },
        ],
      },
    };
    if (channels) {
      body.channels = channels;
    }
    const response = await paystackApi.post('/transaction/initialize', body);
    logger.info({ reference, amount }, 'Paystack transaction initialized');
    return response.data;
  } catch (error) {
    logger.error({ error: error.response?.data }, 'Paystack initialization failed');
    throw error;
  }
}

export async function verifyTransaction(reference) {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    logger.info({ reference, status: response.data.data.status }, 'Paystack transaction verified');
    return response.data;
  } catch (error) {
    logger.error({ error: error.response?.data }, 'Paystack verification failed');
    throw error;
  }
}

export function verifyWebhookSignature(payload, signature) {
  if (!signature || !payload) return false;
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET || '')
    .update(payload)
    .digest();
  const sigBuf = Buffer.from(signature, 'hex');
  if (hash.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(hash, sigBuf);
}

export function generateReference(userId) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `WLF_${userId.slice(0, 8)}_${timestamp}_${random}`;
}
