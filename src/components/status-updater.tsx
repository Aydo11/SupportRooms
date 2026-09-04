"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRequestStatusAction } from "@/server/actions/engagement";
import { updateReferralStatusAction } from "@/server/actions/referrals";
import type { ReferralStatus, RequestStatus } from "@prisma/client";

export function StatusUpdater({
  kind,
  id,
  current,
  note,
  options,
}: {
  kind: "request" | "referral";
  id: string;
  current: string;
  note?: string | null;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [message, setMessage] = useState(note ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
      <div>
        <label htmlFor={`status-${id}`} className="mb-1 block text-[13px] text-ink-faint">Status</label>
        <select
          id={`status-${id}`}
          className="field"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`note-${id}`} className="mb-1 block text-[13px] text-ink-faint">
          Note to the applicant
        </label>
        <input
          id={`note-${id}`}
          className="field"
          value={message}
          placeholder="Optional — this is shared with them"
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (kind === "request") {
              await updateRequestStatusAction(id, status as RequestStatus, message || undefined);
            } else {
              await updateReferralStatusAction(id, status as ReferralStatus, message || undefined);
            }
            router.refresh();
          })
        }
      >
        {pending ? "Saving…" : "Update"}
      </button>
    </div>
  );
}
