import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";
import { AdminPagination, ADMIN_PAGE_SIZE, pageNumber } from "@/components/admin-pagination";

export const metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const page = pageNumber((await searchParams).page);
  const [nav, entries, total] = await Promise.all([
    adminNav(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
    }),
    db.auditLog.count(),
  ]);

  return (
    <DashboardShell
      title="Audit log"
      subtitle="Every consequential action, including admin ones."
      nav={nav}
      active="/admin/audit"
    >
      <DataTable compact head={["When", "Who", "Action", "Target"]}>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td className="px-4 py-3 text-ink-soft">
              {shortDate(entry.createdAt)} {entry.createdAt.toISOString().slice(11, 16)}
            </td>
            <td className="px-4 py-3">
              {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : "System"}
            </td>
            <td className="px-4 py-3">{entry.action}</td>
            <td className="px-4 py-3 text-ink-faint">
              {entry.targetType ? `${entry.targetType} ${entry.targetId ?? ""}` : "—"}
            </td>
          </tr>
        ))}
      </DataTable>
      <AdminPagination page={page} total={total} />
    </DashboardShell>
  );
}
