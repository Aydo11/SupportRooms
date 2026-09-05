"use client";

import { useActionState } from "react";
import { saveClientAction } from "@/server/actions/clients";
import { CheckGroup, Field, FormError, FormSuccess, SubmitButton } from "./ui";
import { SUPPORT_TYPES } from "@/lib/taxonomy";

export type ClientDefaults = Partial<{
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  preferredLocation: string;
  accommodationNeeds: string;
  supportNeeds: string;
  supportTypes: string[];
  riskNotes: string;
  status: string;
}>;

export function ClientForm({ defaults = {} }: { defaults?: ClientDefaults }) {
  const [state, action] = useActionState(saveClientAction, { ok: false });
  const editing = Boolean(defaults.id);

  return (
    <form action={action} className="space-y-6">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <FormError message={state.errors?.form} />
      <FormSuccess message={state.ok ? state.message : undefined} />

      <section className="card space-y-4 p-6">
        <h2 className="text-[20px]">Who they are</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="firstName" required error={state.errors?.firstName}>
            <input id="firstName" name="firstName" defaultValue={defaults.firstName} className="field" required />
          </Field>
          <Field label="Last name" name="lastName" required error={state.errors?.lastName}>
            <input id="lastName" name="lastName" defaultValue={defaults.lastName} className="field" required />
          </Field>
          <Field label="Date of birth" name="dateOfBirth">
            <input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaults.dateOfBirth} className="field" />
          </Field>
          <Field label="Status" name="status">
            <select id="status" name="status" defaultValue={defaults.status ?? "ACTIVE"} className="field">
              <option value="ACTIVE">Active — being supported</option>
              <option value="PLACED">Placed — successfully housed</option>
              <option value="ARCHIVED">Archived — no longer supporting</option>
            </select>
          </Field>
          <Field label="Phone" name="phone">
            <input id="phone" name="phone" defaultValue={defaults.phone} className="field" />
          </Field>
          <Field label="Email" name="email" error={state.errors?.email}>
            <input id="email" name="email" type="email" defaultValue={defaults.email} className="field" />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-[20px]">What they need</h2>
        <Field label="Preferred area" name="preferredLocation">
          <input id="preferredLocation" name="preferredLocation" defaultValue={defaults.preferredLocation} className="field" />
        </Field>
        <Field label="Accommodation needs" name="accommodationNeeds">
          <textarea id="accommodationNeeds" name="accommodationNeeds" rows={4} defaultValue={defaults.accommodationNeeds} className="field" />
        </Field>
        <Field label="Support needs" name="supportNeeds">
          <textarea id="supportNeeds" name="supportNeeds" rows={5} defaultValue={defaults.supportNeeds} className="field" />
        </Field>
        <Field label="Support categories" name="supportTypes">
          <CheckGroup
            name="supportTypes"
            selected={defaults.supportTypes ?? []}
            options={SUPPORT_TYPES.map((t) => ({ value: t.slug, label: t.label }))}
            columns={3}
          />
        </Field>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-[20px]">Private notes</h2>
        <p className="text-[14px] text-ink-soft">
          Visible only to you, never shared with a provider — even if you share this profile.
        </p>
        <Field label="Risk or safeguarding notes" name="riskNotes">
          <textarea id="riskNotes" name="riskNotes" rows={3} defaultValue={defaults.riskNotes} className="field" />
        </Field>
      </section>

      <SubmitButton pendingLabel="Saving…">{editing ? "Save changes" : "Add client"}</SubmitButton>
    </form>
  );
}
