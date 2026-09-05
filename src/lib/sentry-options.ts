import type { ErrorEvent } from "@sentry/nextjs";

// Errors only: no replay, tracing, user identity, request bodies or breadcrumbs.
export function sanitiseError(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.request;
  delete event.breadcrumbs;
  delete event.extra;
  delete event.contexts;
  delete event.message;
  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      // Database/validation exception messages can contain submitted personal data.
      exception.value = "Application error (message redacted)";
      for (const frame of exception.stacktrace?.frames ?? []) {
        delete frame.vars;
        if (frame.filename) frame.filename = frame.filename.split(/[?#]/)[0];
      }
    }
  }
  return event;
}

export const privateErrorOptions = {
  sendDefaultPii: false,
  tracesSampleRate: 0,
  maxBreadcrumbs: 0,
  beforeSend: sanitiseError,
};
