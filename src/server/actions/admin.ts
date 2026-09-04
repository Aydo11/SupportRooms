"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { notify, notifyCompany } from "@/lib/notify";
import type { ReportStatus } from "@prisma/client";

export async function approveListingAction(listingId: string) {
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
  await db.report.update({ where: { id: reportId }, data: { status, resolution: resolution ?? null } });
  await audit({ actorId: admin.id, action: "admin.report_resolved", targetType: "Report", targetId: reportId, metadata: { status } });
  revalidatePath("/admin/reports");
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
