"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify, notifyCompany } from "@/lib/notify";
import type { ReportStatus } from "@prisma/client";
import { z } from "zod";

export async function approveListingAction(listingId: string) {
  const admin = await requireAdmin("MODERATION");
  const listing = await db.listing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", publishedAt: new Date(), rejectionNote: null },
  });
  await notifyCompany(listing.companyId, {
    type: "LISTING",
    title: "Advert approved",
    body: `“${listing.title}” is now live and searchable.`,
    href: `/listings/${listing.id}`,
    email: true,
  });
  await audit({ actorId: admin.id, action: "admin.listing_approved", targetType: "Listing", targetId: listingId });
  revalidatePath("/admin/listings");
}

export async function rejectListingAction(listingId: string, note: string) {
  const admin = await requireAdmin("MODERATION");
  const listing = await db.listing.update({
    where: { id: listingId },
    data: { status: "REJECTED", rejectionNote: note },
  });
  await notifyCompany(listing.companyId, {
    type: "LISTING",
    title: "Advert needs changes",
    body: note,
    href: `/provider/adverts/${listing.id}`,
    email: true,
  });
  await audit({
    actorId: admin.id,
    action: "admin.listing_rejected",
    targetType: "Listing",
    targetId: listingId,
    metadata: { note },
  });
  revalidatePath("/admin/listings");
}

export async function reviewVerificationAction(requestId: string, approve: boolean, note?: string) {
  const admin = await requireAdmin();
  const request = await db.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      note: note ?? null,
    },
  });

  if (request.type === "COMPANY") {
    await db.company.update({
      where: { id: request.companyId },
      data: {
        verification: approve ? "APPROVED" : "REJECTED",
        verifiedAt: approve ? new Date() : null,
      },
    });
  } else if (request.propertyId) {
    await db.property.update({
      where: { id: request.propertyId },
      data: { verification: approve ? "APPROVED" : "REJECTED" },
    });
  }

  await notifyCompany(request.companyId, {
    type: "VERIFICATION",
    title: approve ? "Verification approved" : "Verification not approved",
    body: note ?? (approve ? "Your verified badge is now showing on your profile." : "See the note from our team."),
    href: "/provider/settings",
    email: true,
  });
  await audit({
    actorId: admin.id,
    action: approve ? "admin.verification_approved" : "admin.verification_rejected",
    targetType: "VerificationRequest",
    targetId: requestId,
  });
  revalidatePath("/admin/verification");
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const admin = await requireAdmin();
  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  // Admin access is managed on the team page, with reauthentication and self-lockout protection.
  if (!target || target.role === "ADMIN") return;
  await db.user.update({
    where: { id: userId },
    // Suspending also invalidates every existing session, so a suspended user is
    // signed out immediately rather than when their token happens to expire.
    data: { status, ...(status === "SUSPENDED" ? { tokenVersion: { increment: 1 } } : {}) },
  });
  if (status === "ACTIVE") {
    await notify({ userId, type: "SYSTEM", title: "Your account has been reinstated" });
  }
  await audit({
    actorId: admin.id,
    action: status === "SUSPENDED" ? "admin.user_suspended" : "admin.user_reinstated",
    targetType: "User",
    targetId: userId,
  });
  revalidatePath("/admin/users");
}

export async function setCompanyStatusAction(companyId: string, status: "ACTIVE" | "SUSPENDED") {
  const admin = await requireAdmin();
  await db.$transaction([
    db.company.update({ where: { id: companyId }, data: { status } }),
    // Suspending a company takes its adverts out of search immediately.
    db.listing.updateMany({
      where: { companyId, status: "ACTIVE" },
      data: { status: status === "SUSPENDED" ? "PAUSED" : "ACTIVE" },
    }),
  ]);
  await audit({ actorId: admin.id, action: `admin.company_${status.toLowerCase()}`, targetType: "Company", targetId: companyId });
  revalidatePath("/admin/companies");
}

export async function resolveReportAction(reportId: string, status: ReportStatus, resolution?: string) {
  const admin = await requireAdmin("MODERATION");
  const id = z.string().cuid().parse(reportId);
  const nextStatus = z.enum(["OPEN", "REVIEWING", "ACTIONED", "DISMISSED"]).parse(status);
  const note = resolution?.trim().slice(0, 4000) || null;
  await db.$transaction([
    db.report.update({ where: { id }, data: { status: nextStatus, resolution: note } }),
    db.reportEvent.create({ data: { reportId: id, actorId: admin.id, status: nextStatus, note } }),
  ]);
  await audit({ actorId: admin.id, action: "admin.report_updated", targetType: "Report", targetId: id, metadata: { status: nextStatus } });
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${id}`);
}

export async function archiveReportAction(reportId: string, archived: boolean) {
  const admin = await requireAdmin("MODERATION");
  const id = z.string().cuid().parse(reportId);
  const report = await db.report.findUnique({ where: { id }, select: { status: true } });
  if (!report) return;
  await db.$transaction([
    db.report.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } }),
    db.reportEvent.create({ data: { reportId: id, actorId: admin.id, status: report.status, note: archived ? "Archived case" : "Restored case to active reports" } }),
  ]);
  await audit({ actorId: admin.id, action: archived ? "admin.report_archived" : "admin.report_restored", targetType: "Report", targetId: id });
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${id}`);
}

export async function toggleFeaturedAction(listingId: string, featured: boolean) {
  const admin = await requireAdmin();
  await db.listing.update({
    where: { id: listingId },
    data: { featured, featuredUntil: featured ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null },
  });
  await audit({ actorId: admin.id, action: "admin.listing_featured", targetType: "Listing", targetId: listingId, metadata: { featured } });
  revalidatePath("/admin/listings");
}

export async function upsertSupportTypeAction(slug: string, label: string) {
  const admin = await requireAdmin();
  await db.supportType.upsert({ where: { slug }, create: { slug, label }, update: { label } });
  await audit({ actorId: admin.id, action: "admin.support_type_saved", targetType: "SupportType", targetId: slug });
  revalidatePath("/admin/categories");
}
