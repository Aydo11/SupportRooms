import { db } from "@/lib/db";
import type { NavItem } from "@/components/dashboard-shell";

export async function referrerNav(userId: string): Promise<NavItem[]> {
  const open = await db.referral.count({
    where: { referrerId: userId, status: { notIn: ["MOVED_IN", "DECLINED", "WITHDRAWN"] } },
  });

  return [
    { href: "/referrals", label: "My referrals", badge: open || undefined },
    { href: "/referrals/new", label: "New referral" },
    { href: "/search", label: "Search accommodation" },
    { href: "/messages", label: "Messages" },
    { href: "/dashboard/notifications", label: "Notifications" },
    { href: "/dashboard/settings", label: "Settings" },
  ];
}
