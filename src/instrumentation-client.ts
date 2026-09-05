import * as Sentry from "@sentry/nextjs";
import { privateErrorOptions } from "./lib/sentry-options";

Sentry.init({
  ...privateErrorOptions,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
