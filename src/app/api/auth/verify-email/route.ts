import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token || token.length > 256) return redirectResult(request, "invalid");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return redirectResult(request, "expired");

  const verifiedAt = new Date();
  const claimed = await db.$transaction(async (transaction) => {
    const consumed = await transaction.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: verifiedAt } },
      data: { usedAt: verifiedAt },
    });
    if (!consumed.count) return false;
    await transaction.user.update({ where: { id: record.userId }, data: { emailVerified: verifiedAt } });
    await transaction.emailVerificationToken.deleteMany({ where: { userId: record.userId, usedAt: null } });
    return true;
  });
  if (!claimed) return redirectResult(request, "expired");
  await audit({ actorId: record.userId, action: "auth.email_verified", targetType: "User", targetId: record.userId });
  return redirectResult(request, "success");
}

function redirectResult(request: NextRequest, result: string) {
  // Render sits behind a proxy, so request.url reflects the internal
  // container address (localhost) rather than the public domain. Build the
  // redirect from APP_URL, falling back to request.url only when APP_URL
  // genuinely isn't configured.
  const base = process.env.APP_URL || request.url;
  return NextResponse.redirect(new URL(`/verify-email?result=${result}`, base));
}
