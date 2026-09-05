import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { hasAdminPermission } from "@/lib/admin-permissions";
import type { NavItem } from "@/components/dashboard-shell";

export async function adminNav(): Promise<NavItem[]> {
  const user = await requireAdmin("MODERATION");
  if (!hasAdminPermission(user)) return [
    { href: "/admin/listings", label: "Adverts" },
    { href: "/admin/reports", label: "Reports" },
  ];
  const [pendingListings, pendingVerification, openReports] = await Promise.all([
    db.listing.count({ where: { status: "PENDING_REVIEW" } }),
    db.verificationRequest.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
  ]);

  return [
    { href: "/admin", label: "Overview" },
    { href: "/admin/listings", label: "Adverts", badge: pendingListings || undefined },
    { href: "/admin/verification", label: "Verification", badge: pendingVerification || undefined },
    { href: "/admin/reports", label: "Reports", badge: openReports || undefined },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/team", label: "Team & permissions" },
    { href: "/admin/companies", label: "Providers" },
    { href: "/admin/requests", label: "Requests" },
    { href: "/admin/referrals", label: "Referrals" },
    { href: "/admin/memberships", label: "Memberships" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/audit", label: "Audit log" },
  ];
}
