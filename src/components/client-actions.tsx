"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveClientAction, deleteClientAction } from "@/server/actions/clients";
import { ConfirmDialog } from "./confirm-dialog";
import { toast } from "./toast";

export function ClientActions({ clientId, status }: { clientId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function setStatus(next: "ACTIVE" | "PLACED" | "ARCHIVED") {
    startTransition(async () => {
      await archiveClientAction(clientId, next);
      const labels: Record<string, string> = { ACTIVE: "Marked as active.", PLACED: "Marked as placed.", ARCHIVED: "Archived." };
      toast.success(labels[next]);
      router.refresh();
    });
  }

  return (
    <section className="card p-6">
      <h2 className="text-[18px]">Manage</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {status !== "ACTIVE" && (
          <button className="btn-secondary" disabled={pending} onClick={() => setStatus("ACTIVE")}>
            Mark as active
          </button>
        )}
        {status !== "PLACED" && (
          <button className="btn-secondary" disabled={pending} onClick={() => setStatus("PLACED")}>
            Mark as placed
          </button>
        )}
        {status !== "ARCHIVED" && (
          <button className="btn-ghost" disabled={pending} onClick={() => setStatus("ARCHIVED")}>
            Archive
          </button>
        )}
        <button className="btn-ghost text-clay-dark" disabled={pending} onClick={() => setConfirmingDelete(true)}>
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this client?"
        body="This removes their profile and any active shares. Referrals you've already made from it keep their own copy of the details, so nothing sent to a provider disappears. This can't be undone."
        confirmLabel="Delete client"
        danger
        pending={pending}
        onConfirm={() => startTransition(() => deleteClientAction(clientId))}
        onCancel={() => setConfirmingDelete(false)}
      />
    </section>
  );
}
