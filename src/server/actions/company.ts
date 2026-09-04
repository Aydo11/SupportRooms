"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { storage, validateUpload, verifyFileContents } from "@/lib/storage";
import { notify } from "@/lib/notify";
import { fieldErrors, companySchema, type FormState } from "@/lib/validation";
import { bool, list, text } from "../form";

export async function updateCompanyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, companyId } = await requireCompany();

  const parsed = companySchema.safeParse({
    name: text(formData, "name"),
    tradingName: text(formData, "tradingName"),
    registrationNumber: text(formData, "registrationNumber"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    website: text(formData, "website"),
    addressLine1: text(formData, "addressLine1"),
    addressLine2: text(formData, "addressLine2"),
    city: text(formData, "city"),
    postcode: text(formData, "postcode"),
    orgType: text(formData, "orgType") || "SUPPORTED_ACCOMMODATION_PROVIDER",
    about: text(formData, "about"),
    operatingAreas: text(formData, "operatingAreas")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    supportTypes: list(formData, "supportTypes"),
  });

  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const invalid = validateUpload(logo, "image");
    if (invalid) return { ok: false, errors: { logo: invalid } };
    const mismatch = await verifyFileContents(logo, Buffer.from(await logo.arrayBuffer()));
    if (mismatch) return { ok: false, errors: { logo: mismatch } };
    const stored = await storage.put(logo, `companies/${companyId}`);
    logoUrl = stored.url;
  }

  await db.company.update({
    where: { id: companyId },
    data: {
      name: d.name,
      tradingName: d.tradingName || null,
      registrationNumber: d.registrationNumber || null,
      email: d.email,
      phone: d.phone || null,
      website: d.website || null,
      addressLine1: d.addressLine1 || null,
      addressLine2: d.addressLine2 || null,
      city: d.city || null,
      postcode: d.postcode || null,
      orgType: d.orgType,
      about: d.about || null,
      operatingAreas: d.operatingAreas,
      supportTypes: d.supportTypes,
      ...(logoUrl ? { logoUrl } : {}),
    },
  });

  await audit({ actorId: user.id, action: "company.updated", targetType: "Company", targetId: companyId });
  revalidatePath("/provider/settings");
  return { ok: true, message: "Company profile saved." };
}

/**
 * Verification is a manual, human check of the documents a provider supplies.
 * It says nothing about regulatory registration, and the badge copy says so.
 */
export async function requestVerificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, companyId } = await requireCompany();

  const files = formData.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, errors: { documents: "Attach at least one document." } };

  const request = await db.verificationRequest.create({
    data: {
      companyId,
      type: "COMPANY",
      status: "PENDING",
      submittedBy: user.id,
      note: text(formData, "note") || null,
    },
  });

  for (const file of files) {
    const invalid = validateUpload(file, "document");
    if (invalid) return { ok: false, errors: { documents: invalid } };
    const mismatch = await verifyFileContents(file, Buffer.from(await file.arrayBuffer()));
    if (mismatch) return { ok: false, errors: { documents: mismatch } };
    const stored = await storage.put(file, `verification/${companyId}`, "private");
    await db.document.create({
      data: {
        companyId,
        verificationRequestId: request.id,
        name: file.name,
        url: stored.url,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        isPrivate: true,
      },
    });
  }

  await db.company.update({ where: { id: companyId }, data: { verification: "PENDING" } });
  await audit({
    actorId: user.id,
    action: "verification.requested",
    targetType: "Company",
    targetId: companyId,
  });

  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        type: "SYSTEM",
        title: "Verification request submitted",
        body: "A provider has sent documents for manual verification.",
        href: "/admin/verification",
      }),
    ),
  );

  revalidatePath("/provider/settings");
  return { ok: true, message: "Sent. Our team will review your documents and be in touch." };
}
