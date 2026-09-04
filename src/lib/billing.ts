import "server-only";
import { db } from "./db";
import type { MembershipTier } from "@prisma/client";

/**
 * Billing adapter. No Stripe types leak into the application: routes and
 * dashboards call `billing.startCheckout()` and the webhook handler calls
 * `applySubscriptionChange()`. Swap the driver, keep the app.
 *
 * Env: BILLING_DRIVER=mock|stripe, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 *      STRIPE_PRICE_PROFESSIONAL, STRIPE_PRICE_BUSINESS, STRIPE_PRICE_FEATURED_LISTING
 */
export type CheckoutRequest = {
  companyId: string;
  tier: MembershipTier;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSession = { url: string; externalId: string | null; provider: string };

interface BillingDriver {
  readonly name: string;
  startCheckout(req: CheckoutRequest): Promise<CheckoutSession>;
  cancel(companyId: string, atPeriodEnd: boolean): Promise<void>;
  billingPortalUrl(companyId: string): Promise<string | null>;
}

/** Development driver: moves the subscription immediately, records a paid payment. */
const mockDriver: BillingDriver = {
  name: "mock",
  async startCheckout({ companyId, tier, successUrl }) {
    await applySubscriptionChange({ companyId, tier, provider: "mock", status: "ACTIVE" });
    return { url: `${successUrl}?billing=mock-complete`, externalId: null, provider: "mock" };
  },
  async cancel(companyId, atPeriodEnd) {
    await db.subscription.update({
      where: { companyId },
      data: atPeriodEnd ? { cancelAtPeriodEnd: true } : { status: "CANCELLED", cancelAtPeriodEnd: true },
    });
  },
  async billingPortalUrl() {
    return null;
  },
};

const stripeDriver: BillingDriver = {
  name: "stripe",
  async startCheckout() {
    // 1. npm i stripe
    // 2. const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // 3. create/reuse a customer on Company.subscription.externalCustomerId
    // 4. stripe.checkout.sessions.create({ mode: "subscription", line_items: [{ price: priceIdFor(tier) }] })
    // 5. return { url: session.url, externalId: session.id, provider: "stripe" }
    // The webhook at /api/billing/webhook then calls applySubscriptionChange().
    throw new Error("Stripe driver not wired up yet. Set BILLING_DRIVER=mock or implement src/lib/billing.ts.");
  },
  async cancel() {
    throw new Error("Stripe driver not wired up yet.");
  },
  async billingPortalUrl() {
    return null;
  },
};

export const billing: BillingDriver =
  process.env.BILLING_DRIVER === "stripe" ? stripeDriver : mockDriver;

export function priceIdFor(tier: MembershipTier) {
  return {
    FREE: null,
    PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL ?? null,
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS ?? null,
  }[tier];
}

/** Single place where a subscription state change is written. Webhooks call this. */
export async function applySubscriptionChange(params: {
  companyId: string;
  tier: MembershipTier;
  provider: string;
  status?: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "INCOMPLETE";
  externalCustomerId?: string;
  externalSubscriptionId?: string;
  periodEnd?: Date;
}) {
  const membership = await db.membership.findUnique({ where: { tier: params.tier } });
  if (!membership) throw new Error(`Unknown membership tier ${params.tier}`);

  const periodEnd = params.periodEnd ?? new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const data = {
    membershipId: membership.id,
    status: params.status ?? "ACTIVE",
    billingProvider: params.provider,
    externalCustomerId: params.externalCustomerId,
    externalSubscriptionId: params.externalSubscriptionId,
    currentPeriodStart: new Date(),
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  };

  const subscription = await db.subscription.upsert({
    where: { companyId: params.companyId },
    create: { companyId: params.companyId, ...data },
    update: data,
  });

  if (membership.priceMonthly > 0) {
    await db.payment.create({
      data: {
        companyId: params.companyId,
        subscriptionId: subscription.id,
        kind: "SUBSCRIPTION",
        amount: membership.priceMonthly,
        status: "PAID",
        description: `${membership.name} membership`,
      },
    });
  }

  return subscription;
}

/** Plan limits, enforced before a company can publish another advert. */
export async function planLimits(companyId: string) {
  const subscription = await db.subscription.findUnique({
    where: { companyId },
    include: { membership: true },
  });
  const membership =
    subscription?.membership ?? (await db.membership.findUnique({ where: { tier: "FREE" } }));
  if (!membership) throw new Error("Membership catalogue is empty. Run npm run db:seed.");

  const [listings, rooms, staff] = await Promise.all([
    db.listing.count({ where: { companyId, status: { in: ["ACTIVE", "PENDING_REVIEW", "PAUSED"] } } }),
    db.room.count({ where: { property: { companyId } } }),
    db.companyStaff.count({ where: { companyId } }),
  ]);

  const under = (used: number, max: number) => max === -1 || used < max;

  return {
    membership,
    subscription,
    used: { listings, rooms, staff },
    canAddListing: under(listings, membership.maxListings),
    canAddRoom: under(rooms, membership.maxRooms),
    canAddStaff: under(staff, membership.maxStaff),
  };
}
