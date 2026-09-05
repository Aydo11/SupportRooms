import "server-only";
import Stripe from "stripe";
import { db } from "./db";
import { SPONSOR_PACKAGES, type SponsorPackage } from "./sponsor-packages";
import type { MembershipTier, SubscriptionStatus } from "@prisma/client";

export type CheckoutRequest = {
  companyId: string;
  tier: MembershipTier;
  successUrl: string;
  cancelUrl: string;
};
export type SponsorCheckoutRequest = {
  companyId: string;
  listingId: string;
  pkg: SponsorPackage;
  successUrl: string;
  cancelUrl: string;
};
export type CheckoutSession = { url: string; externalId: string | null; provider: string };

interface BillingDriver {
  readonly name: string;
  startCheckout(req: CheckoutRequest): Promise<CheckoutSession>;
  startSponsorCheckout(req: SponsorCheckoutRequest): Promise<CheckoutSession>;
  cancel(companyId: string, atPeriodEnd: boolean): Promise<void>;
  billingPortalUrl(companyId: string, returnUrl: string): Promise<string | null>;
}

const mockDriver: BillingDriver = {
  name: "mock",
  async startCheckout({ companyId, tier, successUrl }) {
    await applySubscriptionChange({ companyId, tier, provider: "mock", status: "ACTIVE" });
    return { url: `${successUrl}?billing=complete`, externalId: null, provider: "mock" };
  },
  async startSponsorCheckout({ companyId, listingId, pkg, successUrl }) {
    await activateSponsorship({ companyId, listingId, pkg, provider: "mock", externalPaymentId: `mock-${Date.now()}` });
    return { url: `${successUrl}?sponsored=complete`, externalId: null, provider: "mock" };
  },
  async cancel(companyId, atPeriodEnd) {
    await db.subscription.update({ where: { companyId }, data: atPeriodEnd ? { cancelAtPeriodEnd: true } : { status: "CANCELLED", cancelAtPeriodEnd: true } });
  },
  async billingPortalUrl() { return null; },
};

const disabledDriver: BillingDriver = {
  name: "disabled",
  async startCheckout() { throw new Error("Payments are not configured yet."); },
  async startSponsorCheckout() { throw new Error("Payments are not configured yet."); },
  async cancel() { throw new Error("Payments are not configured yet."); },
  async billingPortalUrl() { return null; },
};

let stripeClient: Stripe | null = null;
export function stripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is missing.");
  stripeClient ??= new Stripe(secret);
  return stripeClient;
}

async function stripeCustomer(companyId: string) {
  const subscription = await db.subscription.findUnique({ where: { companyId }, select: { externalCustomerId: true } });
  if (subscription?.externalCustomerId) return subscription.externalCustomerId;
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId }, select: { name: true, email: true } });
  const customer = await stripe().customers.create({ name: company.name, email: company.email, metadata: { companyId } });
  await db.subscription.updateMany({ where: { companyId }, data: { externalCustomerId: customer.id, billingProvider: "stripe" } });
  return customer.id;
}

const stripeDriver: BillingDriver = {
  name: "stripe",
  async startCheckout({ companyId, tier, successUrl, cancelUrl }) {
    const price = priceIdFor(tier);
    if (!price) throw new Error(`A Stripe price has not been configured for ${tier.toLowerCase()}.`);
    const customer = await stripeCustomer(companyId);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price, quantity: 1 }],
      success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}billing=complete&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelUrl}${cancelUrl.includes("?") ? "&" : "?"}billing=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      client_reference_id: companyId,
      metadata: { kind: "membership", companyId, tier },
      subscription_data: { metadata: { companyId, tier } },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout page.");
    return { url: session.url, externalId: session.id, provider: "stripe" };
  },
  async startSponsorCheckout({ companyId, listingId, pkg, successUrl, cancelUrl }) {
    const plan = SPONSOR_PACKAGES[pkg];
    const customer = await stripeCustomer(companyId);
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: plan.amount,
          product_data: { name: `Sponsored advert — ${plan.label}`, description: "Labelled priority placement in matching search results." },
        },
      }],
      success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}sponsored=complete&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelUrl}${cancelUrl.includes("?") ? "&" : "?"}sponsored=cancelled`,
      client_reference_id: companyId,
      metadata: { kind: "sponsorship", companyId, listingId, package: pkg },
      payment_intent_data: { metadata: { kind: "sponsorship", companyId, listingId, package: pkg } },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout page.");
    return { url: session.url, externalId: session.id, provider: "stripe" };
  },
  async cancel(companyId, atPeriodEnd) {
    const subscription = await db.subscription.findUnique({ where: { companyId }, select: { externalSubscriptionId: true } });
    if (!subscription?.externalSubscriptionId) throw new Error("No Stripe subscription was found.");
    if (atPeriodEnd) await stripe().subscriptions.update(subscription.externalSubscriptionId, { cancel_at_period_end: true });
    else await stripe().subscriptions.cancel(subscription.externalSubscriptionId);
    await db.subscription.update({ where: { companyId }, data: { cancelAtPeriodEnd: atPeriodEnd, ...(!atPeriodEnd ? { status: "CANCELLED" as const } : {}) } });
  },
  async billingPortalUrl(companyId, returnUrl) {
    const customer = await stripeCustomer(companyId);
    const session = await stripe().billingPortal.sessions.create({ customer, return_url: returnUrl });
    return session.url;
  },
};

const mockAllowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_BILLING === "true";
export const billing: BillingDriver = process.env.BILLING_DRIVER === "stripe" ? stripeDriver : mockAllowed ? mockDriver : disabledDriver;
export const billingIsLive = () => process.env.BILLING_DRIVER === "stripe" && Boolean(process.env.STRIPE_SECRET_KEY);
export const billingAvailable = () => billingIsLive() || mockAllowed;

export function priceIdFor(tier: MembershipTier) {
  return { FREE: null, PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL ?? null, BUSINESS: process.env.STRIPE_PRICE_BUSINESS ?? null }[tier];
}

export async function applySubscriptionChange(params: {
  companyId: string;
  tier: MembershipTier;
  provider: string;
  status?: SubscriptionStatus;
  externalCustomerId?: string;
  externalSubscriptionId?: string;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}) {
  const membership = await db.membership.findUnique({ where: { tier: params.tier } });
  if (!membership) throw new Error(`Unknown membership tier ${params.tier}`);
  return db.subscription.upsert({
    where: { companyId: params.companyId },
    create: {
      companyId: params.companyId, membershipId: membership.id, status: params.status ?? "ACTIVE",
      billingProvider: params.provider, externalCustomerId: params.externalCustomerId,
      externalSubscriptionId: params.externalSubscriptionId, currentPeriodEnd: params.periodEnd,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
    },
    update: {
      membershipId: membership.id, status: params.status ?? "ACTIVE", billingProvider: params.provider,
      ...(params.externalCustomerId ? { externalCustomerId: params.externalCustomerId } : {}),
      ...(params.externalSubscriptionId ? { externalSubscriptionId: params.externalSubscriptionId } : {}),
      ...(params.periodEnd ? { currentPeriodEnd: params.periodEnd } : {}),
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
    },
  });
}

export async function activateSponsorship(params: {
  companyId: string;
  listingId: string;
  pkg: SponsorPackage;
  provider: string;
  externalPaymentId?: string;
}) {
  const plan = SPONSOR_PACKAGES[params.pkg];
  const listing = await db.listing.findFirst({ where: { id: params.listingId, companyId: params.companyId, status: "ACTIVE" }, select: { id: true, featuredUntil: true } });
  if (!listing) throw new Error("Only a live advert owned by this provider can be sponsored.");
  const from = listing.featuredUntil && listing.featuredUntil > new Date() ? listing.featuredUntil : new Date();
  await db.$transaction([
    db.listing.update({ where: { id: listing.id }, data: { featured: true, featuredUntil: new Date(from.getTime() + plan.days * 86400000), sponsoredBid: plan.bid } }),
    db.payment.upsert({
      where: { externalPaymentId: params.externalPaymentId ?? `internal-${params.companyId}-${params.listingId}-${Date.now()}` },
      create: { companyId: params.companyId, kind: "FEATURED_LISTING", amount: plan.amount, status: "PAID", description: `Sponsored placement, ${plan.label}`, externalPaymentId: params.externalPaymentId },
      update: { status: "PAID" },
    }),
  ]);
}

export async function planLimits(companyId: string) {
  const subscription = await db.subscription.findUnique({ where: { companyId }, include: { membership: true } });
  const entitled = subscription && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(subscription.status);
  const membership = (entitled ? subscription.membership : null) ?? (await db.membership.findUnique({ where: { tier: "FREE" } }));
  if (!membership) throw new Error("Membership catalogue is empty. Run npm run db:seed.");
  const [listings, rooms, staff] = await Promise.all([
    db.listing.count({ where: { companyId, status: { in: ["ACTIVE", "PENDING_REVIEW", "PAUSED"] } } }),
    db.room.count({ where: { property: { companyId } } }),
    db.companyStaff.count({ where: { companyId } }),
  ]);
  const under = (used: number, max: number) => max === -1 || used < max;
  return { membership, subscription, used: { listings, rooms, staff }, canAddListing: under(listings, membership.maxListings), canAddRoom: under(rooms, membership.maxRooms), canAddStaff: under(staff, membership.maxStaff) };
}
