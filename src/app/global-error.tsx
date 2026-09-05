"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return <html lang="en"><body style={{ fontFamily: "system-ui", padding: "3rem", background: "#f5f7f4", color: "#152a3a" }}>
    <main style={{ maxWidth: "32rem", margin: "10vh auto" }}>
      <h1>Something didn’t load</h1><p>Please try again. Your saved information has not been removed.</p>
      <button onClick={reset} style={{ padding: "12px 20px", cursor: "pointer" }}>Try again</button>
      <p><a href="/">Return to SupportRooms</a></p>
    </main>
  </body></html>;
}
