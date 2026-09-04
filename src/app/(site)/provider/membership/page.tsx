import { db } from "@/lib/db";
import { requireCompany } from "@/lib/rbac";
import { planLimits } from "@/lib/billing";
import { DashboardShell, DataTable, StatCard } from "@/components/dashboard-shell";
import { PlanPicker } from "@/components/plan-picker";
import { providerNav } from "../nav";
import { money, shortDate } from "@/lib/format";

export const metadata = { title: "Membership" };
export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const { companyId } = await requireCompany();
  const [nav, limits, plans, payments] = await Promise.all([
    providerNav(companyId),
    planLimits(companyId),
    db.membership.findMany({ orderBy: { priceMonthly: "asc" } }),
    db.payment.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const limit = (value: number) => (value === -1 ? "Unlimited" : value.toString());

  return (
    <DashboardShell
      title="Membership"
      subtitle="Prices here are placeholders while billing is in test mode."
      nav={nav}
      active="/provider/membership"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Current plan"
          value={limits.membership.name}
          hint={
            limits.subscription?.currentPeriodEnd
              ? `Renews ${shortDate(limits.subscription.currentPeriodEnd)}`
              : "No renewal date"
          }
        />
        <StatCard
          label="Adverts"
          value={`${limits.used.listings} / ${limit(limits.membership.maxListings)}`}
        />
        <StatCard label="Rooms" value={`${limits.used.rooms} / ${limit(limits.membership.maxRooms)}`} />
      </div>

      <section className="mt-8">
        <h2 className="text-[20px]">Plans</h2>
        <div className="mt-3">
          <PlanPicker
            currentTier={limits.membership.tier}
            cancelling={limits.subscription?.cancelAtPeriodEnd ?? false}
            plans={plans.map((plan) => ({
              tier: plan.tier,
              name: plan.name,
              description: plan.description,
              priceMonthly: plan.priceMonthly,
              maxListings: plan.maxListings,
              maxRooms: plan.maxRooms,
              featuredCredits: plan.featuredCredits,
              analytics: plan.analytics,
              priorityPlacement: plan.priorityPlacement,
            }))}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[20px]">Billing history</h2>
        <div className="mt-3">
          {payments.length === 0 ? (
            <p className="card p-5 text-[15px] text-ink-soft">Nothing billed yet.</p>
          ) : (
            <DataTable head={["Date", "Description", "Amount", "Status"]}>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3">{shortDate(payment.createdAt)}</td>
                  <td className="px-4 py-3">{payment.description ?? payment.kind.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{money(payment.amount)}</td>
                  <td className="px-4 py-3 capitalize text-ink-soft">{payment.status.toLowerCase()}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
