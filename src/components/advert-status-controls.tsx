"use client";

import { useTransition } from "react";
import { setListingStatusAction, submitListingAction } from "@/server/actions/listings";

export function AdvertStatusControls({
  listingId,
  status,
  mediaCount,
}: {
  listingId: string;
  status: string;
  mediaCount: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <h2 className="text-[18px]">
          {status === "DRAFT" || status === "REJECTED"
            ? "Not visible to anyone yet"
            : status === "PENDING_REVIEW"
              ? "With our review team"
              : status === "ACTIVE"
                ? "Live on the site"
                : status === "PAUSED"
                  ? "Paused"
                  : "Archived"}
        </h2>
        <p className="mt-1 max-w-[60ch] text-[14px] text-ink-soft">
          {mediaCount === 0
            ? "Adverts with photos get far more enquiries. Add at least one before submitting."
            : "Pausing hides the advert without deleting anything — you can bring it back any time."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(status === "DRAFT" || status === "REJECTED") && (
          <button
            className="btn-primary"
            disabled={pending}
            onClick={() => startTransition(() => { void submitListingAction(listingId); })}          >
            Submit for review
          </button>
        )}
        {status === "ACTIVE" && (
          <button
            className="btn-secondary"
            disabled={pending}
            onClick={() => startTransition(() => { void setListingStatusAction(listingId, "PAUSED"); })}          >
            Pause advert
          </button>
        )}
        {status === "PAUSED" && (
          <button
            className="btn-primary"
            disabled={pending}
            onClick={() => startTransition(() => { void setListingStatusAction(listingId, "ACTIVE"); })}          >
            Make live again
          </button>
        )}
        {status !== "ARCHIVED" && (
          <button
            className="btn-ghost"
            disabled={pending}
            onClick={() => startTransition(() => { void setListingStatusAction(listingId, "ARCHIVED"); })}          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
