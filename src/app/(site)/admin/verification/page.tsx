import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { VerificationDecision } from "@/components/admin-controls";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";

export const metadata = { title: "Verification" };
export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  await requireAdmin();
  const [nav, requests] = await Promise.all([
    adminNav(),
    db.verificationRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        company: { select: { id: true, name: true, slug: true, registrationNumber: true, website: true } },
        documents: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <DashboardShell
      title="Verification"
      subtitle="A manual check of who a provider is. It doesn't assert any regulatory status, and the badge copy says so."
      nav={nav}
      active="/admin/verification"
    >
      {requests.length === 0 ? (
        <EmptyState title="Nothing to verify" body="Verification requests from providers appear here." />
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[18px]">
                    <Link href={`/companies/${request.company.slug}`} className="hover:text-pine-dark">
                      {request.company.name}
                    </Link>
                  </h2>
                  <p className="mt-0.5 text-[14px] text-ink-soft">
                    {request.company.registrationNumber ?? "No registration number given"} ·{" "}
                    {request.company.website ?? "no website"}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-faint">
                    Submitted {shortDate(request.createdAt)} · {request.status.toLowerCase()}
                  </p>
                  {request.note && <p className="mt-2 text-[14px]">{request.note}</p>}
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {request.documents.map((document) => (
                      <li key={document.id}>
                        <a href={`/api/documents/${document.id}`} className="chip hover:bg-paper-sunk">
                          {document.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {request.status === "PENDING" && (
                  <div className="w-full sm:w-[280px]">
                    <VerificationDecision id={request.id} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
