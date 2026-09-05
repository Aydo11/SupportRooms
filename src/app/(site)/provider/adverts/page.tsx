import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/rbac";
import { planLimits } from "@/lib/billing";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { FeaturedBadge, RoomStrip, StatusPill } from "@/components/badges";
import { ListingRowActions } from "@/components/listing-row-actions";
import { providerNav } from "../nav";
import { LISTING_STATUSES } from "@/lib/taxonomy";
import { rentRange, timeAgo } from "@/lib/format";

export const metadata = { title: "My adverts" };
export const dynamic = "force-dynamic";

export default async function ProviderAdvertsPage() {
  const { companyId } = await requireCompany();
  const [nav, limits, listings] = await Promise.all([
    providerNav(companyId),
    planLimits(companyId),
    db.listing.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
      include: {
        rooms: { select: { status: true } },
        property: { select: { city: true, postcode: true } },
        media: { where: { type: "IMAGE" }, take: 1, orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
        _count: { select: { requests: true, referrals: true } },
      },
    }),
  ]);

  return (
    <DashboardShell
      title="My adverts"
      subtitle={
        limits.membership.maxListings === -1
          ? "Unlimited adverts on your plan."
          : `${limits.used.listings} of ${limits.membership.maxListings} adverts used on the ${limits.membership.name} plan.`
      }
      nav={nav}
      active="/provider/adverts"
      action={
        limits.canAddListing ? (
          <Link href="/provider/adverts/new" className="btn-primary">Post an advert</Link>
        ) : (
          <Link href="/provider/membership" className="btn-secondary">Upgrade to post more</Link>
        )
      }
    >
      {listings.length === 0 ? (
        <EmptyState
          title="No adverts yet"
          body="Post your first advert and it goes to our team for review, usually within a working day."
          actionHref="/provider/adverts/new"
          actionLabel="Post an advert"
        />
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => (
            <li key={listing.id} className="card flex flex-wrap gap-5 p-4">
              <div className="h-24 w-32 shrink-0 overflow-hidden rounded-[10px] bg-paper-sunk">
                {listing.media[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.media[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-[12px] text-ink-faint">No photo</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/provider/adverts/${listing.id}`} className="text-[17px] hover:text-pine-dark">
                    {listing.title}
                  </Link>
                  <StatusPill
                    status={LISTING_STATUSES[listing.status]}
                    tone={listing.status === "ACTIVE" ? "good" : listing.status === "PENDING_REVIEW" ? "warn" : "muted"}
                  />
                  {listing.featured && <FeaturedBadge />}
                </div>
                <p className="mt-1 text-[14px] text-ink-soft">
                  {listing.property.city} · {rentRange(listing.weeklyRentFrom, listing.weeklyRentTo)}
                </p>
                <p className="mt-1 text-[13px] text-ink-faint">
                  {listing.reference} · {listing.views} views · {listing._count.requests} requests ·{" "}
                  {listing._count.referrals} referrals · updated {timeAgo(listing.updatedAt)}
                </p>
                <div className="mt-3">
                  <RoomStrip rooms={listing.rooms} showLabels />
                </div>
                {listing.status === "REJECTED" && listing.rejectionNote && (
                  <p className="mt-3 rounded-[10px] bg-clay-light px-3 py-2 text-[13px] text-clay-dark">
                    Not approved: {listing.rejectionNote}
                  </p>
                )}
              </div>

              <ListingRowActions id={listing.id} status={listing.status} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
