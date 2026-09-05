import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Plain-text-ish JSON health check. Point your host's readiness probe (Fly,
 * Render, ECS, k8s) at this rather than `/`, which renders a full page and
 * hits the database for homepage stats — this only checks the one thing that
 * actually determines whether the app can serve traffic.
 */
export async function GET() {
  const database = await checkDatabaseConnection();

  const body = {
    ok: database.ok,
    database: database.ok ? "connected" : database.error,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: database.ok ? 200 : 503 });
}
