import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { adminNav } from "../nav";
import { PIPELINE_LABELS } from "@/lib/taxonomy";
import { shortDate } from "@/lib/format";
import { AdminPagination, ADMIN_PAGE_SIZE, pageNumber } from "@/components/admin-pagination";

export const metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const page = pageNumber((await searchParams).page);
  const [nav, requests, total] = await Promise.all([
    adminNav(),
    db.accommodationRequest.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        listing: { select: { id: true, title: true, company: { select: { name: true } } } },
        applicant: { select: { firstName: true, lastName: true } },
      },
    }),
    db.accommodationRequest.count(),
  ]);

  return (
    <DashboardShell
      title="Requests"
      subtitle="Progress only — the detail people wrote stays between them and the provider."
      nav={nav}
      active="/admin/requests"
    >
      <DataTable compact head={["Applicant", "Advert", "Provider", "Status", "Made"]}>
        {requests.map((request) => (
          <tr key={request.id}>
            <td className="px-4 py-3">
              {request.applicant.firstName} {request.applicant.lastName.charAt(0)}.
            </td>
            <td className="px-4 py-3">
              <Link href={`/listings/${request.listing.id}`} className="hover:text-pine-dark">
                {request.listing.title}
              </Link>
            </td>
            <td className="px-4 py-3 text-ink-soft">{request.listing.company.name}</td>
            <td className="px-4 py-3">{PIPELINE_LABELS[request.status]}</td>
            <td className="px-4 py-3 text-ink-soft">{shortDate(request.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
      <AdminPagination page={page} total={total} />
    </DashboardShell>
  );
}
