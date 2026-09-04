import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { DashboardShell, DataTable } from "@/components/dashboard-shell";
import { EmptyState, FormSuccess } from "@/components/ui";
import { PipelineTrail } from "@/components/pipeline";
import { userNav } from "../nav";
import { shortDate } from "@/lib/format";

export const metadata = { title: "My requests" };
export const dynamic = "force-dynamic";

export default async function RequestsPage({ searchParams }: { searchParams: { submitted?: string } }) {
  const user = await requireUser("/dashboard/requests");
  const nav = await userNav(user.id);

  const [requests, referrals] = await Promise.all([
    db.accommodationRequest.findMany({
      where: { applicantId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { listing: { select: { id: true, title: true, company: { select: { name: true } } } } },
    }),
    db.referral.findMany({
      where: { applicantEmail: user.email },
      orderBy: { updatedAt: "desc" },
      select: { id: true, reference: true, status: true, organisation: true, updatedAt: true },
    }),
  ]);

  return (
    <DashboardShell
      title="Requests and referrals"
      subtitle="Everything you've asked for, and where it's got to."
      nav={nav}
      active="/dashboard/requests"
    >
      {searchParams.submitted && (
        <div className="mb-5">
          <FormSuccess message="Request sent. The provider has been notified and will be in touch through messages." />
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          body="When you find somewhere suitable, send a request and you can follow its progress here."
          actionHref="/search"
          actionLabel="Search accommodation"
        />
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[18px]">
                    <Link href={`/listings/${request.listing.id}`} className="hover:text-pine-dark">
                      {request.listing.title}
                    </Link>
                  </h2>
                  <p className="mt-0.5 text-[14px] text-ink-soft">
                    {request.listing.company.name} · requested {shortDate(request.createdAt)}
                  </p>
                </div>
                <Link href="/messages" className="btn-secondary">Message provider</Link>
              </div>

              <div className="mt-5">
                <PipelineTrail status={request.status} />
              </div>

              {request.statusNote && (
                <p className="mt-4 rounded-[10px] bg-paper-sunk px-4 py-3 text-[14px] text-ink-soft">
                  {request.statusNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {referrals.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[20px]">Referrals made for you</h2>
          <p className="mt-1 text-[14px] text-ink-soft">
            Submitted by a professional working with you. Only they and the provider can see the detail.
          </p>
          <div className="mt-4">
            <DataTable head={["Reference", "Referred by", "Status", "Updated"]}>
              {referrals.map((referral) => (
                <tr key={referral.id}>
                  <td className="px-4 py-3 font-medium">{referral.reference}</td>
                  <td className="px-4 py-3">{referral.organisation}</td>
                  <td className="px-4 py-3">{referral.status.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="px-4 py-3 text-ink-soft">{shortDate(referral.updatedAt)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
