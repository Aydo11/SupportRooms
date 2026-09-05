"use client";
import { useActionState } from "react";

import { requestVerificationAction, updateCompanyAction } from "@/server/actions/company";
import { CheckGroup, Field, FormError, FormSuccess, SubmitButton } from "./ui";
import { ORG_TYPES, SUPPORT_TYPES } from "@/lib/taxonomy";

export function CompanyForm({
  company,
}: {
  company: {
    name: string;
    tradingName: string;
    registrationNumber: string;
    email: string;
    phone: string;
    website: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postcode: string;
    orgType: string;
    about: string;
    operatingAreas: string[];
    supportTypes: string[];
    logoUrl: string | null;
  };
}) {
  const [state, action] = useActionState(updateCompanyAction, { ok: false });

  return (
    <form action={action} className="card space-y-4 p-6">
      <FormError message={state.errors?.form} />
      <FormSuccess message={state.ok ? state.message : undefined} />

      <div className="flex items-center gap-4">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt="" className="h-16 w-16 rounded-[10px] object-contain" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-[10px] bg-paper-sunk text-[12px] text-ink-faint">
            No logo
          </span>
        )}
        <div className="flex-1">
          <Field label="Logo" name="logo" error={state.errors?.logo}>
            <input id="logo" name="logo" type="file" accept="image/*" className="field" />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organisation name" name="name" error={state.errors?.name}>
          <input id="name" name="name" defaultValue={company.name} className="field" />
        </Field>
        <Field label="Trading name" name="tradingName">
          <input id="tradingName" name="tradingName" defaultValue={company.tradingName} className="field" />
        </Field>
        <Field label="Organisation type" name="orgType">
          <select id="orgType" name="orgType" defaultValue={company.orgType} className="field">
            {Object.entries(ORG_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Company or charity number" name="registrationNumber">
          <input id="registrationNumber" name="registrationNumber" defaultValue={company.registrationNumber} className="field" />
        </Field>
        <Field label="Contact email" name="email" error={state.errors?.email}>
          <input id="email" name="email" type="email" defaultValue={company.email} className="field" />
        </Field>
        <Field label="Contact phone" name="phone">
          <input id="phone" name="phone" defaultValue={company.phone} className="field" />
        </Field>
        <Field label="Website" name="website">
          <input id="website" name="website" defaultValue={company.website} className="field" />
        </Field>
        <Field label="Areas you cover" name="operatingAreas" hint="Separate with commas.">
          <input id="operatingAreas" name="operatingAreas" defaultValue={company.operatingAreas.join(", ")} className="field" />
        </Field>
        <Field label="Address line 1" name="addressLine1">
          <input id="addressLine1" name="addressLine1" defaultValue={company.addressLine1} className="field" />
        </Field>
        <Field label="Address line 2" name="addressLine2">
          <input id="addressLine2" name="addressLine2" defaultValue={company.addressLine2} className="field" />
        </Field>
        <Field label="Town or city" name="city">
          <input id="city" name="city" defaultValue={company.city} className="field" />
        </Field>
        <Field label="Postcode" name="postcode">
          <input id="postcode" name="postcode" defaultValue={company.postcode} className="field" />
        </Field>
      </div>

      <Field label="About your organisation" name="about">
        <textarea id="about" name="about" rows={6} defaultValue={company.about} className="field" />
      </Field>

      <Field label="Support you provide" name="supportTypes">
        <CheckGroup
          name="supportTypes"
          selected={company.supportTypes}
          options={SUPPORT_TYPES.map((t) => ({ value: t.slug, label: t.label }))}
          columns={3}
        />
      </Field>

      <SubmitButton pendingLabel="Saving…">Save company profile</SubmitButton>
    </form>
  );
}

export function VerificationForm() {
  const [state, action] = useActionState(requestVerificationAction, { ok: false });

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.errors?.form} />
      <FormSuccess message={state.ok ? state.message : undefined} />

      <Field
        label="Documents"
        name="documents"
        hint="Proof of your organisation — for example a company registration, insurance certificate or headed letter. PDF, JPG or PNG."
        error={state.errors?.documents}
      >
        <input id="documents" name="documents" type="file" multiple accept="application/pdf,image/*" className="field" />
      </Field>

      <Field label="Anything we should know" name="note">
        <textarea id="note" name="note" rows={3} className="field" />
      </Field>

      <SubmitButton pendingLabel="Sending…">Send for verification</SubmitButton>
    </form>
  );
}
