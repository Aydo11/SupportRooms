"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteListingAction, setListingStatusAction, submitListingAction } from "@/server/actions/listings";
import { toast } from "./toast";
import { ConfirmDialog } from "./confirm-dialog";

export function ListingRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function changeStatus(next: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DRAFT") {
    startTransition(async () => {
      const result = await setListingStatusAction(id, next);
      if (result?.message) (result.ok ? toast.success : toast.error)(result.message);
      router.refresh();
    });
  }

  function submit() {
    // submitListingAction redirects to the advert page on success, which
    // Next surfaces as a special thrown "error" the framework handles itself
    // — don't swallow it in a try/catch or the redirect silently breaks.
    startTransition(() => submitListingAction(id));
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteListingAction(id);
      setConfirmingDelete(false);
      if (result?.message) (result.ok ? toast.success : toast.error)(result.message);
      if (result?.ok) router.refresh();
    });
  }

  const canDelete = ["DRAFT", "REJECTED", "ARCHIVED"].includes(status);

  return (
    <div aria-label="Advert actions" aria-busy={pending} className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Link href={`/provider/adverts/${id}/edit`} className="btn-secondary">Edit advert</Link>
      <Link href={`/provider/adverts/${id}/media`} className="btn-secondary">Photos & video</Link>

      {(status === "DRAFT" || status === "REJECTED") && (
        <button className="btn-primary" disabled={pending} onClick={submit}>
          Submit for review
        </button>
      )}
      {status === "ACTIVE" && (
        <button className="btn-ghost" disabled={pending} onClick={() => changeStatus("PAUSED")}>
          Pause
        </button>
      )}
      {status === "PAUSED" && (
        <button className="btn-secondary" disabled={pending} onClick={() => changeStatus("ACTIVE")}>
          Make live
        </button>
      )}
      {status !== "ARCHIVED" && (
        <button className="btn-ghost text-clay-dark" disabled={pending} onClick={() => changeStatus("ARCHIVED")}>
          Archive
        </button>
      )}
      {status === "ARCHIVED" && (
        <button className="btn-secondary" disabled={pending} onClick={() => changeStatus("DRAFT")}>
          Restore to drafts
        </button>
      )}

      {canDelete && (
        <>
          <button
            className="btn-ghost text-clay-dark"
            disabled={pending}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete
          </button>
          <ConfirmDialog
            open={confirmingDelete}
            title="Delete this advert?"
            body="This removes the advert, its rooms and its photos for good. Requests and referrals already made against it are kept, but lose their link to it. This can't be undone."
            confirmLabel="Delete advert"
            danger
            pending={pending}
            onConfirm={remove}
            onCancel={() => setConfirmingDelete(false)}
          />
        </>
      )}
    </div>
  );
}
