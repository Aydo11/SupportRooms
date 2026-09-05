"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertSupportTypeAction } from "@/server/actions/admin";

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type SupportType = { slug: string; label: string; active: boolean };

export function SupportTypeEditor({ supportTypes }: { supportTypes: SupportType[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const save = (slug: string, value: string) =>
    startTransition(async () => {
      await upsertSupportTypeAction(slug, value.trim());
      setLabel("");
      setEdits((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
      router.refresh();
    });

  return (
    <section className="card p-6">
      <h2 className="text-[20px]">Support categories</h2>
      <p className="mt-2 text-[15px] text-ink-soft">
        Renaming a category changes the label everywhere it appears. The slug stays fixed, so
        existing adverts keep their categories.
      </p>

      <ul className="mt-5 divide-y divide-line">
        {supportTypes.map((type) => {
          const value = edits[type.slug] ?? type.label;
          const changed = value.trim() !== type.label && value.trim().length > 1;
          return (
            <li key={type.slug} className="flex flex-wrap items-center gap-3 py-3">
              <label className="sr-only" htmlFor={`type-${type.slug}`}>{type.label}</label>
              <input
                id={`type-${type.slug}`}
                className="field max-w-xs"
                value={value}
                onChange={(event) =>
                  setEdits((current) => ({ ...current, [type.slug]: event.target.value }))
                }
              />
              <code className="text-[13px] text-ink-faint">{type.slug}</code>
              {!type.active && <span className="chip">Hidden</span>}
              {changed && (
                <button className="btn-secondary" disabled={pending} onClick={() => save(type.slug, value)}>
                  Save
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="new-support-type" className="mb-1 block text-[13px] text-ink-faint">
            Add a category
          </label>
          <input
            id="new-support-type"
            className="field"
            placeholder="e.g. Refugees and asylum seekers"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
        <button
          className="btn-primary"
          disabled={pending || label.trim().length < 2}
          onClick={() => save(slugify(label), label)}
        >
          {pending ? "Saving…" : "Add category"}
        </button>
      </div>
    </section>
  );
}
