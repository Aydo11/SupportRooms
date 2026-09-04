import { PIPELINE, PIPELINE_LABELS } from "@/lib/taxonomy";
import { clsx } from "@/lib/clsx";

/** Shared status trail for requests and referrals — same stages, same shape. */
export function PipelineTrail({ status }: { status: string }) {
  if (status === "DECLINED" || status === "WITHDRAWN") {
    return (
      <p className="rounded-[10px] border border-line bg-paper-sunk px-4 py-3 text-[14px] text-ink-soft">
        {PIPELINE_LABELS[status]}
      </p>
    );
  }

  const index = PIPELINE.indexOf(status as (typeof PIPELINE)[number]);

  return (
    <ol className="flex flex-wrap gap-1.5">
      {PIPELINE.map((stage, i) => (
        <li
          key={stage}
          className={clsx(
            "rounded-pill px-2.5 py-1 text-[12px]",
            i < index && "bg-pine-light text-pine-dark",
            i === index && "bg-pine text-white",
            i > index && "bg-paper-sunk text-ink-faint",
          )}
          aria-current={i === index ? "step" : undefined}
        >
          {PIPELINE_LABELS[stage]}
        </li>
      ))}
    </ol>
  );
}
