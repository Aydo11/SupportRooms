"use client";

import { useFormState } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginAction, registerAction } from "@/server/actions/auth";
import { Field, FormError, SubmitButton } from "./ui";
import { ORG_TYPES } from "@/lib/taxonomy";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useFormState(loginAction, { ok: false });

  return (
    <form action={action} className="mt-7 space-y-4">
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <FormError message={state.errors?.form} />
      <Field label="Email" name="email" error={state.errors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      <Field label="Password" name="password" error={state.errors?.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </Field>
      <SubmitButton className="btn-primary w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

const ACCOUNT_TYPES = [
  {
    value: "USER",
    title: "I'm looking for accommodation",
    body: "Search rooms, message providers and post what you need.",
  },
  {
    value: "PROVIDER",
    title: "I'm advertising accommodation",
    body: "List rooms, manage availability, receive requests and referrals.",
  },
  {
    value: "REFERRER",
    title: "I'm a professional referrer",
    body: "Refer people you support and track referrals to move-in.",
  },
] as const;

export function RegisterForm() {
  const params = useSearchParams();
  const initial = (params.get("type") as "USER" | "PROVIDER" | "REFERRER" | null) ?? "USER";
  const [type, setType] = useState<"USER" | "PROVIDER" | "REFERRER">(initial);
  const [state, action] = useFormState(registerAction, { ok: false });

  return (
    <form action={action} className="mt-8 space-y-6">
      <fieldset>
        <legend className="label">What kind of account do you need?</legend>
        <div className="grid gap-2.5">
          {ACCOUNT_TYPES.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-card border p-4 ${
                type === option.value ? "border-pine bg-pine-light/40" : "border-line bg-white hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="accountType"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="mt-1 h-4 w-4 border-line-strong text-pine focus:ring-pine"
              />
              <span>
                <span className="block text-[16px] text-ink">{option.title}</span>
                <span className="mt-0.5 block text-[14px] text-ink-soft">{option.body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormError message={state.errors?.form} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" required error={state.errors?.firstName}>
          <input id="firstName" name="firstName" required autoComplete="given-name" className="field" />
        </Field>
        <Field label="Last name" name="lastName" required error={state.errors?.lastName}>
          <input id="lastName" name="lastName" required autoComplete="family-name" className="field" />
        </Field>
        <Field label="Email" name="email" required error={state.errors?.email}>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </Field>
        <Field label="Mobile number" name="phone" hint="Optional" error={state.errors?.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" />
        </Field>
        <Field
          label="Password"
          name="password"
          required
          hint="At least 10 characters, with a number."
          error={state.errors?.password}
        >
          <input id="password" name="password" type="password" required autoComplete="new-password" className="field" />
        </Field>
        <Field label={type === "PROVIDER" ? "Your location" : "Where are you looking?"} name="locationLabel" error={state.errors?.locationLabel}>
          <input id="locationLabel" name="locationLabel" placeholder="Birmingham" className="field" />
        </Field>
      </div>

      {type === "USER" && (
        <Field label="Preferred way to be contacted" name="contactMethod">
          <select id="contactMethod" name="contactMethod" className="field">
            <option value="MESSAGE">Messages on the platform</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
          </select>
        </Field>
      )}

      {type === "PROVIDER" && (
        <div className="grid gap-4 rounded-card border border-line bg-white p-5 sm:grid-cols-2">
          <h2 className="text-[18px] sm:col-span-2">Your organisation</h2>
          <Field label="Organisation name" name="companyName" required error={state.errors?.companyName}>
            <input id="companyName" name="companyName" className="field" />
          </Field>
          <Field label="Organisation type" name="orgType">
            <select id="orgType" name="orgType" className="field">
              {Object.entries(ORG_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Main operating town or city" name="companyCity">
            <input id="companyCity" name="companyCity" className="field" />
          </Field>
          <p className="text-[13px] leading-relaxed text-ink-faint sm:col-span-2">
            You&apos;ll add registration numbers, addresses and verification documents from your
            dashboard. Verification is reviewed manually by our team.
          </p>
        </div>
      )}

      {type === "REFERRER" && (
        <div className="grid gap-4 rounded-card border border-line bg-white p-5 sm:grid-cols-2">
          <h2 className="text-[18px] sm:col-span-2">Your organisation</h2>
          <Field label="Organisation" name="organisation" error={state.errors?.organisation}>
            <input id="organisation" name="organisation" placeholder="Birmingham City Council" className="field" />
          </Field>
          <Field label="Job title" name="jobTitle">
            <input id="jobTitle" name="jobTitle" placeholder="Housing support worker" className="field" />
          </Field>
        </div>
      )}

      <label className="flex items-start gap-3">
        <input type="checkbox" name="terms" className="mt-1 h-4 w-4 rounded border-line-strong text-pine focus:ring-pine" />
        <span className="text-[15px] leading-relaxed text-ink-soft">
          I agree to the terms of use and privacy notice.
        </span>
      </label>
      {state.errors?.terms && <p className="text-[13px] text-clay">{state.errors.terms}</p>}

      <SubmitButton className="btn-primary w-full" pendingLabel="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  );
}
