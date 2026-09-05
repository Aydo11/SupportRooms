import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { ReportDecision } from "@/components/admin-controls";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const TARGET_PATHS: Record<string, (id: string) => string | null> = {
  LISTING: (id) => `/listings/${id}`,
  COMPANY: () => null,
  USER: () => null,
  MESSAGE: () => null,
  LOOKING_FOR_AD: (id) => `/people/${id}`,
};

export default async function AdminReportsPage() {
  await requireAdmin("MODERATION");
  const [nav, reports] = await Promise.all([
    adminNav(),
    db.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: { reporter: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);

  return (
    <DashboardShell
      title="Reports"
      subtitle="Content and conduct flagged by people using the site."
      nav={nav}
      active="/admin/reports"
    >
      {reports.length === 0 ? (
        <EmptyState title="No reports" body="Nothing has been flagged." />
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => {
            const href = TARGET_PATHS[report.targetType]?.(report.targetId) ?? null;
            return (
              <li key={report.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[17px]">
                      {report.reason.replace(/_/g, " ").toLowerCase()} · {report.targetType.toLowerCase()}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-ink-faint">
                      Reported by {report.reporter.firstName} {report.reporter.lastName} on{" "}
                      {shortDate(report.createdAt)} · status {report.status.toLowerCase()}
                    </p>
                    {report.detail && <p className="mt-2 max-w-[70ch] text-[15px]">{report.detail}</p>}
                    {report.resolution && (
                      <p className="mt-2 text-[14px] text-pine-dark">Resolution: {report.resolution}</p>
                    )}
                    {href && (
                      <a href={href} className="mt-2 inline-block text-[14px] text-pine-dark hover:underline">
                        View what was reported
                      </a>
                    )}
                  </div>

                  {report.status !== "ACTIONED" && report.status !== "DISMISSED" && (
                    <div className="w-full sm:w-[320px]">
                      <ReportDecision id={report.id} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
