import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { AccountToggle } from "@/components/admin-controls";
import { AdminSearch } from "@/components/admin-search";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";

export const metadata = { title: "Providers" };
export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireAdmin();
  const q = searchParams.q?.trim();

  const [nav, companies] = await Promise.all([
    adminNav(),
    db.company.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        subscription: { include: { membership: { select: { name: true } } } },
        _count: { select: { listings: true, properties: true } },
      },
    }),
  ]);

  return (
    <DashboardShell title="Providers" nav={nav} active="/admin/companies">
      <AdminSearch placeholder="Search providers" />
      <div className="mt-4">
        <DataTable head={["Provider", "Plan", "Adverts", "Verification", "Status", "Joined", ""]}>
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
      </div>
    </DashboardShell>
  );
}
