"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Segmented control with a sliding highlight. Both panels are pre-rendered on
 * the server and passed down as nodes, so switching tabs is just swapping
 * which one is mounted — no second data fetch, no loading state.
 */
export function PricingTabs({
  providerPanel,
  referrerPanel,
}: {
  providerPanel: React.ReactNode;
  referrerPanel: React.ReactNode;
}) {
  const [tab, setTab] = useState<"provider" | "referrer">("provider");

  return (
    <div>
      <div className="relative grid w-full max-w-[430px] grid-cols-2 overflow-hidden rounded-pill border border-line bg-white p-1">
        <span
          className={clsx(
            "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-pill bg-ink transition-transform duration-300 ease-out",
            tab === "referrer" && "translate-x-full",
          )}
          aria-hidden="true"
        />
        {(
          [
            ["provider", "Providers"],
            ["referrer", "Referral agencies"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={clsx(
              "relative z-10 min-w-0 rounded-pill px-3 py-2.5 text-center text-[14px] font-medium transition-colors duration-200 sm:px-5",
              tab === value ? "text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div key={tab} className="mt-8 animate-fade-in-up">
        {tab === "provider" ? providerPanel : referrerPanel}
      </div>
    </div>
  );
}
