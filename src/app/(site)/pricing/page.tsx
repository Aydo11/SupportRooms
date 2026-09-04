import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { brand } from "@/brand.config";

export const metadata = { title: "Membership and pricing" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await db.membership.findMany({ where: { active: true }, orderBy: { priceMonthly: "asc" } });

  return (
    <div className="shell py-14">
      <h1 className="max-w-[18ch] text-[38px] leading-tight">Membership for providers</h1>
      <p className="mt-3 max-w-[62ch] text-[17px] leading-relaxed text-ink-soft">
        People looking for accommodation and professional referrers use {brand.name} free. Providers
        pay to advertise. Prices below are placeholders while billing is being connected.
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={plan.tier === "PROFESSIONAL" ? "rounded-card border-2 border-pine bg-white p-7" : "card p-7"}
          >
            {plan.tier === "PROFESSIONAL" && (
              <span className="chip chip-active mb-3">Most providers start here</span>
            )}
            <h2 className="text-[24px]">{plan.name}</h2>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-[34px]">{plan.priceMonthly === 0 ? "Free" : money(plan.priceMonthly)}</span>
              {plan.priceMonthly > 0 && <span className="text-[15px] text-ink-soft">per month</span>}
            </p>
            {plan.description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{plan.description}</p>}

            <ul className="mt-5 space-y-2.5 text-[15px]">
              <Feature>{plan.maxListings === -1 ? "Unlimited adverts" : `${plan.maxListings} live advert${plan.maxListings === 1 ? "" : "s"}`}</Feature>
              <Feature>{plan.maxRooms === -1 ? "Unlimited rooms" : `Up to ${plan.maxRooms} rooms`}</Feature>
              <Feature>{plan.maxStaff === 1 ? "Single user" : `${plan.maxStaff} staff accounts`}</Feature>
              <Feature enabled={plan.videoUploads}>Video uploads</Feature>
              <Feature enabled={plan.analytics}>Advert analytics</Feature>
              <Feature enabled={plan.priorityPlacement}>Priority placement in search</Feature>
              <Feature enabled={plan.featuredCredits > 0}>
                {plan.featuredCredits > 0 ? `${plan.featuredCredits} promoted slots included` : "Promoted slots"}
              </Feature>
              <Feature enabled={plan.prioritySupport}>Priority support</Feature>
            </ul>

            <Link
              href={`/register?type=PROVIDER&plan=${plan.tier}`}
              className={plan.tier === "PROFESSIONAL" ? "btn-primary mt-7 w-full" : "btn-secondary mt-7 w-full"}
            >
              {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
            </Link>
          </div>
        ))}
      </div>

      <section id="sponsored" className="card mt-10 p-6">
        <h2 className="text-[20px]">Sponsored adverts</h2>
        <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-ink-soft">
          Providers can pay to sponsor an advert. Sponsored adverts fill up to three labelled slots
          at the top of the first page of a matching search, and get a highlighted pin on the map.
        </p>
        <ul className="mt-4 grid gap-2 text-[15px] text-ink-soft sm:grid-cols-2">
          <li>They only ever appear on the first page — never on page two onwards.</li>
          <li>They still have to match your filters. Sponsoring can&apos;t force an advert in front of you if it doesn&apos;t fit what you asked for.</li>
          <li>They&apos;re labelled &ldquo;Sponsored&rdquo; everywhere they appear, including on the map.</li>
          <li>Paying changes nothing about verification, moderation, or organic ranking.</li>
        </ul>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["7 days", "£19", "A short push while a room is empty."],
            ["30 days", "£59", "The usual choice."],
            ["90 days", "£149", "Top of the sponsored slots all quarter."],
          ].map(([label, price, note]) => (
            <div key={label} className="rounded-[10px] border border-line p-4">
              <p className="text-[15px] font-medium">{label}</p>
              <p className="mt-1 font-display text-[22px] leading-none">{price}</p>
              <p className="mt-2 text-[13px] text-ink-soft">{note}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-ink-faint">
          Placeholder prices while billing runs in test mode. Longer packages sit above shorter ones
          in the sponsored slots.
        </p>
      </section>
    </div>
  );
}

function Feature({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  return (
    <li className={`flex items-start gap-2.5 ${enabled ? "" : "text-ink-faint line-through"}`}>
      <svg viewBox="0 0 16 16" className={`mt-1 h-3.5 w-3.5 shrink-0 ${enabled ? "text-pine" : "text-line-strong"}`} fill="currentColor">
        <path d="M6.2 11.6 2.6 8l1-1 2.6 2.6L12.4 3.4l1 1-7.2 7.2Z" />
      </svg>
      {children}
    </li>
  );
}
