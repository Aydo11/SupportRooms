"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endSponsorshipAction, featureListingAction } from "@/server/actions/billing";
import type { SponsorPackage } from "@/lib/sponsor-packages";
import { money, shortDate } from "@/lib/format";
import { clsx } from "@/lib/clsx";

const PACKAGES: { key: SponsorPackage; label: string; price: number; note: string }[] = [
  { key: "WEEK", label: "7 days", price: 1900, note: "A short push while a room is empty." },
  { key: "MONTH", label: "30 days", price: 5900, note: "The usual choice. Outranks 7-day slots." },
  { key: "QUARTER", label: "90 days", price: 14900, note: "Top of the sponsored slots all quarter." },
];

export function SponsorPanel({
  listingId,
  featured,
  featuredUntil,
  impressions,
  clicks,
  includedSlots,
  usedSlots,
  live,
  paymentsEnabled,
}: {
  listingId: string;
  featured: boolean;
  featuredUntil: string | null;
  impressions: number;
  clicks: number;
  includedSlots: number;
  usedSlots: number;
  live: boolean;
  paymentsEnabled: boolean;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<SponsorPackage>("MONTH");
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hasCredit = usedSlots < includedSlots;

  if (!live) {
    return (
      <p className="card p-5 text-[15px] text-ink-soft">
        Only live adverts can be sponsored. Once this one is approved you&apos;ll be able to buy a
        slot here.
      </p>
    );
  }

  return (
    <div className="card p-5">
      {featured ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[16px] text-clay">Sponsored</p>
              <p className="mt-0.5 text-[14px] text-ink-soft">
                {featuredUntil ? `Runs until ${shortDate(new Date(featuredUntil))}.` : "No end date set."}
              </p>
            </div>
            <button
              className="btn-ghost text-clay-dark"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await endSponsorshipAction(listingId);
                  router.refresh();
                })
              }
            >
              Stop sponsoring
            </button>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4 text-[14px]">
            <div>
              <dt className="text-[13px] text-ink-faint">Times shown</dt>
              <dd>{impressions.toLocaleString("en-GB")}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-faint">Clicks</dt>
              <dd>{clicks.toLocaleString("en-GB")}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-faint">Click rate</dt>
              <dd>{impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : "—"}</dd>
            </div>
          </dl>

          <p className="mt-4 text-[13px] text-ink-faint">
            Buying again extends the end date rather than replacing it.
          </p>
        </>
      ) : (
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Sponsored adverts sit in up to three labelled slots at the top of the first page of
          matching searches, and get a highlighted pin on the map. They never appear on later pages,
          and paying doesn&apos;t change where your advert ranks organically, whether it gets
          verified, or how it&apos;s moderated.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {PACKAGES.map((option) => (
          <button
            key={option.key}
            onClick={() => setChoice(option.key)}
            aria-pressed={choice === option.key}
            className={clsx(
              "rounded-[10px] border p-4 text-left",
              choice === option.key ? "border-pine bg-pine-light" : "border-line bg-white hover:border-line-strong",
            )}
          >
            <span className="block text-[15px] font-medium">{option.label}</span>
            <span className="mt-1 block text-[18px]">{hasCredit ? "Included" : money(option.price)}</span>
            <span className="mt-1 block text-[13px] text-ink-soft">{option.note}</span>
          </button>
        ))}
      </div>

      {hasCredit && (
        <p className="mt-3 text-[14px] text-pine-dark">
          Your plan includes {includedSlots} sponsored slot{includedSlots === 1 ? "" : "s"} —{" "}
          {includedSlots - usedSlots} still free.
        </p>
      )}

      <button
        className="btn-primary mt-4"
        disabled={pending || (!hasCredit && !paymentsEnabled)}
        onClick={() =>
          startTransition(async () => {
            const response = await featureListingAction(listingId, choice);
            setResult(response?.message ?? null);
            router.refresh();
          })
        }
      >
        {pending ? "Setting up…" : !hasCredit && !paymentsEnabled ? "Payments unavailable" : featured ? "Extend sponsorship" : "Sponsor this advert"}
      </button>

      {result && <p className="mt-3 text-[14px] text-ink-soft">{result}</p>}
    </div>
  );
}
