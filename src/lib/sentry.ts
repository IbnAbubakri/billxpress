// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { init, browserTracingIntegration } from '@sentry/react';

if (import.meta.env.MODE === 'production' && import.meta.env.VITE_SENTRY_DSN) {
  init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    integrations: [browserTracingIntegration()],
    environment: import.meta.env.MODE,
  });
}
