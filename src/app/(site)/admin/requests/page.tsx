import Link from "next/link";
import { Prisma, RequestStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { AdminFilters, AdminFilterField } from "@/components/admin-filters";
import { adminNav } from "../nav";
import { PIPELINE_LABELS } from "@/lib/taxonomy";
import { shortDate } from "@/lib/format";
import { AdminPagination, ADMIN_PAGE_SIZE, pageNumber } from "@/components/admin-pagination";

export const metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = query.q?.trim();
  const status = Object.values(RequestStatus).includes(query.status as RequestStatus) ? query.status as RequestStatus : undefined;
  const where: Prisma.AccommodationRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [
      { applicant: { firstName: { contains: q, mode: "insensitive" } } },
      { applicant: { lastName: { contains: q, mode: "insensitive" } } },
      { listing: { title: { contains: q, mode: "insensitive" } } },
      { listing: { company: { name: { contains: q, mode: "insensitive" } } } },
    ] } : {}),
  };
  const [nav, requests, total] = await Promise.all([
    adminNav(),
    db.accommodationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        listing: { select: { id: true, title: true, company: { select: { name: true } } } },
        applicant: { select: { firstName: true, lastName: true } },
      },
    }),
    db.accommodationRequest.count({ where }),
  ]);

  return (
    <DashboardShell
      title="Requests"
      subtitle="Progress only — the detail people wrote stays between them and the provider."
      nav={nav}
      active="/admin/requests"
    >
      <AdminFilters>
        <AdminFilterField label="Search" wide><input className="field" name="q" defaultValue={q} placeholder="Applicant, advert or provider" /></AdminFilterField>
        <AdminFilterField label="Request status"><select className="field" name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{Object.values(RequestStatus).map((value) => <option key={value} value={value}>{PIPELINE_LABELS[value]}</option>)}</select></AdminFilterField>
      </AdminFilters>
      <div className="mt-4">
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
      <AdminPagination page={page} total={total} query={{ q, status }} />
      </div>
    </DashboardShell>
  );
}
