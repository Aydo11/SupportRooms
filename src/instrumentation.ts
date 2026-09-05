import * as Sentry from "@sentry/nextjs";

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
export const onRequestError = Sentry.captureRequestError;
