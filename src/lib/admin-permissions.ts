export type AdminPermission = "ALL" | "MODERATION";
export function hasAdminPermission(user: { role: string; adminPermissions: string[] } | null, permission: AdminPermission = "ALL") {
  return user?.role === "ADMIN" && (user.adminPermissions.includes("ALL") || user.adminPermissions.includes(permission));
}
