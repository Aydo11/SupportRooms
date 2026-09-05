import * as Sentry from "@sentry/nextjs";

// No DSN in this environment (e.g. local dev) means this quietly does nothing —
// no console noise, no network calls, nothing to configure to turn it off.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
