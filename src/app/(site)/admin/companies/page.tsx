import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { AccountToggle } from "@/components/admin-controls";
import { AdminSearch } from "@/components/admin-search";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";
import { AdminPagination, ADMIN_PAGE_SIZE, pageNumber } from "@/components/admin-pagination";

export const metadata = { title: "Providers" };
export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const q = query.q?.trim();
  const page = pageNumber(query.page);
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : undefined;

  const [nav, companies, total] = await Promise.all([
    adminNav(),
    db.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        subscription: { include: { membership: { select: { name: true } } } },
        _count: { select: { listings: true, properties: true } },
      },
    }),
    db.company.count({ where }),
  ]);

  return (
    <DashboardShell title="Providers" nav={nav} active="/admin/companies">
      <AdminSearch placeholder="Search providers" />
      <div className="mt-4">
        <DataTable compact head={["Provider", "Plan", "Adverts", "Verification", "Status", "Joined", ""]}>
          {companies.map((company) => (
            <tr key={company.id}>
              <td className="px-4 py-3">
                <Link href={`/companies/${company.slug}`} className="hover:text-pine-dark">
                  {company.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink-soft">{company.subscription?.membership.name ?? "Free"}</td>
              <td className="px-4 py-3">{company._count.listings}</td>
              <td className="px-4 py-3 capitalize text-ink-soft">
                {company.verification.replace(/_/g, " ").toLowerCase()}
              </td>
              <td className="px-4 py-3 capitalize text-ink-soft">{company.status.toLowerCase()}</td>
              <td className="px-4 py-3 text-ink-soft">{shortDate(company.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <AccountToggle kind="company" id={company.id} status={company.status} />
              </td>
            </tr>
          ))}
        </DataTable>
        <AdminPagination page={page} total={total} query={{ q }} />
      </div>
    </DashboardShell>
  );
}
