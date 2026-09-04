"use client";

import { useFormState } from "react-dom";
import { createReferralAction } from "@/server/actions/referrals";
import { CheckGroup, Field, FormError, SubmitButton } from "./ui";
import { SUPPORT_TYPES, URGENCY_LABELS } from "@/lib/taxonomy";

export function ReferralForm({
  listingId,
  defaults,
}: {
  listingId?: string;
  defaults?: { organisation?: string };
}) {
  const [state, action] = useFormState(createReferralAction, { ok: false });

  return (
    <form action={action} className="space-y-6">
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      <FormError message={state.errors?.form} />

      <section className="card space-y-4 p-6">
        <h2 className="text-[20px]">About the person you&apos;re referring</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="applicantFirstName" error={state.errors?.applicantFirstName}>
            <input id="applicantFirstName" name="applicantFirstName" className="field" />
          </Field>
          <Field label="Last name" name="applicantLastName" error={state.errors?.applicantLastName}>
            <input id="applicantLastName" name="applicantLastName" className="field" />
          </Field>
          <Field label="Date of birth" name="applicantDob">
            <input id="applicantDob" name="applicantDob" type="date" className="field" />
          </Field>
          <Field label="Contact phone" name="applicantPhone">
            <input id="applicantPhone" name="applicantPhone" className="field" />
          </Field>
          <Field label="Contact email" name="applicantEmail" hint="If they have one — it links the referral to their account.">
            <input id="applicantEmail" name="applicantEmail" type="email" className="field" />
          </Field>
          <Field label="Preferred area" name="preferredLocation">
            <input id="preferredLocation" name="preferredLocation" className="field" />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-[20px]">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your organisation" name="organisation" error={state.errors?.organisation}>
            <input id="organisation" name="organisation" defaultValue={defaults?.organisation} className="field" />
          </Field>
          <Field label="Your job title" name="referrerJobTitle">
            <input id="referrerJobTitle" name="referrerJobTitle" className="field" />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-[20px]">Needs</h2>
        <Field label="Support categories" name="supportTypes">
          <CheckGroup
            name="supportTypes"
            selected={[]}
            options={SUPPORT_TYPES.map((t) => ({ value: t.slug, label: t.label }))}
            columns={3}
          />
        </Field>
        <Field label="Accommodation needs" name="accommodationNeeds">
          <textarea id="accommodationNeeds" name="accommodationNeeds" rows={4} className="field" />
        </Field>
        <Field label="Support needs" name="supportNeeds">
          <textarea id="supportNeeds" name="supportNeeds" rows={5} className="field" />
        </Field>
        <Field label="How urgent is this" name="urgency">
          <select id="urgency" name="urgency" defaultValue="MEDIUM" className="field">
            {Object.entries(URGENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Anything else the provider should know" name="additionalInfo">
          <textarea id="additionalInfo" name="additionalInfo" rows={4} className="field" />
        </Field>
        <Field
          label="Supporting documents"
          name="documents"
          hint="Assessments, risk assessments, support plans. Stored privately and only shown to the provider you refer to."
          error={state.errors?.documents}
        >
          <input id="documents" name="documents" type="file" multiple accept="application/pdf,image/*" className="field" />
        </Field>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-[20px]">Consent</h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          You must have the person&apos;s informed consent to share this information, or another
          lawful basis for doing so. Only the receiving provider and our admin team can see it.
        </p>
        <label className="flex items-start gap-3 text-[15px]">
          <input type="checkbox" name="consent" className="mt-1 h-4 w-4" />
          <span>I confirm I have consent, or another lawful basis, to share these details.</span>
        </label>
        {state.errors?.consent && <p className="text-[14px] text-clay-dark">{state.errors.consent}</p>}
      </section>

      <SubmitButton pendingLabel="Sending…">Send referral</SubmitButton>
    </form>
  );
}
