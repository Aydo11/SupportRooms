import { PrismaClient } from "@prisma/client";

/**
 * A single Prisma Client per process. In dev, Next's hot reload would
 * otherwise create a fresh client (and a fresh connection pool) on every
 * file save, and Postgres' connection limit gets eaten alive within a few
 * minutes of editing — hence stashing it on `globalThis` outside production.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSlowQueryMs?: number;
};

// Anything slower than this gets logged with its query, in development only —
// the cheapest way to notice a missing index before it's a production problem.
const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS ?? 200);

function createClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "warn", emit: "stdout" },
            { level: "error", emit: "stdout" },
            { level: "query", emit: "event" },
          ]
        : [{ level: "error", emit: "stdout" }],
  });

  if (process.env.NODE_ENV === "development") {
    client.$on("query", (event: { query: string; params: string; duration: number }) => {
      if (event.duration >= SLOW_QUERY_MS) {
        console.warn(`[prisma] slow query (${event.duration}ms): ${event.query} -- ${event.params}`);
      }
    });
  }

  return client;
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Called by the health check route, and worth calling from any deployment
 * platform's readiness probe. Fails fast rather than letting a request hang
 * on a dead connection.
 */
export async function checkDatabaseConnection(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown database error" };
  }
}

/**
 * Closes the pool on process shutdown. Not strictly required — Prisma cleans
 * up on exit anyway — but it means a container orchestrator's SIGTERM finds
 * connections already released instead of racing the shutdown grace period.
 */
if (process.env.NODE_ENV === "production") {
  const disconnect = () => {
    void db.$disconnect();
  };
  process.once("SIGTERM", disconnect);
  process.once("SIGINT", disconnect);
}
