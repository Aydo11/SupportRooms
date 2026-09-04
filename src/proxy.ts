import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-level checks that shouldn't wait for a page to render.
 *
 * Authorisation is *not* done here — it lives in `src/lib/rbac.ts`, next to the
 * data, because a matcher is too easy to bypass with a route it doesn't cover.
 * This only handles cheap, global concerns.
 */
export function proxy(request: NextRequest) {
  // Anything under /uploads is public by design. Private files live outside the
  // web root and are only served by /api/documents, but this is a second lock:
  // if a private path ever leaks into the public tree, it still won't be served.
  if (request.nextUrl.pathname.startsWith("/uploads/")) {
    const path = request.nextUrl.pathname;
    if (path.includes("/referrals/") || path.includes("/verification/") || path.includes("..")) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const response = NextResponse.next();

  // Give every request an id so an audit entry can be tied to a log line.
  response.headers.set("x-request-id", crypto.randomUUID());
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
