import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { providerNav } from "../../nav";
import { supportLabel } from "@/lib/taxonomy";
import { ageFrom, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProviderClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { companyId } = await requireCompany();

  const share = await db.clientShare.findFirst({
    where: { clientId: id, companyId, revokedAt: null },
    include: {
      sharedBy: { select: { firstName: true, lastName: true, email: true } },
      // Deliberately not selecting the client's riskNotes — that field is the
      // referrer's own working notes, and sharing a profile is a promise it
      // stays that way.
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          phone: true,
          email: true,
          preferredLocation: true,
          accommodationNeeds: true,
          supportNeeds: true,
          supportTypes: true,
          status: true,
        },
      },
    },
  });
  if (!share) notFound();

  const nav = await providerNav(companyId);
  const { client } = share;

  return (
    <DashboardShell
      title={`${client.firstName} ${client.lastName}`}
      subtitle={`Shared by ${share.sharedBy.firstName} ${share.sharedBy.lastName} on ${shortDate(share.createdAt)}`}
      nav={nav}
      active="/provider/clients"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <h2 className="text-[18px]">Profile</h2>
          <dl className="mt-4 grid gap-4 text-[15px] sm:grid-cols-2">
            {client.dateOfBirth && (
              <div>
                <dt className="text-[13px] text-ink-faint">Age</dt>
                <dd>{ageFrom(client.dateOfBirth)}</dd>
              </div>
            )}
            {client.preferredLocation && (
              <div>
                <dt className="text-[13px] text-ink-faint">Preferred area</dt>
                <dd>{client.preferredLocation}</dd>
              </div>
            )}
          </dl>

          {client.supportTypes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {client.supportTypes.map((slug) => (
                <span key={slug} className="chip">{supportLabel(slug)}</span>
              ))}
            </div>
          )}

          {client.accommodationNeeds && (
            <div className="mt-5">
              <h3 className="text-[14px] font-medium text-ink-soft">Accommodation needs</h3>
              <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{client.accommodationNeeds}</p>
            </div>
          )}
          {client.supportNeeds && (
            <div className="mt-5">
              <h3 className="text-[14px] font-medium text-ink-soft">Support needs</h3>
              <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{client.supportNeeds}</p>
            </div>
          )}

          {share.note && (
            <div className="mt-5 rounded-[10px] bg-pine-light px-4 py-3">
              <h3 className="text-[13px] font-medium text-pine-dark">Note from the referrer</h3>
              <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-pine-dark">{share.note}</p>
            </div>
          )}
        </section>

        <aside className="card p-6">
          <h2 className="text-[16px]">Get in touch</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            This is a heads-up, not an application — there's no referral form filled in yet. If you
            have somewhere suitable, contact the referrer directly.
          </p>
          <dl className="mt-4 space-y-3 text-[14px]">
            <div>
              <dt className="text-[13px] text-ink-faint">Referrer</dt>
              <dd>{share.sharedBy.firstName} {share.sharedBy.lastName}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-faint">Email</dt>
              <dd>
                <a href={`mailto:${share.sharedBy.email}`} className="text-pine-dark hover:underline">
                  {share.sharedBy.email}
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-ink-faint">
            The referrer can revoke your access to this profile at any time.
          </p>
        </aside>
      </div>
    </DashboardShell>
  );
}
