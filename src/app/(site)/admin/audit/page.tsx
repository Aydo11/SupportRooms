import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { AdminFilters, AdminFilterField } from "@/components/admin-filters";
import { AdminPagination, ADMIN_PAGE_SIZE, pageNumber } from "@/components/admin-pagination";
import { adminNav } from "../nav";

export const metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

type Search = { q?: string; action?: string; targetType?: string; from?: string; to?: string; page?: string };

function dateBoundary(value: string | undefined, end = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function exactDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: "Europe/London" }).format(date);
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = query.q?.trim();
  const action = query.action?.trim();
  const targetType = query.targetType?.trim();
  const from = dateBoundary(query.from);
  const to = dateBoundary(query.to, true);
  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    ...(targetType ? { targetType: { contains: targetType, mode: "insensitive" } } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q ? { OR: [
      { action: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
      { actor: { is: { email: { contains: q, mode: "insensitive" } } } },
      { actor: { is: { firstName: { contains: q, mode: "insensitive" } } } },
      { actor: { is: { lastName: { contains: q, mode: "insensitive" } } } },
    ] } : {}),
  };
  const [nav, entries, total] = await Promise.all([
    adminNav(),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE, include: { actor: { select: { firstName: true, lastName: true, email: true } } } }),
    db.auditLog.count({ where }),
  ]);

  return <DashboardShell title="Audit log" subtitle="A searchable, append-only record of consequential activity." nav={nav} active="/admin/audit">
    <AdminFilters>
      <AdminFilterField label="Search actor or ID" wide><input className="field" name="q" defaultValue={q} placeholder="Email, name or target ID" /></AdminFilterField>
      <AdminFilterField label="Action"><input className="field" name="action" defaultValue={action} placeholder="e.g. report" /></AdminFilterField>
      <AdminFilterField label="Target type"><input className="field" name="targetType" defaultValue={targetType} placeholder="e.g. User" /></AdminFilterField>
      <AdminFilterField label="From"><input className="field" type="date" name="from" defaultValue={query.from} /></AdminFilterField>
      <AdminFilterField label="To"><input className="field" type="date" name="to" defaultValue={query.to} /></AdminFilterField>
    </AdminFilters>
    <div className="mt-4">
      <DataTable compact head={["When", "Who", "Action", "Target", ""]}>
        {entries.map((entry) => <tr key={entry.id}>
          <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{exactDate(entry.createdAt)}</td>
          <td className="px-4 py-3"><span className="block">{entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : "System"}</span>{entry.actor ? <span className="block text-[12px] text-ink-faint">{entry.actor.email}</span> : null}</td>
          <td className="px-4 py-3">{entry.action}</td>
          <td className="max-w-[260px] px-4 py-3 text-ink-faint"><span className="block">{entry.targetType ?? "—"}</span><span className="block truncate text-[12px]">{entry.targetId ?? ""}</span></td>
          <td className="px-4 py-3 text-right"><Link className="btn-secondary" href={`/admin/audit/${entry.id}`}>Details</Link></td>
        </tr>)}
      </DataTable>
      <AdminPagination page={page} total={total} query={{ q, action, targetType, from: query.from, to: query.to }} />
    </div>
  </DashboardShell>;
}
