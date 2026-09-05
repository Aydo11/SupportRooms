import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, StatCard } from "@/components/dashboard-shell";
import { adminNav } from "./nav";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const admin = await requireAdmin("MODERATION");
  if (!hasAdminPermission(admin)) redirect("/admin/reports");
  const nav = await adminNav();

  const [users, companies, live, pending, rooms, available, requests, referrals, reports, recent] =
    await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.company.count(),
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.listing.count({ where: { status: "PENDING_REVIEW" } }),
      db.room.count(),
      db.room.count({ where: { status: "AVAILABLE" } }),
      db.accommodationRequest.count(),
      db.referral.count(),
      db.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    ]);

  return (
    <DashboardShell
      title="Admin"
      subtitle="Moderation, verification and platform health."
      nav={nav}
      active="/admin"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard compact label="Live adverts" value={live} hint={`${pending} awaiting review`} />
        <StatCard compact label="Rooms available" value={available} hint={`of ${rooms} rooms`} />
        <StatCard compact label="Users" value={users} hint={`${companies} providers`} />
        <StatCard compact label="Requests" value={requests} />
        <StatCard compact label="Referrals" value={referrals} />
        <StatCard compact label="Open reports" value={reports} />
      </div>

      {pending > 0 && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-[15px]">
            {pending} advert{pending === 1 ? "" : "s"} waiting for review.
          </p>
          <Link href="/admin/listings?status=PENDING_REVIEW" className="btn-primary">Review now</Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-[20px]">Recent activity</h2>
        <ul className="card mt-3 divide-y divide-line">
          {recent.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span className="text-[14px]">{entry.action.replace(/[._]/g, " ")}</span>
              <span className="text-[13px] text-ink-faint">
                {entry.targetType} · {timeAgo(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
