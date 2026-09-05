import * as Sentry from "@sentry/nextjs";
import { privateErrorOptions } from "./lib/sentry-options";

export function register() {
  Sentry.init({
    ...privateErrorOptions,
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  });
}

export const onRequestError = Sentry.captureRequestError;
