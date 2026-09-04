import "server-only";
import { db } from "./db";

/**
 * Append-only record of anything that touches personal data or moderation.
 * Never delete rows from this table — retention is handled by a scheduled job.
 */
export async function audit(params: {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: (params.metadata ?? {}) as object,
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write", params.action, error);
  }
}
