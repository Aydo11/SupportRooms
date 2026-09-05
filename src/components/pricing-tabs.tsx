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
      <div className="relative inline-flex rounded-pill border border-line bg-white p-1">
        <span
          className={clsx(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-pill bg-ink transition-transform duration-300 ease-out",
            tab === "referrer" && "translate-x-[calc(100%+8px)]",
          )}
          aria-hidden="true"
        />
        {(
          [
            ["provider", "For providers"],
            ["referrer", "For professional referrers"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={clsx(
              "relative z-10 rounded-pill px-4 py-2 text-[14px] font-medium transition-colors duration-200 sm:px-5",
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
