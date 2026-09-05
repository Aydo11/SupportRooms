"use client";

import { useTransition } from "react";
import { toast } from "./toast";
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
  function changeStatus(next: "PAUSED" | "ACTIVE" | "ARCHIVED") {
    startTransition(async () => {
      const result = await setListingStatusAction(listingId, next);
      (result.ok ? toast.success : toast.error)(result.message);
    });
  }

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
<<<<<<< HEAD
            onClick={() => changeStatus("PAUSED")}
          >
=======
            onClick={() => startTransition(() => { void setListingStatusAction(listingId, "PAUSED"); })}          >
>>>>>>> ced82d263f2d2ad75e5a413d2e030103c7128483
            Pause advert
          </button>
        )}
        {status === "PAUSED" && (
          <button
            className="btn-primary"
            disabled={pending}
<<<<<<< HEAD
            onClick={() => changeStatus("ACTIVE")}
          >
=======
            onClick={() => startTransition(() => { void setListingStatusAction(listingId, "ACTIVE"); })}          >
>>>>>>> ced82d263f2d2ad75e5a413d2e030103c7128483
            Make live again
          </button>
        )}
        {status !== "ARCHIVED" && (
          <button
            className="btn-ghost"
            disabled={pending}
<<<<<<< HEAD
            onClick={() => changeStatus("ARCHIVED")}
          >
=======
            onClick={() => startTransition(() => { void setListingStatusAction(listingId, "ARCHIVED"); })}          >
>>>>>>> ced82d263f2d2ad75e5a413d2e030103c7128483
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
