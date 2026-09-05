"use client";

import { useState } from "react";
import { useActionState } from "react";
import { startDirectMessageAction } from "@/server/actions/engagement";
import { FormError, SubmitButton } from "./ui";

/**
* Sends a message to a provider (companyId) or a specific person
* (recipientUserId) without needing a public advert to hang it off — used
* wherever a referrer and a provider need to connect directly about a
* client or a referral. In `compact` mode it starts as a single button and
* only reveals the textarea once clicked, so it stays out of the way in a
* list of many cards.
*/
export function DirectMessageForm({
companyId,
recipientUserId,
subject,
label = "Send a message",
placeholder = "Write your message…",
compact = false,
}: {
companyId?: string;
recipientUserId?: string;
subject?: string;
label?: string;
placeholder?: string;
compact?: boolean;
}) {
const [open, setOpen] = useState(!compact);
const [state, action] = useActionState(startDirectMessageAction, { ok: false });

if (!open) {
return (
<button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
{label}
</button>
);
}

return (
<form action={action} className="space-y-2">
{companyId && <input type="hidden" name="companyId" value={companyId} />}
{recipientUserId && <input type="hidden" name="recipientUserId" value={recipientUserId} />}
{subject && <input type="hidden" name="subject" value={subject} />}
<FormError message={state.errors?.form ?? state.errors?.body} />
<textarea name="body" rows={compact ? 3 : 4} required className="field" placeholder={placeholder} />
<div className="flex gap-2">
<SubmitButton className="btn-primary" pendingLabel="Sending…">{label}</SubmitButton>
{compact && (
<button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
Cancel
</button>
)}
</div>
</form>
);
}
