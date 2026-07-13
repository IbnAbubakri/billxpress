# Wallet Funding Implementation with Paystack

## Overview

This document outlines the complete implementation process for integrating Paystack payment gateway into the BillXpress fintech app for wallet funding functionality.

## Current State

The wallet funding feature currently simulates payments by directly adding money to user balances without real payment processing. This needs to be replaced with actual Paystack integration.

### Existing Files to Modify
- `server/src/controllers/wallet.controller.js` - Add initialization endpoint
- `server/src/routes/wallet.routes.js` - Add new routes
- `src/components/modals/FundWalletModal.tsx` - Update frontend flow
- `src/api/client.ts` - Add new API functions

### New Files to Create
- `server/src/services/paystack.service.js` - Paystack API client
- `server/src/webhooks/paystack.webhook.js` - Webhook handler
- `server/src/routes/webhook.routes.js` - Webhook routes

---

## Step 0: Get Paystack API Keys (Test Mode)

Before implementing, you need to get API keys from Paystack for development.

### 1. Create Paystack Account
- Go to https://dashboard.paystack.com
- Click **Sign Up** and create an account
- Verify your email address

### 2. Get Test API Keys
- Log in to your Paystack Dashboard
- Click on your **profile icon** (top right)
- Go to **Settings**
- Click on **API Keys & Webhooks** tab
- You'll see your test keys:
  - **Test Secret Key**: `sk_test_xxxxxxxx` (keep this secret!)
  - **Test Public Key**: `pk_test_xxxxxxxx` (safe for frontend use)

### 3. Copy Your Keys
Copy both keys and add them to your `.env` file (create if doesn't exist):

```env
# Paystack Test Keys
PAYSTACK_SECRET_KEY=sk_test_your_actual_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_actual_key_here
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Important Notes
| Key Type | Prefix | Usage |
|----------|--------|-------|
| Test Secret | `sk_test_` | Backend only, never expose |
| Test Public | `pk_test_` | Frontend safe |
| Live Secret | `sk_live_` | Production backend |
| Live Public | `pk_live_` | Production frontend |

- **Test mode** lets you simulate payments without real money
- **Test cards** work only in test mode (see Testing section below)
- Never commit API keys to git - use `.env` file

---

## Implementation Steps

### Step 1: Environment Variables

Add to `.env.example`:
```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

**Important:**
- Use `sk_test_` and `pk_test_` keys during development
- Use `sk_live_` and `pk_live_` in production
- Never expose secret key to frontend

---

### Step 2: Install Dependencies

```bash
npm install axios  # For Paystack API calls (already in project)
```

---

### Step 3: Create Paystack Service

**File:** `server/src/services/paystack.service.js`

```javascript
import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a Paystack transaction
 * @param {Object} params - Transaction parameters
 * @param {string} params.email - Customer email
 * @param {number} params.amount - Amount in kobo (₦100 = 10000)
 * @param {string} params.reference - Unique transaction reference
 * @param {string} params.callbackUrl - URL to redirect after payment
 * @param {Object} params.metadata - Additional data to store
 * @returns {Object} Paystack response with authorization_url
 */
export async function initializeTransaction({ email, amount, reference, callbackUrl, metadata = {} }) {
  try {
    const response = await paystackApi.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100), // Convert to kobo
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
    });

    logger.info({ reference, amount }, 'Paystack transaction initialized');
    return response.data;
  } catch (error) {
    logger.error({ error: error.response?.data }, 'Paystack initialization failed');
    throw error;
  }
}

/**
 * Verify a Paystack transaction
 * @param {string} reference - Transaction reference
 * @returns {Object} Verification result
 */
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

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - X-Paystack-Signature header
 * @returns {boolean} Whether signature is valid
 */
export function verifyWebhookSignature(payload, signature) {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

/**
 * Generate unique reference for wallet funding
 * @param {string} userId - User ID
 * @returns {string} Unique reference
 */
export function generateReference(userId) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `WLF_${userId.slice(0, 8)}_${timestamp}_${random}`;
}
```

---

### Step 4: Create Webhook Handler

**File:** `server/src/webhooks/paystack.webhook.js`

```javascript
import { getDb } from '../utils/db.js';
import { verifyWebhookSignature, verifyTransaction } from '../services/paystack.service.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Handle Paystack webhook events
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
export async function handlePaystackWebhook(req, res, next) {
  try {
    // Get raw body for signature verification
    const rawBody = req.rawBody;
    const signature = req.headers['x-paystack-signature'];

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse event
    const event = req.body;
    const { event: eventType, data } = event;

    logger.info({ eventType, reference: data?.reference }, 'Paystack webhook received');

    // Acknowledge receipt immediately
    res.sendStatus(200);

    // Process based on event type
    if (eventType === 'charge.success') {
      await processSuccessfulPayment(data);
    }
  } catch (error) {
    logger.error({ error }, 'Webhook processing error');
    // Don't throw - we already sent 200
  }
}

/**
 * Process successful payment from webhook
 * @param {Object} data - Paystack transaction data
 */
async function processSuccessfulPayment(data) {
  const { reference, amount, status, paid_at, channel, metadata } = data;

  const db = getDb();

  // Check if already processed (idempotency)
  const existing = await db.prepare(
    'SELECT id FROM wallet_funding_transactions WHERE paystack_reference = ?'
  ).get(reference);

  if (existing) {
    logger.info({ reference }, 'Payment already processed');
    return;
  }

  // Get user ID from metadata
  const userId = metadata?.user_id;
  if (!userId) {
    logger.error({ reference }, 'Missing user_id in metadata');
    return;
  }

  // Convert kobo to naira for database storage
  const amountInNaira = amount / 100;

  await db.transaction(async (tx) => {
    // Insert funding transaction
    await tx.run(
      `INSERT INTO wallet_funding_transactions 
       (user_id, paystack_reference, amount, currency, status, payment_method, gateway_response, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      userId, reference, amountInNaira, 'NGN', 'completed', channel, 'Successful', paid_at
    );

    // Update user balance
    await tx.run(
      'UPDATE users SET balance = balance + ?, updatedAt = ? WHERE id = ?',
      amountInNaira, new Date().toISOString(), userId
    );

    // Record in transactions table
    await tx.run(
      `INSERT INTO transactions (userId, type, amount, status, description, recipient, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      userId, 'wallet_funding', amountInNaira, 'completed',
      `Wallet Funding via ${channel}`, 'Self', paid_at
    );
  });

  logger.info({ reference, userId, amount: amountInNaira }, 'Payment processed successfully');
}
```

---

### Step 5: Create Webhook Routes

**File:** `server/src/routes/webhook.routes.js`

```javascript
import { Router } from 'express';
import express from 'express';
import { handlePaystackWebhook } from '../webhooks/paystack.webhook.js';

const router = Router();

// Paystack webhook endpoint
// Important: Use raw body parser for this route only
router.post(
  '/paystack',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Store raw body for signature verification
    req.rawBody = req.body;
    // Parse JSON for processing
    req.body = JSON.parse(req.body.toString());
    next();
  },
  handlePaystackWebhook
);

export default router;
```

---

### Step 6: Update Wallet Controller

**File:** `server/src/controllers/wallet.controller.js`

Add new initialization function:

```javascript
import { initializeTransaction, generateReference } from '../services/paystack.service.js';

/**
 * Initialize wallet funding with Paystack
 */
export async function handleInitializeFunding(req, res, next) {
  try {
    const { amount, email } = req.body;
    const userId = req.user.id;

    // Validate amount
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount < 100 || numAmount > 500000) {
      return res.status(400).json({ error: 'Amount must be between ₦100 and ₦500,000' });
    }

    // Generate unique reference
    const reference = generateReference(userId);

    // Build callback URL
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const callbackUrl = `${baseUrl}/wallet/fund/verify`;

    // Initialize Paystack transaction
    const result = await initializeTransaction({
      email,
      amount: numAmount,
      reference,
      callbackUrl,
      metadata: {
        user_id: userId,
        purpose: 'wallet_funding',
      },
    });

    // Store pending transaction
    const db = getDb();
    await db.run(
      `INSERT INTO wallet_funding_transactions 
       (user_id, paystack_reference, amount, currency, status)
       VALUES (?, ?, ?, ?, ?)`,
      userId, reference, numAmount, 'NGN', 'pending'
    );

    res.json({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify wallet funding (manual verification fallback)
 */
export async function handleVerifyFunding(req, res, next) {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    const db = getDb();

    // Check if already processed
    const existing = await db.prepare(
      'SELECT id, status FROM wallet_funding_transactions WHERE paystack_reference = ?'
    ).get(reference);

    if (existing && existing.status === 'completed') {
      return res.json({ status: 'completed', message: 'Payment already processed' });
    }

    // Verify with Paystack
    const verification = await verifyTransaction(reference);

    if (verification.data.status === 'success') {
      // Process payment (same as webhook)
      await processSuccessfulPayment(verification.data);
      return res.json({ status: 'completed', message: 'Payment verified successfully' });
    }

    res.json({ status: verification.data.status, message: 'Payment not successful' });
  } catch (error) {
    next(error);
  }
}
```

---

### Step 7: Update Wallet Routes

**File:** `server/src/routes/wallet.routes.js`

```javascript
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateCsrf } from '../middleware/csrf.middleware.js';
import {
  handleFundWallet,
  handleWithdraw,
  handleInitializeFunding,
  handleVerifyFunding,
} from '../controllers/wallet.controller.js';

const router = Router();

const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many wallet operations. Please wait before trying again.' },
});

const initializationLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5, // 5 per minute
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many initialization attempts. Please wait.' },
});

router.use(authenticate);

// New Paystack endpoints
router.post('/fund/initialize', initializationLimiter, validateCsrf, handleInitializeFunding);
router.get('/fund/verify', handleVerifyFunding);

// Legacy endpoints (keep for backward compatibility)
router.post('/fund', walletLimiter, validateCsrf, handleFundWallet);
router.post('/withdraw', walletLimiter, validateCsrf, handleWithdraw);

export default router;
```

---

### Step 8: Register Webhook Route

**File:** `api/index.js` (or `app.js`)

```javascript
import webhookRoutes from './server/src/routes/webhook.routes.js';

// Register webhook routes BEFORE body parsing middleware
app.use('/api/webhook', webhookRoutes);
```

---

### Step 9: Database Migration

**File:** `server/src/migrations/003_wallet_funding.sql`

```sql
-- Create wallet_funding_transactions table
CREATE TABLE IF NOT EXISTS wallet_funding_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Paystack fields
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  paystack_access_code VARCHAR(255),
  paystack_transaction_id BIGINT,
  
  -- Transaction details
  amount DECIMAL(12, 2) NOT NULL,  -- Amount in naira
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Metadata
  payment_method VARCHAR(50),
  gateway_response TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'))
);

-- Indexes for performance
CREATE INDEX idx_wallet_funding_reference ON wallet_funding_transactions(paystack_reference);
CREATE INDEX idx_wallet_funding_user_id ON wallet_funding_transactions(user_id);
CREATE INDEX idx_wallet_funding_status ON wallet_funding_transactions(status);
CREATE INDEX idx_wallet_funding_created_at ON wallet_funding_transactions(created_at);

-- Add comment
COMMENT ON TABLE wallet_funding_transactions IS 'Tracks wallet funding transactions via Paystack';
```

---

### Step 10: Update Frontend

**File:** `src/components/modals/FundWalletModal.tsx`

Key changes:
1. Replace direct `fundWallet` call with initialization
2. Redirect to Paystack checkout
3. Handle callback verification

```typescript
// Add new API function to src/api/client.ts
export async function initializeWalletFunding(amount: number, email: string) {
  const csrf = getCsrfToken();
  const { data } = await walletApi.post(
    '/wallet/fund/initialize',
    { amount, email },
    { headers: { 'x-csrf-token': csrf } }
  );
  return data;
}

export async function verifyWalletFunding(reference: string) {
  const { data } = await walletApi.get('/wallet/fund/verify', {
    params: { reference },
  });
  return data;
}
```

Update `FundWalletModal.tsx`:
```typescript
const handlePayment = async () => {
  setStep(3); // Show processing state
  
  try {
    const result = await initializeWalletFunding(Number(amount), user.email);
    
    // Redirect to Paystack checkout
    window.location.href = result.authorization_url;
  } catch (error) {
    setErrors({ payment: 'Failed to initialize payment. Please try again.' });
    setStep(1);
  }
};
```

Create verification callback page:
**File:** `src/components/wallet/FundCallback.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyWalletFunding } from '../../api/client';

export default function FundCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const reference = searchParams.get('reference');
    
    if (!reference) {
      setStatus('error');
      return;
    }

    verifyWalletFunding(reference)
      .then((result) => {
        setStatus(result.status === 'completed' ? 'success' : 'error');
        setTimeout(() => navigate('/wallet'), 3000);
      })
      .catch(() => {
        setStatus('error');
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {status === 'loading' && (
        <>
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
          <p>Verifying your payment...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
          <p>Your wallet has been funded. Redirecting...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Failed</h2>
          <p>Please try again or contact support.</p>
        </>
      )}
    </div>
  );
}
```

---

## Testing

### Paystack Test Cards
- **Success:** `4084084084084081`
- **Failure:** `4084084084084082`
- **Insufficient Funds:** `4084084084084083`

### Testing Checklist
1. Initialize funding with test amount
2. Complete payment with test card
3. Verify webhook received and processed
4. Verify wallet balance updated
5. Verify transaction recorded in database
6. Test idempotency (duplicate webhook)
7. Test verification fallback
8. Test error handling

---

## Security Checklist

- [ ] Secret key stored in environment variables only
- [ ] Webhook signature verification implemented
- [ ] Raw body parsing for webhook endpoint
- [ ] Amount verification on all payment confirmations
- [ ] Idempotency checks for webhook processing
- [ ] Database transactions for wallet updates
- [ ] Rate limiting on payment endpoints
- [ ] Audit logging for all transactions
- [ ] HTTPS enforced for all endpoints

---

## Deployment Notes

1. **Vercel Configuration:**
   - Ensure webhook endpoint has raw body access
   - Configure Paystack webhook URL in dashboard

2. **Environment Variables:**
   - Set `PAYSTACK_SECRET_KEY` in Vercel
   - Set `PAYSTACK_WEBHOOK_SECRET` in Vercel
   - Set `APP_URL` to your production domain

3. **Paystack Dashboard:**
   - Configure webhook URL: `https://yourapp.com/api/webhook/paystack`
   - Set callback URL in integration settings

---

## Next Steps

1. Run database migration
2. Set up Paystack account and get API keys
3. Configure environment variables
4. Test with Paystack test mode
5. Go live with production keys
