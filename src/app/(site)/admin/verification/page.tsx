import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { VerificationDecision } from "@/components/admin-controls";
import { adminNav } from "../nav";
import { shortDate } from "@/lib/format";
import { REQUIRED_VERIFICATION_DOCUMENTS, VERIFICATION_CATEGORY_LABELS } from "@/lib/verification";

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
        documents: { select: { id: true, name: true, category: true } },
      },
    }),
  ]);

  return (
    <DashboardShell
      title="Verification"
      subtitle="Review provider identity, insurance, governance and safeguarding evidence. Every approval records a human checklist."
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
                  {request.insuranceExpiresAt && <p className="mt-1 text-[13px] text-ink-soft">Insurance expires {shortDate(request.insuranceExpiresAt)}</p>}
                  {request.note && <p className="mt-2 text-[14px]"><span className="font-semibold">Provider note:</span> {request.note}</p>}
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {request.documents.map((document) => (
                      <li key={document.id} className="rounded-[10px] border border-line bg-paper px-3 py-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-pine-dark">
                          {VERIFICATION_CATEGORY_LABELS[document.category ?? ""] ?? "Legacy evidence"}
                        </span>
                        <a href={`/api/documents/${document.id}`} className="mt-0.5 block break-all text-[13px] text-ink-soft hover:text-pine-dark hover:underline">
                          {document.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {request.reviewNote && <p className="mt-3 text-[13px] text-ink-soft"><span className="font-semibold">Review note:</span> {request.reviewNote}</p>}
                </div>

                {request.status === "PENDING" && (
                  <div className="w-full sm:w-[360px]">
                    <VerificationDecision
                      id={request.id}
                      requiredDocumentsPresent={REQUIRED_VERIFICATION_DOCUMENTS.every((required) =>
                        request.documents.some((document) => document.category === required.category),
                      )}
                    />
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
