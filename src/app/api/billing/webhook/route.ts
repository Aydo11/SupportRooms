import { NextResponse } from "next/server";
import { applySubscriptionChange } from "@/lib/billing";
import { db } from "@/lib/db";
import type { MembershipTier } from "@prisma/client";

/**
 * Billing webhook. The mock driver posts the same shape as the Stripe adapter
 * normalises to, so the handler doesn't change when you swap providers.
 *
 * With Stripe: verify the signature here using BILLING_WEBHOOK_SECRET and the
 * raw body, then map the event to one of the branches below.
 */
export async function POST(request: Request) {
  const secret = process.env.BILLING_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
  if (secret && request.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    companyId?: string;
    tier?: MembershipTier;
    provider?: string;
    externalCustomerId?: string;
    externalSubscriptionId?: string;
    periodEnd?: string;
  };

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!event.companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  switch (event.type) {
    case "subscription.created":
    case "subscription.updated":
    case "checkout.completed": {
      if (!event.tier) return NextResponse.json({ error: "tier is required" }, { status: 400 });
      await applySubscriptionChange({
        companyId: event.companyId,
        tier: event.tier,
        provider: event.provider ?? "webhook",
        externalCustomerId: event.externalCustomerId,
        externalSubscriptionId: event.externalSubscriptionId,
        periodEnd: event.periodEnd ? new Date(event.periodEnd) : undefined,
      });
      break;
    }

    case "subscription.cancelled": {
      await db.subscription.updateMany({
        where: { companyId: event.companyId },
        data: { status: "CANCELLED", cancelAtPeriodEnd: true },
      });
      break;
    }

    case "payment.failed": {
      await db.subscription.updateMany({
        where: { companyId: event.companyId },
        data: { status: "PAST_DUE" },
      });
      break;
    }

    default:
      return NextResponse.json({ received: true, handled: false });
  }

  return NextResponse.json({ received: true, handled: true });
}
