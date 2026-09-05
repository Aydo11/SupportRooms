"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { startConversationAction } from "@/server/actions/engagement";
import { FormError, SubmitButton } from "./ui";

export function MessageProviderForm({
  listingId,
  lookingForAdId,
  signedIn,
  companyName,
}: {
  listingId?: string;
  lookingForAdId?: string;
  signedIn: boolean;
  companyName?: string;
}) {
  const [state, action] = useFormState(startConversationAction, { ok: false });

  if (!signedIn) {
    return (
      <div className="card p-5">
        <h2 className="text-[17px]">Message {companyName ?? "them"}</h2>
        <p className="mt-1.5 text-[14px] text-ink-soft">
          Sign in to start a conversation. Your details stay private until you share them.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(listingId ? `/listings/${listingId}` : `/people/${lookingForAdId}`)}`}
          className="btn-primary mt-4 w-full"
        >
          Sign in to message
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-3 p-5">
      <h2 className="text-[17px]">Send a message</h2>
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      {lookingForAdId && <input type="hidden" name="lookingForAdId" value={lookingForAdId} />}
      <FormError message={state.errors?.form ?? state.errors?.body} />
      <textarea
        name="body"
        rows={4}
        required
        className="field"
        placeholder="Hi — is the room still available, and do you accept referrals from the local authority?"
      />
      <SubmitButton className="btn-primary w-full" pendingLabel="Sending…">Send message</SubmitButton>
    </form>
  );
}
