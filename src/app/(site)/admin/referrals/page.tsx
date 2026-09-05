import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { adminNav } from "../nav";
import { PIPELINE_LABELS, URGENCY_LABELS } from "@/lib/taxonomy";
import { shortDate } from "@/lib/format";
import { AdminPagination, ADMIN_PAGE_SIZE, pageNumber } from "@/components/admin-pagination";

export const metadata = { title: "Referrals" };
export const dynamic = "force-dynamic";

export default async function AdminReferralsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const page = pageNumber((await searchParams).page);
  const [nav, referrals, total] = await Promise.all([
    adminNav(),
    db.referral.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        listing: { select: { id: true, title: true, company: { select: { name: true } } } },
        referrer: { select: { firstName: true, lastName: true } },
      },
    }),
    db.referral.count(),
  ]);

  return (
    <DashboardShell
      title="Referrals"
      subtitle="Open one only if you need to — applicant detail is logged when an admin views it."
      nav={nav}
      active="/admin/referrals"
    >
      <DataTable compact head={["Reference", "Referrer", "Provider", "Urgency", "Status", "Made"]}>
        {referrals.map((referral) => (
          <tr key={referral.id}>
            <td className="px-4 py-3">
              <Link href={`/referrals/${referral.id}`} className="hover:text-pine-dark">
                {referral.reference}
              </Link>
            </td>
            <td className="px-4 py-3">
              {referral.referrer.firstName} {referral.referrer.lastName}
              {referral.organisation ? `, ${referral.organisation}` : ""}
            </td>
            <td className="px-4 py-3 text-ink-soft">{referral.listing?.company.name ?? "No advert"}</td>
            <td className="px-4 py-3">{URGENCY_LABELS[referral.urgency]}</td>
            <td className="px-4 py-3">{PIPELINE_LABELS[referral.status]}</td>
            <td className="px-4 py-3 text-ink-soft">{shortDate(referral.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
      <AdminPagination page={page} total={total} />
    </DashboardShell>
  );
}
