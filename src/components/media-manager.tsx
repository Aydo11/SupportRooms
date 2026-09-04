"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import {
  deleteMediaAction,
  reorderMediaAction,
  setPrimaryMediaAction,
  submitListingAction,
  uploadListingMediaAction,
} from "@/server/actions/listings";
import { Field, FormError, FormSuccess, SubmitButton } from "./ui";
import { clsx } from "@/lib/clsx";

type Item = { id: string; url: string; type: string; caption: string | null; isPrimary: boolean };

export function MediaManager({
  listingId,
  status,
  media,
}: {
  listingId: string;
  status: string;
  media: Item[];
}) {
  const [state, action] = useFormState(uploadListingMediaAction, { ok: false });
  const [items, setItems] = useState(media);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => setItems(media), [media]);

  function move(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const next = [...items];
    const from = next.findIndex((i) => i.id === sourceId);
    const to = next.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    startTransition(() => reorderMediaAction(listingId, next.map((i) => i.id)));
  }

  return (
    <div className="space-y-6">
      <form action={action} className="card space-y-4 p-6">
        <input type="hidden" name="listingId" value={listingId} />
        <FormError message={state.errors?.form} />
        <FormSuccess message={state.ok ? state.message : undefined} />

        <Field
          label="Add photos"
          name="files"
          hint="JPG, PNG or WebP, up to 8MB each. You can select several at once."
          error={state.errors?.files}
        >
          <input id="files" name="files" type="file" accept="image/*" multiple className="field" />
        </Field>

        <Field label="Video link" name="videoUrl" hint="A YouTube or Vimeo link, if you have a walkthrough.">
          <input id="videoUrl" name="videoUrl" type="url" placeholder="https://" className="field" />
        </Field>

        <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
      </form>

      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragging(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dragging && move(dragging, item.id)}
              className={clsx(
                "card overflow-hidden",
                item.isPrimary && "ring-2 ring-pine",
                dragging === item.id && "opacity-60",
              )}
            >
              <div className="aspect-[4/3] bg-paper-sunk">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.caption ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center px-2 text-center text-[12px] text-ink-faint">
                    Video link
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                {item.isPrimary ? (
                  <span className="text-[12px] text-pine-dark">Main photo</span>
                ) : (
                  <button
                    className="text-[12px] text-ink-soft hover:text-ink"
                    disabled={pending}
                    onClick={() => startTransition(() => setPrimaryMediaAction(listingId, item.id))}
                  >
                    Make main
                  </button>
                )}
                <button
                  className="text-[12px] text-clay-dark hover:underline"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteMediaAction(listingId, item.id))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(status === "DRAFT" || status === "REJECTED") && (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-[15px] text-ink-soft">
            Happy with it? Send it to our team — most adverts are reviewed within a working day.
          </p>
          <button
            className="btn-primary"
            disabled={pending}
            onClick={() => startTransition(() => submitListingAction(listingId).catch(() => {}))}
          >
            Submit for review
          </button>
        </div>
      )}
    </div>
  );
}
