"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Next.js only renders this if something throws above the normal error
// boundaries (src/app doesn't have a per-route error.tsx yet) — so this
// replaces the entire <html>, and needs to be self-contained.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#152A3A",
          color: "#F5F3EE",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Something's gone wrong</h1>
          <p style={{ opacity: 0.8, marginBottom: "20px" }}>
            The error has been reported to the team. Try again, or come back in a few minutes.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#F5F3EE",
              color: "#152A3A",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
