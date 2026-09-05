import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable, StatCard } from "@/components/dashboard-shell";
import { adminNav } from "../nav";
import { money, shortDate } from "@/lib/format";

export const metadata = { title: "Memberships" };
export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  await requireAdmin();
  const [nav, plans, subscriptions, payments, revenue] = await Promise.all([
    adminNav(),
    db.membership.findMany({ orderBy: { priceMonthly: "asc" } }),
    db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { company: { select: { name: true } }, membership: { select: { name: true } } },
    }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { company: { select: { name: true } } } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  return (
    <DashboardShell
      title="Memberships"
      subtitle="Plans, subscriptions and payments. Billing runs through an adapter, so this is test data until a provider is configured."
      nav={nav}
      active="/admin/memberships"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active subscriptions" value={subscriptions.filter((s) => s.status === "ACTIVE").length} />
        <StatCard label="Plans" value={plans.length} />
        <StatCard label="Collected" value={money(revenue._sum.amount ?? 0)} />
      </div>

      <section className="mt-8">
        <h2 className="text-[20px]">Plans</h2>
        <div className="mt-3">
          <DataTable head={["Plan", "Price", "Adverts", "Rooms", "Promoted slots", "Analytics"]}>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="px-4 py-3">{plan.name}</td>
                <td className="px-4 py-3">{plan.priceMonthly === 0 ? "Free" : `${money(plan.priceMonthly)} / month`}</td>
                <td className="px-4 py-3">{plan.maxListings === -1 ? "Unlimited" : plan.maxListings}</td>
                <td className="px-4 py-3">{plan.maxRooms === -1 ? "Unlimited" : plan.maxRooms}</td>
                <td className="px-4 py-3">{plan.featuredCredits}</td>
                <td className="px-4 py-3">{plan.analytics ? "Yes" : "No"}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[20px]">Subscriptions</h2>
        <div className="mt-3">
          <DataTable head={["Provider", "Plan", "Status", "Renews"]}>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td className="px-4 py-3">{subscription.company.name}</td>
                <td className="px-4 py-3">{subscription.membership.name}</td>
                <td className="px-4 py-3 capitalize text-ink-soft">
                  {subscription.status.toLowerCase()}
                  {subscription.cancelAtPeriodEnd ? " (ending)" : ""}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {subscription.currentPeriodEnd ? shortDate(subscription.currentPeriodEnd) : "—"}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[20px]">Payments</h2>
        <div className="mt-3">
          <DataTable head={["Date", "Provider", "Description", "Amount", "Status"]}>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3">{shortDate(payment.createdAt)}</td>
                <td className="px-4 py-3">{payment.company.name}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {payment.description ?? payment.kind.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3">{money(payment.amount)}</td>
                <td className="px-4 py-3 capitalize text-ink-soft">{payment.status.toLowerCase()}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>
    </DashboardShell>
  );
}
