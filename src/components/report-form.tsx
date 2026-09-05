"use client";

import { useEffect, useState, useActionState } from "react";
import { createReportAction } from "@/server/actions/engagement";
import { FormError, FormSuccess, SubmitButton } from "./ui";

const REASONS = [
  ["SCAM", "Scam or fraud"],
  ["INCORRECT_INFORMATION", "Incorrect information"],
  ["UNSAFE_ACCOMMODATION", "Unsafe accommodation"],
  ["INAPPROPRIATE_CONTENT", "Inappropriate content"],
  ["MISLEADING_INFORMATION", "Misleading information"],
  ["OTHER", "Something else"],
] as const;

export function ReportForm({
  targetType,
  targetId,
  label = "Report this advert",
  title = "Report this advert",
  onDone,
}: {
  targetType: string;
  targetId: string;
  /** Trigger button text, shown before the form is opened. */
  label?: string;
  /** Form heading, once it's open. */
  title?: string;
  /** Called after a successful submission (with a short delay) or Cancel.
   * When omitted, the component manages its own open/closed state instead. */
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(Boolean(onDone));
  const [state, action] = useActionState(createReportAction, { ok: false });

  useEffect(() => {
    if (!state.ok || !onDone) return;
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [state.ok, onDone]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[13px] text-ink-faint underline hover:text-ink">
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="card animate-scale-in space-y-3 p-4">
      <h3 className="text-[16px]">{title}</h3>
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <FormError message={state.errors?.form} />
      <FormSuccess message={state.ok ? state.message : undefined} />
      {!state.ok && (
        <>
          <select name="reason" className="field" aria-label="Reason">
            {REASONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea name="detail" rows={3} className="field" placeholder="What's wrong? (optional)" />
          <div className="flex gap-2">
            <SubmitButton pendingLabel="Sending…">Send report</SubmitButton>
            <button
              type="button"
              onClick={() => (onDone ? onDone() : setOpen(false))}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </form>
  );
}
