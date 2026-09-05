import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { AccountToggle } from "@/components/admin-controls";
import { AdminSearch } from "@/components/admin-search";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";
import { AdminPagination, ADMIN_PAGE_SIZE, pageNumber } from "@/components/admin-pagination";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const q = query.q?.trim();
  const page = pageNumber(query.page);
  const where = q ? { OR: [
    { email: { contains: q, mode: "insensitive" as const } },
    { firstName: { contains: q, mode: "insensitive" as const } },
    { lastName: { contains: q, mode: "insensitive" as const } },
  ] } : undefined;

  const [nav, users, total] = await Promise.all([
    adminNav(),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ]);

  return (
    <DashboardShell title="Users" nav={nav} active="/admin/users">
      <AdminSearch placeholder="Search by name or email" />
      <div className="mt-4">
        <DataTable compact head={["Name", "Email", "Role", "Status", "Joined", ""]}>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-4 py-3 text-ink-soft">{user.email}</td>
              <td className="px-4 py-3 capitalize">{user.role.toLowerCase()}</td>
              <td className="px-4 py-3 capitalize text-ink-soft">
                {user.deletedAt ? "deleted" : user.status.toLowerCase()}
              </td>
              <td className="px-4 py-3 text-ink-soft">{shortDate(user.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                {!user.deletedAt && user.role !== "ADMIN" && <AccountToggle kind="user" id={user.id} status={user.status} />}
              </td>
            </tr>
          ))}
        </DataTable>
        <AdminPagination page={page} total={total} query={{ q }} />
      </div>
    </DashboardShell>
  );
}
