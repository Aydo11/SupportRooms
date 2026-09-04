import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { PipelineTrail } from "@/components/pipeline";
import { StatusUpdater } from "@/components/status-updater";
import { providerNav } from "../nav";
import { PIPELINE, PIPELINE_LABELS } from "@/lib/taxonomy";
import { ageFrom, shortDate } from "@/lib/format";

export const metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

export default async function ProviderRequestsPage() {
  const { companyId } = await requireCompany();
  const [nav, requests] = await Promise.all([
    providerNav(companyId),
    db.accommodationRequest.findMany({
      where: { listing: { companyId } },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true } },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            locationLabel: true,
            profile: { select: { dateOfBirth: true, supportTypes: true } },
          },
        },
      },
    }),
  ]);

  return (
    <DashboardShell
      title="Accommodation requests"
      subtitle="People who applied directly through your adverts. Keep the status current so they know where they stand."
      nav={nav}
      active="/provider/requests"
    >
      {requests.length === 0 ? (
        <EmptyState title="No requests yet" body="Requests from your live adverts appear here." />
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[18px]">
                    {request.applicant.firstName} {request.applicant.lastName}
                  </h2>
                  <p className="mt-0.5 text-[14px] text-ink-soft">
                    {request.applicant.profile?.dateOfBirth
                      ? `${ageFrom(request.applicant.profile.dateOfBirth)} · `
                      : ""}
                    {request.applicant.locationLabel ?? "Location not given"} · applied{" "}
                    {shortDate(request.createdAt)}
                  </p>
                  <p className="mt-1 text-[14px]">
                    <Link href={`/provider/adverts/${request.listing.id}`} className="text-pine-dark hover:underline">
                      {request.listing.title}
                    </Link>
                  </p>
                </div>
                <Link href="/messages" className="btn-secondary">Message</Link>
              </div>

              <div className="mt-4">
                <PipelineTrail status={request.status} />
              </div>

              <dl className="mt-4 grid gap-3 text-[14px] sm:grid-cols-2">
                {request.moveInDate && (
                  <div>
                    <dt className="text-ink-faint">Wants to move</dt>
                    <dd>{shortDate(request.moveInDate)}</dd>
                  </div>
                )}
                {request.accommodationNeeds && (
                  <div>
                    <dt className="text-ink-faint">Accommodation needs</dt>
                    <dd className="whitespace-pre-line">{request.accommodationNeeds}</dd>
                  </div>
                )}
                {request.supportNeeds && (
                  <div>
                    <dt className="text-ink-faint">Support needs</dt>
                    <dd className="whitespace-pre-line">{request.supportNeeds}</dd>
                  </div>
                )}
                {request.additionalInfo && (
                  <div>
                    <dt className="text-ink-faint">Anything else</dt>
                    <dd className="whitespace-pre-line">{request.additionalInfo}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 border-t border-line pt-4">
                <StatusUpdater
                  kind="request"
                  id={request.id}
                  current={request.status}
                  note={request.statusNote}
                  options={[...PIPELINE, "DECLINED"].map((value) => ({
                    value,
                    label: PIPELINE_LABELS[value],
                  }))}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
