import { init, browserTracingIntegration } from '@sentry/react';

if (import.meta.env.MODE === 'production' && import.meta.env.VITE_SENTRY_DSN) {
  init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    integrations: [browserTracingIntegration()],
    environment: import.meta.env.MODE,
  });
}
