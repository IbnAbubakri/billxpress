type EventName =
  | 'registration_started'
  | 'registration_step_completed'
  | 'registration_completed'
  | 'email_verified'
  | 'profile_step_completed';

export function trackEvent(name: EventName, data?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.debug(`[Analytics] ${name}`, data);
  }
  try {
    // Swap with real analytics provider here
    // e.g. window.gtag?.('event', name, data);
  } catch { /* noop */ }
}
