import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { AccountToggle } from "@/components/admin-controls";
import { AdminSearch } from "@/components/admin-search";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const q = query.q?.trim();

  const [nav, users] = await Promise.all([
    adminNav(),
    db.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
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
  ]);

  return (
    <DashboardShell title="Users" nav={nav} active="/admin/users">
      <AdminSearch placeholder="Search by name or email" />
      <div className="mt-4">
        <DataTable head={["Name", "Email", "Role", "Status", "Joined", ""]}>
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
                {!user.deletedAt && <AccountToggle kind="user" id={user.id} status={user.status} />}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </DashboardShell>
  );
}
