import * as Sentry from "@sentry/nextjs";
<<<<<<< HEAD
import { privateErrorOptions } from "./lib/sentry-options";

export function register() {
  Sentry.init({
    ...privateErrorOptions,
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  });
}

=======

// Registers Sentry for whichever runtime this deployment is actually using —
// Node for the server, edge for anything running on the edge runtime (see
// NEXT_RUNTIME). Both configs no-op if NEXT_PUBLIC_SENTRY_DSN isn't set.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Reports errors thrown while rendering, in route handlers, and in server
// actions — this is what actually gets an error from the server to Sentry.
>>>>>>> ced82d263f2d2ad75e5a413d2e030103c7128483
export const onRequestError = Sentry.captureRequestError;
