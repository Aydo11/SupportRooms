"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
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

export function ReportForm({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createReportAction, { ok: false });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[13px] text-ink-faint underline hover:text-ink">
        Report this advert
      </button>
    );
  }

  return (
    <form action={action} className="card space-y-3 p-4">
      <h3 className="text-[16px]">Report this advert</h3>
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <FormError message={state.errors?.form} />
      <FormSuccess message={state.message} />
      <select name="reason" className="field" aria-label="Reason">
        {REASONS.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <textarea name="detail" rows={3} className="field" placeholder="What's wrong? (optional)" />
      <div className="flex gap-2">
        <SubmitButton pendingLabel="Sending…">Send report</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
