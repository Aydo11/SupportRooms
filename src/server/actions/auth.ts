"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { callerIp, LIMITS, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, passwordChangeSchema, registerSchema, type FormState } from "@/lib/validation";
import { bool, slugify, text } from "../form";

/**
 * A real bcrypt hash of a value nobody knows, compared against when the email
 * doesn't exist so that failed logins take the same time either way.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO3Q6q1Bnp9YAqvB7WkQ0Pu2N0hEbXHQu";

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const throttle = await rateLimit(`register:${await callerIp()}`, LIMITS.register);
  if (!throttle.ok) {
    return { ok: false, errors: { form: "Too many accounts created from here. Try again later." } };
  }

  const parsed = registerSchema.safeParse({
    accountType: text(formData, "accountType"),
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    password: text(formData, "password"),
    locationLabel: text(formData, "locationLabel"),
    contactMethod: text(formData, "contactMethod") || "MESSAGE",
    ageRange: text(formData, "ageRange"),
    companyName: text(formData, "companyName"),
    orgType: text(formData, "orgType") || undefined,
    companyCity: text(formData, "companyCity"),
    organisation: text(formData, "organisation"),
    jobTitle: text(formData, "jobTitle"),
    terms: bool(formData, "terms") ? "on" : "",
  });

  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  if (data.accountType === "PROVIDER" && !data.companyName) {
    return { ok: false, errors: { companyName: "Enter your organisation's name." } };
  }

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { ok: false, errors: { email: "An account already uses that email address." } };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await db.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: data.accountType,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      locationLabel: data.locationLabel || null,
      contactMethod: data.contactMethod,
      profile:
        data.accountType === "USER"
          ? { create: { preferredLocations: data.locationLabel ? [data.locationLabel] : [] } }
          : undefined,
    },
  });

  let destination = "/dashboard";

  if (data.accountType === "PROVIDER" && data.companyName) {
    const free = await db.membership.findUnique({ where: { tier: "FREE" } });
    let slug = slugify(data.companyName);
    if (await db.company.findUnique({ where: { slug } })) slug = `${slug}-${user.id.slice(-4)}`;

    const company = await db.company.create({
      data: {
        name: data.companyName,
        slug,
        email: data.email,
        phone: data.phone || null,
        city: data.companyCity || null,
        orgType: data.orgType ?? "SUPPORTED_ACCOMMODATION_PROVIDER",
        staff: { create: { userId: user.id, staffRole: "OWNER" } },
        subscription: free ? { create: { membershipId: free.id } } : undefined,
      },
    });
    destination = "/provider";
    await audit({ actorId: user.id, action: "company.created", targetType: "Company", targetId: company.id });
  }

  if (data.accountType === "REFERRER") destination = "/referrals";

  await createSession(user.id, user.role, user.tokenVersion);
  await audit({ actorId: user.id, action: "user.registered", targetType: "User", targetId: user.id });
  await notify({
    userId: user.id,
    type: "SYSTEM",
    title: "Welcome aboard",
    body:
      data.accountType === "PROVIDER"
        ? "Add your first advert to start receiving enquiries."
        : "Tell providers what you're looking for — it takes about two minutes.",
    href: destination,
  });

  redirect(destination);
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await callerIp();

  // Two buckets: one per source address, one per account. The first stops a
  // scattergun attack, the second stops a slow grind against one inbox.
  const byIp = await rateLimit(`login:ip:${ip}`, LIMITS.login);
  if (!byIp.ok) {
    return {
      ok: false,
      errors: { form: `Too many sign-in attempts. Try again in ${Math.ceil(byIp.retryAfterSeconds / 60)} minutes.` },
    };
  }

  const parsed = loginSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const byAccount = await rateLimit(`login:acct:${parsed.data.email}`, LIMITS.loginPerAccount);
  if (!byAccount.ok) {
    return {
      ok: false,
      errors: { form: "Too many sign-in attempts for that account. Try again shortly." },
    };
  }

  const next = text(formData, "next");
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Same message either way — don't confirm whether an email is registered.
  const generic = { ok: false, errors: { form: "Those details don't match an account." } } as FormState;

  // Always spend roughly the same time, so response timing doesn't reveal
  // whether the address exists.
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(parsed.data.password, hash);

  if (!user || user.deletedAt || !passwordMatches) {
    if (user) {
      await audit({
        actorId: user.id,
        action: "auth.failed_login",
        targetType: "User",
        targetId: user.id,
        metadata: { ip },
      });
    }
    return generic;
  }

  if (user.status === "SUSPENDED") {
    return { ok: false, errors: { form: "This account is suspended. Contact support." } };
  }

  await resetRateLimit(`login:acct:${parsed.data.email}`);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id, user.role, user.tokenVersion);
  await audit({ actorId: user.id, action: "auth.login", targetType: "User", targetId: user.id, metadata: { ip } });

  const home =
    user.role === "ADMIN" ? "/admin" : user.role === "PROVIDER" ? "/provider" : user.role === "REFERRER" ? "/referrals" : "/dashboard";

  redirect(safeRedirect(next, home));
}

/**
 * Only ever redirect within this site. "//evil.example" and "/\\evil.example"
 * are browser-legal ways of leaving the origin, so a leading-slash check on its
 * own is not enough.
 */
function safeRedirect(target: string | undefined, fallback: string) {
  if (!target) return fallback;
  if (!target.startsWith("/")) return fallback;
  if (target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) await audit({ actorId: user.id, action: "auth.logout" });
  await destroySession();
  redirect("/");
}

/** Signs out every device by invalidating tokens issued before now. */
export async function logoutEverywhereAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await db.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });
  await audit({ actorId: user.id, action: "auth.logout_all", targetType: "User", targetId: user.id });
  await destroySession();
  redirect("/login");
}

/**
 * Password change. Requires the current password, and invalidates every existing
 * session including this one — the standard behaviour after a suspected
 * compromise.
 */
export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const throttle = await rateLimit(`password:${user.id}`, LIMITS.passwordChange);
  if (!throttle.ok) return { ok: false, errors: { form: "Too many attempts. Try again later." } };

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: text(formData, "currentPassword"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const record = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!(await bcrypt.compare(parsed.data.currentPassword, record.passwordHash))) {
    await audit({ actorId: user.id, action: "auth.password_change_failed", targetType: "User", targetId: user.id });
    return { ok: false, errors: { currentPassword: "That isn't your current password." } };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      passwordChangedAt: new Date(),
      tokenVersion: { increment: 1 },
    },
  });

  await audit({ actorId: user.id, action: "auth.password_changed", targetType: "User", targetId: user.id });
  await notify({
    userId: user.id,
    type: "SYSTEM",
    title: "Your password was changed",
    body: "If this wasn't you, contact us immediately.",
    email: true,
  });

  await destroySession();
  redirect("/login?changed=1");
}
