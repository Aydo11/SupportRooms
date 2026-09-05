"use client";
import { useActionState } from "react";

import Link from "next/link";
import { saveLookingForAction } from "@/server/actions/lookingFor";
import { CheckGroup, Field, FormError, SubmitButton } from "./ui";
import { ACCOMMODATION_TYPES, GENDER_ARRANGEMENTS, SUPPORT_TYPES } from "@/lib/taxonomy";

type Ad = {
  id: string;
  title: string;
  city: string;
  postcode: string;
  radiusMiles: number;
  accommodationTypes: string[];
  supportTypes: string[];
  moveInDate: string;
  budgetWeekly: string;
  genderArrangement: string;
  age: string;
  accessibilityNeeds: string;
  about: string;
  lookingFor: string;
  videoUrl: string;
};

export function LookingForForm({ ad, discoverable }: { ad: Ad | null; discoverable: boolean }) {
  const [state, action] = useActionState(saveLookingForAction, { ok: false });

  return (
    <form action={action} className="space-y-8">
      {ad && <input type="hidden" name="id" value={ad.id} />}
      <FormError message={state.errors?.form} />

      {!discoverable && (
        <div className="rounded-[10px] border border-clay/30 bg-clay-light px-4 py-3 text-[14px] text-clay">
          Your advert will be published, but providers can only find you in their people search once
          you switch on &ldquo;discoverable&rdquo; in{" "}
          <Link href="/dashboard/profile" className="underline">your profile</Link>.
        </div>
      )}

      <Section title="What you're looking for">
        <Field label="Advert title" name="title" required error={state.errors?.title}>
          <input
            id="title"
            name="title"
            required
            defaultValue={ad?.title}
            placeholder="Looking for an HMO, supported housing or a self-contained home in Birmingham"
            className="field"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Town or city" name="city" required error={state.errors?.city}>
            <input id="city" name="city" required defaultValue={ad?.city} className="field" />
          </Field>
          <Field label="Postcode" name="postcode" hint="Optional">
            <input id="postcode" name="postcode" defaultValue={ad?.postcode} className="field" />
          </Field>
          <Field label="Distance (miles)" name="radiusMiles">
            <input id="radiusMiles" name="radiusMiles" type="number" min={0} max={100} defaultValue={ad?.radiusMiles ?? 10} className="field" />
          </Field>
        </div>

        <Field label="Type of accommodation" name="accommodationTypes">
          <CheckGroup
            name="accommodationTypes"
            selected={ad?.accommodationTypes}
            options={Object.entries(ACCOMMODATION_TYPES).map(([value, label]) => ({ value, label }))}
            columns={3}
          />
        </Field>
      </Section>

      <Section title="Support you need">
        <Field label="Support categories" name="supportTypes" error={state.errors?.supportTypes}>
          <CheckGroup
            name="supportTypes"
            selected={ad?.supportTypes}
            options={SUPPORT_TYPES.map((type) => ({ value: type.slug, label: type.label }))}
            columns={3}
          />
        </Field>
        <Field label="Access needs" name="accessibilityNeeds" hint="Step-free access, ground floor, adapted bathroom, and so on.">
          <input id="accessibilityNeeds" name="accessibilityNeeds" defaultValue={ad?.accessibilityNeeds} className="field" />
        </Field>
      </Section>

      <Section title="Practical details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="When do you need to move?" name="moveInDate">
            <input id="moveInDate" name="moveInDate" type="date" defaultValue={ad?.moveInDate} className="field" />
          </Field>
          <Field label="Weekly budget (£)" name="budgetWeekly" hint="Leave blank if housing benefit covers it.">
            <input id="budgetWeekly" name="budgetWeekly" type="number" min={0} step={5} defaultValue={ad?.budgetWeekly} className="field" />
          </Field>
          <Field label="Household preference" name="genderArrangement">
            <select id="genderArrangement" name="genderArrangement" defaultValue={ad?.genderArrangement ?? "ANY"} className="field">
              {Object.entries(GENDER_ARRANGEMENTS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Your age" name="age" hint="Providers often have age criteria. Shown only if you allow it.">
            <input id="age" name="age" type="number" min={16} max={120} defaultValue={ad?.age} className="field" />
          </Field>
        </div>
      </Section>

      <Section title="In your words">
        <Field label="About me" name="about" error={state.errors?.about}>
          <textarea id="about" name="about" rows={6} defaultValue={ad?.about} className="field" placeholder="A bit about you, your situation and what a good home would look like." />
        </Field>
        <Field label="What I'm looking for" name="lookingFor">
          <textarea id="lookingFor" name="lookingFor" rows={5} defaultValue={ad?.lookingFor} className="field" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Profile photo" name="photo" hint="Optional. Only shown if you turn photos on." error={state.errors?.photo}>
            <input id="photo" name="photo" type="file" accept="image/*" className="field" />
          </Field>
          <Field label="Video introduction link" name="videoUrl" hint="YouTube or Vimeo. Optional." error={state.errors?.videoUrl}>
            <input id="videoUrl" name="videoUrl" defaultValue={ad?.videoUrl} className="field" placeholder="https://" />
          </Field>
        </div>
      </Section>

      <SubmitButton pendingLabel="Saving…">{ad ? "Save changes" : "Publish advert"}</SubmitButton>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <h2 className="text-[20px]">{title}</h2>
      {children}
    </section>
  );
}
