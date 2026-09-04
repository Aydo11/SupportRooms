import Link from "next/link";
import { FeaturedBadge, MatchScore, RoomStrip, VerifiedBadge } from "./badges";
import { monthYear, publicLocation, rentRange } from "@/lib/format";
import { supportLabel, ACCOMMODATION_TYPES } from "@/lib/taxonomy";
import type { SearchResult } from "@/server/search";

export function ListingCard({
  listing,
  match,
  compact = false,
  sponsored = false,
  distance,
}: {
  listing: SearchResult;
  match?: number;
  compact?: boolean;
  /** Paid placement. Always labelled, never mixed silently into organic results. */
  sponsored?: boolean;
  distance?: number | null;
}) {
  const image = listing.media[0]?.url;
  const href = sponsored ? `/listings/${listing.id}?ref=sponsored` : `/listings/${listing.id}`;
  const available = listing.rooms.filter((r) => r.status === "AVAILABLE").length;

  return (
    <article className="card interactive-card group overflow-hidden">
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] bg-paper-sunk">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-ink-faint">
              No photo yet
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {(sponsored || listing.featured) && <FeaturedBadge />}
            {available > 0 && (
              <span className="rounded-pill bg-white/95 px-2.5 py-1 text-[12px] font-medium text-pine-dark">
                {available} room{available === 1 ? "" : "s"} available
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[17px]">
              <Link href={href} className="hover:text-pine-dark">{listing.title}</Link>
            </h3>
            <p className="mt-0.5 truncate text-[14px] text-ink-soft">
              {publicLocation(listing.property)}
              {typeof distance === "number" && (
                <span className="text-ink-faint"> · {distance < 1 ? "under a mile" : `${distance.toFixed(1)} miles`}</span>
              )}
            </p>
          </div>
          {match !== undefined && <MatchScore score={match} />}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-[14px]">
          <div className="flex gap-1.5">
            <dt className="text-ink-faint">Type</dt>
            <dd>{ACCOMMODATION_TYPES[listing.accommodationType]}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-ink-faint">From</dt>
            <dd>{monthYear(listing.availableFrom)}</dd>
          </div>
        </dl>

        {!compact && (
          <p className="mt-3 flex flex-wrap gap-1.5">
            {listing.supportTypes.slice(0, 3).map((slug) => (
              <span key={slug} className="chip">{supportLabel(slug)}</span>
            ))}
            {listing.supportTypes.length > 3 && (
              <span className="chip">+{listing.supportTypes.length - 3}</span>
            )}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <RoomStrip rooms={listing.rooms} />
          <span className="text-[15px] font-medium">{rentRange(listing.weeklyRentFrom, listing.weeklyRentTo)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="truncate text-[13px] text-ink-faint">{listing.company.name}</span>
          {listing.company.verification === "APPROVED" && <VerifiedBadge />}
        </div>
      </div>
    </article>
  );
}
