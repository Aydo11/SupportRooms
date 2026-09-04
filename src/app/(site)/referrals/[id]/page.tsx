import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { PipelineTrail } from "@/components/pipeline";
import { WithdrawReferral } from "@/components/withdraw-referral";
import { referrerNav } from "../nav";
import { PIPELINE_LABELS, URGENCY_LABELS } from "@/lib/taxonomy";
import { ageFrom, shortDate, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReferralPage({ params }: { params: { id: string } }) {
  const user = await requireUser(`/referrals/${params.id}`);
  const referral = await db.referral.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { id: true, title: true, companyId: true, company: { select: { name: true, slug: true } } } },
      documents: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!referral) notFound();

  const isReferrer = referral.referrerId === user.id;
  const isProvider = referral.listing
    ? user.staffOf.some((s) => s.companyId === referral.listing!.companyId)
    : false;
  if (!isReferrer && !isProvider && user.role !== "ADMIN") notFound();

  const nav = await referrerNav(user.id);
  const open = !["MOVED_IN", "DECLINED", "WITHDRAWN"].includes(referral.status);

  return (
    <DashboardShell
      title={`${referral.applicantFirstName} ${referral.applicantLastName}`}
      subtitle={`${referral.reference} · submitted ${shortDate(referral.createdAt)}`}
      nav={nav}
      active="/referrals"
      action={isReferrer && open ? <WithdrawReferral id={referral.id} /> : null}
    >
      <div className="card p-5">
        <h2 className="text-[18px]">Where it&apos;s got to</h2>
        <div className="mt-3">
          <PipelineTrail status={referral.status} />
        </div>
        {referral.statusNote && (
          <p className="mt-4 rounded-[10px] bg-paper-sunk px-4 py-3 text-[14px] text-ink-soft">
            {referral.statusNote}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card p-5">
          <h2 className="text-[18px]">Referral detail</h2>
          <dl className="mt-4 space-y-4 text-[15px]">
            {referral.applicantDob && (
              <div>
                <dt className="text-[13px] text-ink-faint">Age</dt>
                <dd>{ageFrom(referral.applicantDob)}</dd>
              </div>
            )}
            {referral.preferredLocation && (
              <div>
                <dt className="text-[13px] text-ink-faint">Preferred area</dt>
                <dd>{referral.preferredLocation}</dd>
              </div>
            )}
            <div>
              <dt className="text-[13px] text-ink-faint">Urgency</dt>
              <dd>{URGENCY_LABELS[referral.urgency]}</dd>
            </div>
            {referral.accommodationNeeds && (
              <div>
                <dt className="text-[13px] text-ink-faint">Accommodation needs</dt>
                <dd className="whitespace-pre-line leading-relaxed">{referral.accommodationNeeds}</dd>
              </div>
            )}
            {referral.supportNeeds && (
              <div>
                <dt className="text-[13px] text-ink-faint">Support needs</dt>
                <dd className="whitespace-pre-line leading-relaxed">{referral.supportNeeds}</dd>
              </div>
            )}
            {referral.additionalInfo && (
              <div>
                <dt className="text-[13px] text-ink-faint">Anything else</dt>
                <dd className="whitespace-pre-line leading-relaxed">{referral.additionalInfo}</dd>
              </div>
            )}
          </dl>

          {referral.documents.length > 0 && (
            <>
              <h3 className="mt-6 text-[16px]">Documents</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {referral.documents.map((document) => (
                  <li key={document.id}>
                    <a href={`/api/documents/${document.id}`} className="chip hover:bg-paper-sunk">
                      {document.name}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="space-y-6">
          {referral.listing && (
            <div className="card p-5">
              <h2 className="text-[16px]">Referred to</h2>
              <p className="mt-2 text-[15px]">
                <Link href={`/listings/${referral.listing.id}`} className="hover:text-pine-dark">
                  {referral.listing.title}
                </Link>
              </p>
              <p className="text-[14px] text-ink-soft">
                <Link href={`/companies/${referral.listing.company.slug}`} className="hover:underline">
                  {referral.listing.company.name}
                </Link>
              </p>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-[16px]">History</h2>
            <ol className="mt-3 space-y-3">
              {referral.events.map((event) => (
                <li key={event.id}>
                  <p className="text-[14px]">{PIPELINE_LABELS[event.status]}</p>
                  {event.note && <p className="text-[13px] text-ink-soft">{event.note}</p>}
                  <p className="text-[12px] text-ink-faint">{timeAgo(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
