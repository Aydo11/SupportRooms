"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveListingAction,
  archiveReportAction,
  rejectListingAction,
  resolveReportAction,
  reviewVerificationAction,
  setCompanyStatusAction,
  setUserStatusAction,
  toggleFeaturedAction,
} from "@/server/actions/admin";
import type { ReportStatus } from "@prisma/client";
import type { VerificationChecks } from "@/lib/verification";

export function ListingModeration({
  id,
  status,
  featured,
}: {
  id: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) => startTransition(async () => { await fn(); router.refresh(); });

  return (
    <div className="w-full shrink-0 sm:w-[260px]">
      {status === "PENDING_REVIEW" && !rejecting && (
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={pending} onClick={() => run(() => approveListingAction(id))}>
            Approve
          </button>
          <button className="btn-ghost text-clay-dark" onClick={() => setRejecting(true)}>
            Needs changes
          </button>
        </div>
      )}

      {rejecting && (
        <div className="space-y-2">
          <label className="sr-only" htmlFor={`note-${id}`}>Reason</label>
          <textarea
            id={`note-${id}`}
            rows={3}
            className="field"
            placeholder="What needs to change? This is sent to the provider."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="btn-danger"
              disabled={pending || note.trim().length < 4}
              onClick={() => run(() => rejectListingAction(id, note.trim()))}
            >
              Send back
            </button>
            <button className="btn-ghost" onClick={() => setRejecting(false)}>Cancel</button>
          </div>
        </div>
      )}

      {status === "ACTIVE" && (
        <button
          className="btn-secondary"
          disabled={pending}
          onClick={() => run(() => toggleFeaturedAction(id, !featured))}
        >
          {featured ? "Remove promotion" : "Promote for 30 days"}
        </button>
      )}
    </div>
  );
}

export function VerificationDecision({ id, requiredDocumentsPresent }: { id: string; requiredDocumentsPresent: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState<VerificationChecks>({ register: false, insurance: false, governance: false, safeguarding: false, identity: false });
  const [pending, startTransition] = useTransition();
  const allChecked = requiredDocumentsPresent && Object.values(checks).every(Boolean);
  const run = (approve: boolean) =>
    startTransition(async () => {
      await reviewVerificationAction(id, approve, note.trim() || undefined, checks);
      router.refresh();
    });

  return (
    <div className="space-y-2">
      <fieldset className="space-y-2 rounded-[10px] border border-line bg-paper p-3">
        <legend className="px-1 text-[13px] font-semibold text-ink">Reviewer checks</legend>
        {([
          ["register", "Registration and Companies House or charity record match"],
          ["insurance", "Insurance is valid and appropriate"],
          ["governance", "Governance and accountable roles are clear"],
          ["safeguarding", "Safeguarding policy and escalation route reviewed"],
          ["identity", "Submitting organisation and contact identity are consistent"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-start gap-2 text-[12px] leading-snug text-ink-soft">
            <input type="checkbox" checked={checks[key]} onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-pine" />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      {!requiredDocumentsPresent && <p className="text-[12px] text-clay-dark">Required evidence is missing. Reject and request a complete pack.</p>}
      <label className="sr-only" htmlFor={`vnote-${id}`}>Note</label>
      <input
        id={`vnote-${id}`}
        className="field"
        placeholder="Note to the provider (optional)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn-primary" disabled={pending || !allChecked} onClick={() => run(true)}>Approve verification</button>
        <button className="btn-ghost text-clay-dark" disabled={pending} onClick={() => run(false)}>Reject</button>
      </div>
    </div>
  );
}

export function AccountToggle({
  kind,
  id,
  status,
}: {
  kind: "user" | "company";
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

  return (
    <button
      className={next === "SUSPENDED" ? "btn-ghost text-clay-dark" : "btn-secondary"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (kind === "user") await setUserStatusAction(id, next);
          else await setCompanyStatusAction(id, next);
          router.refresh();
        })
      }
    >
      {next === "SUSPENDED" ? "Suspend" : "Reinstate"}
    </button>
  );
}

export function ReportDecision({ id, initialResolution = "", archived = false }: { id: string; initialResolution?: string; archived?: boolean }) {
  const router = useRouter();
  const [resolution, setResolution] = useState(initialResolution);
  const [pending, startTransition] = useTransition();
  const run = (status: ReportStatus) =>
    startTransition(async () => {
      await resolveReportAction(id, status, resolution.trim() || undefined);
      router.refresh();
    });

  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor={`rnote-${id}`}>Resolution</label>
      <input
        id={`rnote-${id}`}
        className="field"
        placeholder="What did you do about it?"
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={pending} onClick={() => run("REVIEWING")}>Reviewing</button>
        <button className="btn-primary" disabled={pending} onClick={() => run("ACTIONED")}>Actioned</button>
        <button className="btn-ghost" disabled={pending} onClick={() => run("DISMISSED")}>Dismiss</button>
        <button className="btn-ghost text-clay-dark" disabled={pending} onClick={() => startTransition(async () => {
          await archiveReportAction(id, !archived);
          router.refresh();
        })}>{archived ? "Restore from archive" : "Archive case"}</button>
      </div>
    </div>
  );
}
