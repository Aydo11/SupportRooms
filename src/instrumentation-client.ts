import * as Sentry from "@sentry/nextjs";
<<<<<<< HEAD
import { privateErrorOptions } from "./lib/sentry-options";

Sentry.init({
  ...privateErrorOptions,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
=======

// Catches errors that happen in the browser — React rendering errors,
// unhandled promise rejections, and anything captureException is called on
// explicitly. Does nothing until NEXT_PUBLIC_SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
>>>>>>> ced82d263f2d2ad75e5a413d2e030103c7128483
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
