import * as Sentry from "@sentry/nextjs";

// Same config as sentry.server.config.ts — this one initialises Sentry for
// code that runs on the edge runtime instead of Node.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
