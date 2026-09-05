import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { brand } from "@/brand.config";
import { billingIsLive } from "@/lib/billing";
import { getCurrentUser } from "@/lib/session";
import { PricingTabs } from "@/components/pricing-tabs";

export const metadata = { title: "Membership and pricing" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [plans, referrerPlans, user] = await Promise.all([
    db.membership.findMany({ where: { active: true, audience: "PROVIDER" }, orderBy: { priceMonthly: "asc" } }),
    db.membership.findMany({ where: { active: true, audience: "REFERRER" }, orderBy: { priceMonthly: "asc" } }),
    getCurrentUser(),
  ]);
  const livePayments = billingIsLive();
  const provider = user?.role === "PROVIDER";
  const referrer = user?.role === "REFERRER";

  return (
    <div className="shell py-14">
      <h1 className="max-w-[22ch] text-[38px] leading-tight">Membership and pricing</h1>
      <p className="mt-3 max-w-[62ch] text-[17px] leading-relaxed text-ink-soft">
        People looking for accommodation always use {brand.name} free. Providers pay to advertise,
        and professional referrers can upgrade for a bigger caseload and unlimited sharing.{" "}
        {livePayments ? "Payments are handled securely by Stripe." : "Online payments are being configured."}
      </p>

      <div className="mt-8">
        <PricingTabs
          providerPanel={
            <div className="grid gap-5 lg:grid-cols-3">
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
              href={provider ? "/provider/membership" : `/register?type=PROVIDER&plan=${plan.tier}`}
              className={plan.tier === "PROFESSIONAL" ? "btn-primary mt-7 w-full" : "btn-secondary mt-7 w-full"}
            >
              {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
            </Link>
                </div>
              ))}
            </div>
          }
          referrerPanel={
            <div>
              <div className="grid gap-5 lg:grid-cols-2">
                {referrerPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={plan.tier === "REFERRER_PRO" ? "rounded-card border-2 border-pine bg-white p-7" : "card p-7"}
                  >
                    {plan.tier === "REFERRER_PRO" && (
                      <span className="chip chip-active mb-3">For a real referral stream</span>
                    )}
                    <h2 className="text-[24px]">{plan.name}</h2>
                    <p className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-display text-[34px]">{plan.priceMonthly === 0 ? "Free" : money(plan.priceMonthly)}</span>
                      {plan.priceMonthly > 0 && <span className="text-[15px] text-ink-soft">per month</span>}
                    </p>
                    {plan.description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{plan.description}</p>}

                    <ul className="mt-5 space-y-2.5 text-[15px]">
                      <Feature>{plan.maxClients === -1 ? "Unlimited active clients" : `${plan.maxClients} active client${plan.maxClients === 1 ? "" : "s"}`}</Feature>
                      <Feature>
                        {plan.maxSharesPerClient === -1
                          ? "Share each profile with unlimited providers"
                          : `Share each profile with ${plan.maxSharesPerClient} provider${plan.maxSharesPerClient === 1 ? "" : "s"} at once`}
                      </Feature>
                      <Feature enabled={plan.priorityRouting}>Priority routing badge on referrals</Feature>
                    </ul>

                    <Link
                      href={referrer ? "/referrals/membership" : `/register?type=REFERRER&plan=${plan.tier}`}
                      className={plan.tier === "REFERRER_PRO" ? "btn-primary mt-7 w-full" : "btn-secondary mt-7 w-full"}
                    >
                      {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-card border border-line bg-white p-6">
                <h2 className="text-[18px]">Using SupportRooms as a referral stream</h2>
                <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-ink-soft">
                  Save the people you support once as clients, then refer them to a live advert or
                  share their profile with any provider — no re-typing the same details into a new
                  form each time. Pro removes the caseload limit and lets you share one profile with
                  as many providers as you're approaching at once, which matters when you're placing
                  someone urgently.
                </p>
              </div>
            </div>
          }
        />
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
          {livePayments ? "Payment is taken securely through Stripe Checkout." : "Online payments are being configured."} Longer packages sit above shorter ones
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
