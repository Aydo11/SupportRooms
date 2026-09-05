import * as Sentry from "@sentry/nextjs";

// Catches errors that happen in the browser — React rendering errors,
// unhandled promise rejections, and anything captureException is called on
// explicitly. Does nothing until NEXT_PUBLIC_SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
