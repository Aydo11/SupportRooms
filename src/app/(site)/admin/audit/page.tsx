import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";

export const metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdmin();
  const [nav, entries] = await Promise.all([
    adminNav(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);

  return (
    <DashboardShell
      title="Audit log"
      subtitle="Every consequential action, including admin ones."
      nav={nav}
      active="/admin/audit"
    >
      <DataTable head={["When", "Who", "Action", "Target"]}>
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
    </DashboardShell>
  );
}
