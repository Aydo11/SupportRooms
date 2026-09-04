"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setListingStatusAction, submitListingAction } from "@/server/actions/listings";

export function ListingRowActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex w-full shrink-0 flex-wrap items-start gap-2 sm:w-auto sm:flex-col">
      <Link href={`/provider/adverts/${id}/edit`} className="btn-secondary">Edit</Link>
      <Link href={`/provider/adverts/${id}/media`} className="btn-ghost">Photos</Link>

      {(status === "DRAFT" || status === "REJECTED") && (
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() => startTransition(() => submitListingAction(id).catch(() => {}))}
        >
          Submit for review
        </button>
      )}
      {status === "ACTIVE" && (
        <button
          className="btn-ghost"
          disabled={pending}
          onClick={() => startTransition(() => setListingStatusAction(id, "PAUSED"))}
        >
          Pause
        </button>
      )}
      {status === "PAUSED" && (
        <button
          className="btn-secondary"
          disabled={pending}
          onClick={() => startTransition(() => setListingStatusAction(id, "ACTIVE"))}
        >
          Make live
        </button>
      )}
      {status !== "ARCHIVED" && (
        <button
          className="btn-ghost text-clay-dark"
          disabled={pending}
          onClick={() => startTransition(() => setListingStatusAction(id, "ARCHIVED"))}
        >
          Archive
        </button>
      )}
    </div>
  );
}
