import Link from "next/link";
import { db } from "@/lib/db";
import { requireReferrer } from "@/lib/rbac";
import { referrerPlanLimits } from "@/lib/billing";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { referrerNav } from "../nav";
import { supportLabel } from "@/lib/taxonomy";
import { ageFrom, timeAgo } from "@/lib/format";

export const metadata = { title: "My clients" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-pine-light text-pine-dark",
  PLACED: "bg-clay-light text-clay",
  ARCHIVED: "bg-paper-sunk text-ink-faint",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PLACED: "Placed",
  ARCHIVED: "Archived",
};

export default async function ClientsPage() {
  const user = await requireReferrer();
  const [nav, limits, clients] = await Promise.all([
    referrerNav(user.id),
    referrerPlanLimits(user.id),
    db.client.findMany({
      where: { referrerId: user.id },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: {
        _count: { select: { referrals: true, shares: { where: { revokedAt: null } } } },
      },
    }),
  ]);

  return (
    <DashboardShell
      title="My clients"
      subtitle={
        limits.membership.maxClients === -1
          ? "Unlimited active clients on your plan."
          : `${limits.used.clients} of ${limits.membership.maxClients} active clients used on the ${limits.membership.name} plan.`
      }
      nav={nav}
      active="/referrals/clients"
      action={
        limits.canAddClient ? (
          <Link href="/referrals/clients/new" className="btn-primary">Add a client</Link>
        ) : (
          <Link href="/referrals/membership" className="btn-secondary">Upgrade to add more</Link>
        )
      }
    >
      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Add the people you're supporting once, then refer them or share their profile with a provider in a couple of clicks."
          actionHref="/referrals/clients/new"
          actionLabel="Add a client"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client, index) => (
            <li key={client.id} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }} className="animate-fade-in-up">
              <Link
                href={`/referrals/clients/${client.id}`}
                className="interactive-card card block h-full p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[17px]">
                    {client.firstName} {client.lastName}
                  </h2>
                  <span className={`rounded-pill px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLE[client.status]}`}>
                    {STATUS_LABEL[client.status]}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-ink-faint">
                  {client.dateOfBirth ? `${ageFrom(client.dateOfBirth)} · ` : ""}
                  {client.preferredLocation || "No preferred area set"}
                </p>
                {client.supportTypes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {client.supportTypes.slice(0, 3).map((slug) => (
                      <span key={slug} className="chip">{supportLabel(slug)}</span>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-[13px] text-ink-faint">
                  {client._count.referrals} referral{client._count.referrals === 1 ? "" : "s"} ·{" "}
                  {client._count.shares} active share{client._count.shares === 1 ? "" : "s"} · updated{" "}
                  {timeAgo(client.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
